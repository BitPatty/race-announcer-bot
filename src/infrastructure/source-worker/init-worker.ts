import { Connection, In } from 'typeorm';
import { CronJob } from 'cron';
import { parentPort } from 'worker_threads';

import { Entrant, SourceConnector } from '../../domain/interfaces';

import {
  SourceConnectorIdentifier,
  WorkerIngressType,
} from '../../domain/enums';
import WorkerEgressType from '../../domain/enums/worker-egress-type.enum';

import RaceTimeGGConnector from '../../connectors/source-connectors/racetimegg/racetimegg.connector';
import SpeedRunsLiveConnector from '../../connectors/source-connectors/speedrunslive/speedrunslive.connector';

import ConfigService from '../config/config.service';
import DatabaseService from '../database/database.service';

import {
  EntrantEntity,
  GameEntity,
  RaceEntity,
  RacerEntity,
} from '../../domain/models';

const processArgs = process.argv;
console.log('Starting worker with args => ', processArgs);

// The worker expects one arg with the identifier
// of the connector that should be initiated
if (processArgs.length < 3) throw new Error('Missing provider identifier');
if (processArgs.length > 3) throw new Error('Too many arguments');
const providerArg = processArgs[2];

// Validate that the suppied identifier maps to
// an actual connector
if (
  !(Object.values(SourceConnectorIdentifier) as string[]).includes(providerArg)
) {
  throw new Error(`Unknown provider "${providerArg}"`);
}

const selectedProvider: SourceConnectorIdentifier =
  providerArg as SourceConnectorIdentifier;

/**
 * Get the provider connector for the specified
 * provider identifier
 * @param identifier The provider identifier
 * @returns The provider connector instance
 */
const getProvider = <T extends SourceConnectorIdentifier>(
  identifier: T,
): SourceConnector<T> => {
  switch (identifier) {
    case SourceConnectorIdentifier.RACETIME_GG:
      return new RaceTimeGGConnector() as unknown as SourceConnector<T>;
    case SourceConnectorIdentifier.SPEEDRUNSLIVE:
      return new SpeedRunsLiveConnector() as unknown as SourceConnector<T>;
    default:
      throw new Error(`Worker not configured for provider "${identifier}"`);
  }
};

const provider = getProvider(selectedProvider);
const workerName = provider.constructor.name;
let databaseConnection: Connection;

const gameSyncJob = new CronJob(
  ConfigService.gameSyncInterval,
  async () => {
    try {
      console.log('Fetching game list');
      const gamelist = await provider.listGames();

      console.log(`Updating games in database (${gamelist.length} total)`);
      const gameRepository = databaseConnection.getRepository(GameEntity);

      for (const game of gamelist) {
        console.log(`Updating ${game.name}`);
        const existingGame = await gameRepository.find({
          where: {
            identifier: game.identifier,
            connector: provider.connectorType,
          },
        });

        await gameRepository.save({
          ...(existingGame ?? {}),
          ...game,
        });
      }
    } catch (err) {
      console.error(err);
    }
  },
  undefined,
  false,
  undefined,
  null,
  true,
);

const raceSyncJob = new CronJob(ConfigService.raceSyncInterval, async () => {
  console.log('Synchronizing races');
  const syncTimeStamp = new Date();

  const raceList = await provider.getActiveRaces();
  const raceRepository = databaseConnection.getRepository(RaceEntity);
  const gameRepository = databaseConnection.getRepository(GameEntity);
  const entrantRepository = databaseConnection.getRepository(EntrantEntity);
  const racerRepository = databaseConnection.getRepository(RacerEntity);

  for (const race of raceList) {
    try {
      console.log(`Updating ${race.identifier}`);
      const game = await gameRepository.findOne({
        where: {
          identifier: race.game.identifier,
          connector: provider.connectorType,
        },
      });

      if (!game) continue;

      const racers: RacerEntity[] = [];

      // Update racer entities
      for (const entrant of race.entrants) {
        const existingRacer = await racerRepository.findOne({
          where: {
            identifier: entrant.displayName.toLowerCase(),
            connector: provider.connectorType,
          },
        });

        const updatePayload: RacerEntity = {
          ...(existingRacer ?? {}),
          ...new RacerEntity({
            identifier: entrant.displayName.toLowerCase(),
            displayName: entrant.displayName,
            connector: provider.connectorType,
          }),
        };

        const updatedRacer = await racerRepository.save(updatePayload);
        racers.push(updatedRacer);
      }

      // Update the race itself
      const existingRace = await raceRepository.findOne({
        where: {
          identifier: race.identifier,
          connector: provider.connectorType,
        },
      });

      const updatedRace = await raceRepository.save({
        ...(existingRace ?? {}),
        ...new RaceEntity({
          identifier: race.identifier,
          goal: race.goal ?? '-',
          connector: provider.connectorType,
          status: race.status,
          game,
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
        ) as Entrant;

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
        existingEntrants.length !== race.entrants.length;

      const hasRaceChanges = updatedRace.updatedAt !== existingRace?.updatedAt;

      await raceRepository.save({
        ...updatedRace,
        lastSyncAt: syncTimeStamp,
        lastChangeAt:
          hasEntrantChanges || hasRaceChanges
            ? new Date()
            : updatedRace.lastChangeAt,
      });
    } catch (err) {
      console.error(err);
    }
  }
});

/**
 * Clean up the worker and ready for exit
 */
const cleanup = async (): Promise<void> => {
  console.log(`[Worker] (${workerName}) Cleaning up`);
  await databaseConnection.close();
  console.log(`[Worker] (${workerName}) Finished cleaning up`);
  parentPort?.postMessage(WorkerIngressType.CLEANUP_FINISHED);
};

/**
 * Start up procedure
 */
const bootstrap = async (): Promise<void> => {
  databaseConnection = await DatabaseService.getConnection();
  gameSyncJob.start();
  raceSyncJob.start();
};

/**
 * Start up the worker
 */
void bootstrap().then(() => {
  parentPort?.on('message', async (msg) => {
    console.log(`[Worker] (${workerName}) Received parent message "${msg}"`);
    if (msg === WorkerEgressType.CLEANUP) {
      await cleanup();
    }
  });
});
