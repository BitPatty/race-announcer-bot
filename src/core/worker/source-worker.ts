/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2022 Matteias Collet <matteias.collet@bluewin.ch>
 * Official Repository: https://github.com/BitPatty/RaceAnnouncerBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { CronJob } from 'cron';
import { v4 } from 'uuid';

import {
  EntrantInformation,
  RaceInformation,
  SourceConnector,
} from '../../models/interfaces';

import { TaskIdentifier, WorkerType } from '../../models/enums';
import SourceConnectorIdentifier from '../../connectors/source-connector-identifier.enum';

import ConfigService from '../config/config.service';
import LoggerService from '../logger/logger.service';
import RedisService from '../redis/redis-service';

import DateTimeUtils from '../../utils/date-time.utils';

import Worker from './worker.interface';

import { Entrant, PrismaClient, Race, Racer } from '@prisma/client';
import { prisma } from '../../prisma';

import enabledWorkers from '../../enabled-workers';

class SourceWorker<T extends SourceConnectorIdentifier> implements Worker {
  private readonly connector: SourceConnector<T>;
  private prismaClient: PrismaClient;
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
    this.prismaClient = prisma;
  }

  /**
   * Creates a racer or updates it if it already exists
   *
   * @param entrant  The entrant data
   * @returns        The old and updated entry
   */
  private async createOrUpdateRacer(
    entrant: EntrantInformation,
  ): Promise<[Racer | null, Racer]> {
    const existingRacer = await this.prismaClient.racer.findFirst({
      where: {
        identifier: entrant.identifier,
        connector: this.connector.connectorType,
      },
    });

    if (existingRacer)
      return [
        existingRacer,
        await this.prismaClient.racer.update({
          where: {
            id: existingRacer.id,
          },
          data: {
            identifier: entrant.identifier,
            display_name: entrant.displayName,
            full_name: entrant.fullName,
            connector: this.connector.connectorType,
          },
        }),
      ];

    return [
      null,
      await this.prismaClient.racer.create({
        data: {
          uuid: v4(),
          identifier: entrant.identifier,
          display_name: entrant.displayName,
          full_name: entrant.fullName,
          connector: this.connector.connectorType,
        },
      }),
    ];
  }

  /**
   * Creates a race or updated it if it already exists
   *
   * @param race    The race information
   * @param gameId  The game ID
   * @returns       The old and updated entry
   */
  private async createOrUpdateRace(
    race: RaceInformation,
    gameId: number,
  ): Promise<[Race | null, Race]> {
    const existingRace = await this.prismaClient.race.findFirst({
      where: {
        // Dupe identifiers are technically possible on SRL,
        // maybe even on RaceTime. Filtering 1 week old races
        // should avoid any collisions.
        created_at: {
          gt: DateTimeUtils.subtractHours(new Date(), 24 * 7),
        },
        identifier: race.identifier,
        connector: this.connector.connectorType,
      },
    });

    if (existingRace) {
      return [
        existingRace,
        await this.prismaClient.race.update({
          where: {
            id: existingRace.id,
          },
          data: {
            identifier: race.identifier,
            goal: race.goal ?? '-',
            url: race.url,
            connector: this.connector.connectorType,
            status: race.status,
            gameId: gameId,
            change_counter: existingRace.change_counter,
          },
        }),
      ];
    }

    return [
      null,
      await this.prismaClient.race.create({
        data: {
          uuid: v4(),
          identifier: race.identifier,
          goal: race.goal ?? '-',
          url: race.url,
          connector: this.connector.connectorType,
          status: race.status,
          gameId: gameId,
          change_counter: 0,
        },
      }),
    ];
  }

  /**
   * Syncs a race
   *
   * @param race           The race information
   * @param syncTimeStamp  The timestamp of the sync
   */
  private async syncRace(
    race: RaceInformation,
    syncTimeStamp: Date,
  ): Promise<void> {
    const game = await this.prismaClient.game.findFirst({
      where: {
        identifier: race.game.identifier,
        connector: this.connector.connectorType,
      },
    });

    // We only care about registered games since
    // other games cannot be tracked anyways
    if (!game) return;

    const racers: Racer[] = [];

    // Update racer entities
    for (const entrant of race.entrants)
      racers.push(await this.createOrUpdateRacer(entrant)[1]);

    const [oldRace, updatedRace] = await this.createOrUpdateRace(race, game.id);

    // Update the entrant list
    const existingEntrants = await this.prismaClient.entrant.findMany({
      where: {
        raceId: updatedRace.id,
      },
      include: {
        racer: true,
        race: true,
      },
    });

    const updatedEntrants: Entrant[] = [];

    // Add / Update entrants
    for (const racer of racers) {
      const existingEntrant = existingEntrants.find(
        (e) => e.racer.id === racer.id,
      );

      const entrantData = race.entrants.find(
        (e) => e.identifier === racer.identifier,
      ) as EntrantInformation;

      if (existingEntrant) {
        const updatedEntrant = await this.prismaClient.entrant.update({
          where: {
            id: existingEntrant.id,
          },
          data: {
            raceId: updatedRace.id,
            racerId: racer.id,
            status: entrantData.status,
            final_time: entrantData.finalTime,
          },
        });

        updatedEntrants.push(updatedEntrant);
      } else {
        const createdEntrant = await this.prismaClient.entrant.create({
          data: {
            uuid: v4(),
            raceId: updatedRace.id,
            racerId: racer.id,
            status: entrantData.status,
            final_time: entrantData.finalTime,
          },
        });

        updatedEntrants.push(createdEntrant);
      }
    }

    // Remove entrants that have left
    const removedEntrantIds = existingEntrants
      .filter((e) => !updatedEntrants.some((u) => u.id === e.id))
      .map((e) => e.id);

    if (removedEntrantIds.length > 0)
      await this.prismaClient.entrant.deleteMany({
        where: {
          id: { in: removedEntrantIds },
        },
      });

    // Update the tracker timestamps
    const hasEntrantChanges =
      removedEntrantIds.length > 0 ||
      existingEntrants.length !== race.entrants.length ||
      updatedEntrants.some(
        (e) =>
          existingEntrants.find((x) => x.id === e.id)?.updated_at !==
          e.updated_at,
      );

    const hasRaceChanges = updatedRace.updated_at !== oldRace?.updated_at;

    if (hasRaceChanges || hasEntrantChanges) {
      updatedRace.change_counter++;
      LoggerService.log(
        `Race change detected: ${race.identifier} / Game: ${game.id} (${game.abbreviation} of ${game.connector}) / Change Counter: ${updatedRace.change_counter}`,
      );
    } else {
      LoggerService.debug(
        `Unchanged race: ${race.identifier} / Game: ${game.id} (${game.abbreviation} of ${game.connector}) / Change Counter: ${updatedRace.change_counter}`,
      );
    }

    await this.prismaClient.race.update({
      where: {
        id: updatedRace.id,
      },
      data: {
        change_counter: updatedRace.change_counter,
        last_sync_at: syncTimeStamp,
      },
    });
  }

  /**
   * Updates the providers race data to the local database
   */
  private async syncRaces(): Promise<void> {
    LoggerService.log('Synchronizing races');
    const syncTimeStamp = new Date();

    const syncToLocal = async (race: RaceInformation): Promise<void> => {
      try {
        await this.syncRace(race, syncTimeStamp);
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
    const unsyncedRaces = await this.prismaClient.race.findMany({
      where: {
        identifier: {
          notIn: raceList.map((r) => r.identifier),
        },
        status: {
          notIn: ['finished', 'over'],
        },
        created_at: {
          gt: DateTimeUtils.subtractHours(new Date(), 48),
        },
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

    for (const [idx, game] of gameList.entries()) {
      LoggerService.log(`Updating ${idx + 1}/${gameCount}: ${game.name}`);
      const existingGame = await this.prismaClient.game.findFirst({
        where: {
          identifier: game.identifier,
          connector: this.connector.connectorType,
        },
      });

      if (existingGame) {
        await this.prismaClient.game.update({
          where: {
            id: existingGame.id,
          },
          data: {
            identifier: game.identifier,
            name: game.name,
            abbreviation: game.abbreviation,
            image_url: game.imageUrl,
          },
        });
      } else {
        await this.prismaClient.game.create({
          data: {
            uuid: v4(),
            identifier: game.identifier,
            name: game.name,
            abbreviation: game.abbreviation,
            image_url: game.imageUrl,
            connector: this.connector.connectorType,
          },
        });
      }
    }
  }

  /**
   * Sets up the race sync job
   *
   * @param maxLocktimeInSeconds The max duration of which the job should be reserved
   */
  private initRaceSyncJob(maxLocktimeInSeconds = 30): void {
    this.raceSyncJob = new CronJob(ConfigService.raceSyncInterval, async () => {
      try {
        LoggerService.log('Attempting to reserve race sync job');
        const reservedByCurrentInstance = await RedisService.tryReserveTask(
          TaskIdentifier.RACE_SYNC,
          this.connector.connectorType,
          ConfigService.instanceUuid,
          maxLocktimeInSeconds,
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
      } finally {
        await RedisService.freeTask(
          TaskIdentifier.RACE_SYNC,
          this.connector.connectorType,
          ConfigService.instanceUuid,
        );
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
  public start(): void {
    this.initRaceSyncJob();
    this.initGameSyncJob();
    this.gameSyncJob.start();
    this.raceSyncJob.start();
  }

  /**
   * Cleans up used resources
   */
  public dispose(): void {
    LoggerService.log('Stopping Game Sync');
    this.gameSyncJob.stop();
    LoggerService.log('Stopping Race Sync');
    this.raceSyncJob.stop();
  }
}

export default SourceWorker;
