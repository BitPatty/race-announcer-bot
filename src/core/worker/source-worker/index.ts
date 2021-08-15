import { Connection, In, MoreThan, Not, Repository } from 'typeorm';
import { CronJob } from 'cron';

import {
  EntrantEntity,
  GameEntity,
  RaceEntity,
  RacerEntity,
} from '../../../models/entities';

import {
  EntrantInformation,
  RaceInformation,
  SourceConnector,
} from '../../../models/interfaces';

import {
  RaceStatus,
  SourceConnectorIdentifier,
  TaskIdentifier,
  WorkerType,
} from '../../../models/enums';

import ConfigService from '../../config/config.service';
import DatabaseService from '../../database/database-service';
import LoggerService from '../../logger/logger.service';
import RedisService from '../../redis/redis-service';

import DateTimeUtils from '../../../utils/date-time.utils';

import Worker from '../worker.interface';
import enabledWorkers from '../../../enabled-workers';

class SourceWorker<T extends SourceConnectorIdentifier> implements Worker {
  private readonly connector: SourceConnector<T>;
  private databaseConnection: Connection;
  private gameSyncJob: CronJob;
  private raceSyncJob: CronJob;

  public constructor(connector: SourceConnectorIdentifier) {
    const worker = enabledWorkers.find((w) => {
      return (
        w.connector === connector && w.types.includes(WorkerType.SOURCE_SYNC)
      );
    });

    if (!worker) throw new Error(`Invalid source connector ${connector}`);
    this.connector = new worker.ctor() as unknown as SourceConnector<T>;
  }

  private async syncRace(
    race: RaceInformation,
    syncTimeStamp: Date,
    entrantRepository: Repository<EntrantEntity>,
    gameRepository: Repository<GameEntity>,
    raceRepository: Repository<RaceEntity>,
    racerRepository: Repository<RacerEntity>,
  ): Promise<void> {
    const game = await gameRepository.findOne({
      where: {
        identifier: race.game.identifier,
        connector: this.connector.connectorType,
      },
    });

    // We only care about registered games since
    // other games cannot be tracked anyways
    if (!game) return;

    const racers: RacerEntity[] = [];

    // Update racer entities
    for (const entrant of race.entrants) {
      const existingRacer = await racerRepository.findOne({
        where: {
          identifier: entrant.displayName.toLowerCase(),
          connector: this.connector.connectorType,
        },
      });

      const updatePayload: RacerEntity = {
        ...(existingRacer ?? {}),
        ...new RacerEntity({
          identifier: entrant.displayName.toLowerCase(),
          displayName: entrant.displayName,
          connector: this.connector.connectorType,
        }),
      };

      const updatedRacer = await racerRepository.save(updatePayload);
      racers.push(updatedRacer);
    }

    // Update the race itself
    const existingRace = await raceRepository.findOne({
      where: {
        // Dupe identifiers are technically possible on SRL,
        // maybe even on RaceTime. Filtering 1 week old races
        // should avoid any collisions.
        createdAt: MoreThan(DateTimeUtils.subtractHours(new Date(), 24 * 7)),
        identifier: race.identifier,
        connector: this.connector.connectorType,
      },
    });

    const updatedRace = await raceRepository.save({
      ...(existingRace ?? {}),
      ...new RaceEntity({
        identifier: race.identifier,
        goal: race.goal ?? '-',
        url: race.url,
        connector: this.connector.connectorType,
        status: race.status,
        game,
        changeCounter: existingRace?.changeCounter ?? 0,
      }),
    });

    // Update the entrant list
    const existingEntrants = await entrantRepository.find({
      relations: [
        nameof<EntrantEntity>((e) => e.racer),
        nameof<EntrantEntity>((e) => e.race),
      ],
      where: {
        race: updatedRace,
      },
    });

    const updatedEntrants: EntrantEntity[] = [];

    // Add / Update entrants
    for (const racer of racers) {
      const existingEntrant = existingEntrants.find(
        (e) => e.racer.id === racer.id,
      );

      const entrantData = race.entrants.find(
        (e) => e.displayName === racer.displayName,
      ) as EntrantInformation;

      const updatedEntrant = await entrantRepository.save({
        ...(existingEntrant ?? {}),
        ...new EntrantEntity({
          race: updatedRace,
          racer,
          status: entrantData.status,
          finalTime: entrantData.finalTime,
        }),
      });

      updatedEntrants.push(updatedEntrant);
    }

    // Remove entrants that have left
    const removedEntrantIds = existingEntrants
      .filter((e) => !updatedEntrants.some((u) => u.id === e.id))
      .map((e) => e.id);

    if (removedEntrantIds.length > 0)
      await entrantRepository.delete({
        race: updatedRace,
        id: In(removedEntrantIds),
      });

    // Update the tracker timestamps
    const hasEntrantChanges =
      removedEntrantIds.length > 0 ||
      existingEntrants.length !== race.entrants.length ||
      updatedEntrants.some(
        (e) =>
          existingEntrants.find((x) => x.id === e.id)?.updatedAt !==
          e.updatedAt,
      );

    const hasRaceChanges = updatedRace.updatedAt !== existingRace?.updatedAt;

    if (hasRaceChanges || hasEntrantChanges) {
      updatedRace.changeCounter++;
      LoggerService.log(
        `Race change detected: ${race.identifier} / Game: ${game.id} (${game.abbreviation} of ${game.connector}) / Change Counter: ${updatedRace.changeCounter}`,
      );
    } else {
      LoggerService.debug(
        `Unchanged race: ${race.identifier} / Game: ${game.id} (${game.abbreviation} of ${game.connector}) / Change Counter: ${updatedRace.changeCounter}`,
      );
    }

    await raceRepository.save({
      ...updatedRace,
      lastSyncAt: syncTimeStamp,
    });
  }

  /**
   * Updates the providers race data to the local database
   */
  private async syncRaces(): Promise<void> {
    LoggerService.log('Synchronizing races');
    const syncTimeStamp = new Date();

    const [raceRepository, gameRepository, entrantRepository, racerRepository] =
      [
        this.databaseConnection.getRepository(RaceEntity),
        this.databaseConnection.getRepository(GameEntity),
        this.databaseConnection.getRepository(EntrantEntity),
        this.databaseConnection.getRepository(RacerEntity),
      ];

    const syncToLocal = async (race: RaceInformation): Promise<void> => {
      try {
        await this.syncRace(
          race,
          syncTimeStamp,
          entrantRepository,
          gameRepository,
          raceRepository,
          racerRepository,
        );
      } catch (err) {
        LoggerService.error(
          `Failed to sync race ${JSON.stringify(race)}: ${err}`,
        );
      }
    };

    const raceList = await this.connector.getActiveRaces();
    LoggerService.debug(`Found ${raceList.length} races to sync`);

    for (const race of raceList) {
      await syncToLocal(race);
    }

    // RaceTime drops races that are in the finished state
    // SRL drops races if they exceed the thershold of 200 active races
    // We fetch the data for those races manually in hopes to
    // be able to sync them
    LoggerService.log(`Syncing dropped races`);
    const unsyncedRaces = await raceRepository.find({
      where: {
        identifier: Not(In(raceList.map((r) => r.identifier))),
        status: Not(In([RaceStatus.FINISHED, RaceStatus.OVER])),
        createdAt: MoreThan(DateTimeUtils.subtractHours(new Date(), 24)),
        connector: this.connector.connectorType,
      },
    });

    // Running sequentially to avoid spamming the provider
    // with potentially invalid requests
    for (const unsyncedRace of unsyncedRaces) {
      try {
        LoggerService.log(`Syncing dead race: ${unsyncedRace.id}`);
        const raceData = await this.connector.getRaceById(
          unsyncedRace.identifier,
        );

        if (raceData) await syncToLocal(raceData);
        else LoggerService.warn(`Dropped race not found: ${unsyncedRace.id}`);
      } catch (err) {
        LoggerService.warn(`Failed to sync dead race: ${unsyncedRace.id}`);
      }
    }

    LoggerService.log('Synchronization finished');
  }

  /**
   * Syncs the game of the provider to the locaal database
   */
  private async syncGames(): Promise<void> {
    LoggerService.log('Fetching game list');
    const gameList = await this.connector.listGames();
    const gameCount = gameList.length;

    LoggerService.log(`Updating games in database (${gameCount} total)`);
    const gameRepository = this.databaseConnection.getRepository(GameEntity);

    for (const [idx, game] of gameList.entries()) {
      LoggerService.log(`Updating ${idx + 1}/${gameCount}: ${game.name}`);
      const existingGame = await gameRepository.findOne({
        where: {
          identifier: game.identifier,
          connector: this.connector.connectorType,
        },
      });

      await gameRepository.save({
        ...(existingGame ?? {}),
        ...game,
        connector: this.connector.connectorType,
      });
    }
  }

  /**
   * Sets up the race sync job
   *
   * @param lockTimeInSeconds The duration of which the job should be reserved
   */
  private initRaceSyncJob(lockTimeInSeconds = 10): void {
    this.raceSyncJob = new CronJob(ConfigService.raceSyncInterval, async () => {
      try {
        LoggerService.log('Attempting to reserve race sync job');
        const reservedByCurrentInstance = await RedisService.tryReserveTask(
          TaskIdentifier.RACE_SYNC,
          this.connector.connectorType,
          ConfigService.instanceUuid,
          lockTimeInSeconds,
        );

        if (!reservedByCurrentInstance) {
          LoggerService.log(`Could not reserve race sync job`);
          return;
        }

        LoggerService.log(`Successfully reserved race sync job`);
        await this.syncRaces();
        LoggerService.log(`Finished races sync`);
      } catch (err) {
        LoggerService.error('Failed to sync races', err);
      }
    });
  }

  /**
   * Sets up the game sync job
   *
   * @param lockTimeInSeconds The duration of which the job should be reserved
   */
  private initGameSyncJob(lockTimeInSeconds = 60 * 60): void {
    this.gameSyncJob = new CronJob(
      ConfigService.gameSyncInterval,
      async () => {
        try {
          LoggerService.log('Attempting to reserve game sync job');
          const reservedByCurrentInstance = await RedisService.tryReserveTask(
            TaskIdentifier.GAME_SYNC,
            this.connector.connectorType,
            ConfigService.instanceUuid,
            lockTimeInSeconds,
          );

          if (reservedByCurrentInstance) await this.syncGames();
          else LoggerService.log(`Could not reserve game sync job`);
        } catch (err) {
          LoggerService.error('Failed to sync games', err);
        }
      },
      undefined,
      false,
      undefined,
      null,
      true,
    );
  }

  /**
   * Start the workers routine
   */
  public async start(): Promise<void> {
    this.databaseConnection = await DatabaseService.getConnection();
    this.initRaceSyncJob();
    this.initGameSyncJob();
    this.gameSyncJob.start();
    this.raceSyncJob.start();
  }

  /**
   * Cleans up used resources
   */
  public async dispose(): Promise<void> {
    LoggerService.log('Stopping Game Sync');
    this.gameSyncJob.stop();
    LoggerService.log('Stopping Race Sync');
    this.raceSyncJob.stop();
    LoggerService.log('Closing Database Connection');
    await this.databaseConnection.close();
  }
}

export default SourceWorker;
