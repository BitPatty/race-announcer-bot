/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2021 Matteias Collet <matteias.collet@bluewin.ch>
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

import * as wtfnode from 'wtfnode';
import { CronJob } from 'cron';

import { TaskIdentifier, WorkerType } from './models/enums';
import LogLevel from './core/logger/log-level.enum';

import ConfigService from './core/config/config.service';
import DatabaseService from './core/database/database-service';
import LoggerService from './core/logger/logger.service';
import RedisService from './core/redis/redis-service';
import WorkerService from './core/worker/worker.service';
import enabledWorkers from './enabled-workers';

process.on('uncaughtException', (err: Error, origin: string) => {
  LoggerService.error(`Uncaught exception: ${err} at ${origin}`);
  process.exit(1);
});

// Keeps track of active instances
const workerInstances = new Map<
  string,
  {
    worker: WorkerService<WorkerType>;
    startup: () => Promise<void>;
  }
>();

// CronJob to check if all workers are alive if not, trigger a shutdown of the application.
// It's easier to simply restart the whole application automatically rather than trying to
// handle revives of individual workers.
const healthCheck = new CronJob(ConfigService.workerHealthCheckInterval, () => {
  LoggerService.log('Running healthcheck');

  // Log memory usage for traceability
  const { heapUsed, heapTotal } = process.memoryUsage();
  LoggerService.debug(
    `Heap usage is at ${Math.floor(heapUsed / 1024 / 1024)}/${Math.floor(
      heapTotal / 1024 / 1024,
    )}MB`,
  );

  for (const workerInstance of workerInstances.values()) {
    if (!workerInstance.worker.IsHealthy) {
      LoggerService.warn(
        `Found dead worker (${workerInstance.worker.identifier})`,
      );
      LoggerService.warn(`Shutting down`);
      process.kill(process.pid, 'SIGINT');
      return;
    }
  }
  LoggerService.log('Healthcheck finished');
});

// Whenever worker shuts down, also shutdown all the other workers
const workerShutdownCallback = async (
  workerIdentifier: string,
  error?: string,
): Promise<void> => {
  LoggerService.log(`Worker ${workerIdentifier} exited`, error);

  // Remove the worker that has exited from the list of active instances
  workerInstances.delete(workerIdentifier);

  // If this was the last worker, shut down the application
  if (workerInstances.size === 0) {
    LoggerService.log(`No workers left, exiting main thread`);

    // Stop redis connection
    try {
      await RedisService.dispose();
    } catch (err) {
      LoggerService.error('Failed to dispose redis service');
    }

    // Remove the cronjob handle
    healthCheck.stop();

    // Dump the list of active handles in debug mode for traceability
    if (ConfigService.logLevel === LogLevel.DEBUG) wtfnode.dump();

    // Some handles may or may not take a bit longer to be freed.
    // Force kill the process if this happens
    setTimeout(() => {
      LoggerService.warn(`Process still alive, forcing exit`);
      process.kill(process.pid, 'SIGKILL');
    }, 30);

    // Exit the application
    process.exit(0);
  } else {
    LoggerService.log(`${workerInstances.size} workers left`);
  }
};

// Initialize the worker instances
for (const worker of enabledWorkers) {
  for (const workerType of worker.types) {
    // Don't use an arrow function for the callback since we wanna have
    // the context available
    const workerInstance = new WorkerService(workerType, function (err) {
      void workerShutdownCallback(this.identifier, err);
    });

    workerInstances.set(workerInstance.identifier, {
      worker: workerInstance,
      startup: () => workerInstance.start(worker.connector),
    });
  }
}

// Bootstrap the application routine
const bootstrap = async (): Promise<void> => {
  LoggerService.log(
    `Attempting to reserve migration task as ${ConfigService.instanceUuid}`,
  );
  await RedisService.connect();

  // Migrate the database if necessary
  const migrationTask = await RedisService.tryReserveTask(
    TaskIdentifier.MIGRATE_DATABASE,
    'init',
    ConfigService.instanceUuid,
    30,
  );

  if (migrationTask) {
    LoggerService.log(`Migrating database`);
    const databaseConnection = await DatabaseService.getConnection();
    await databaseConnection.runMigrations();
    await DatabaseService.closeConnection();
    LoggerService.log(`Database migrated`);
    await RedisService.freeTask(
      TaskIdentifier.MIGRATE_DATABASE,
      'init',
      ConfigService.instanceUuid,
    );
  } else {
    LoggerService.log('Failed to get reserve database migration job');
  }

  for (const workerInstance of workerInstances.values()) {
    await workerInstance.startup();
  }
};

// Start the app
void bootstrap().then(() => {
  healthCheck.start();
  LoggerService.log('Startup completed');
});
