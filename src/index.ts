import * as wtfnode from 'wtfnode';
import { CronJob } from 'cron';

import { LogLevel, TaskIdentifier, WorkerType } from './models/enums';

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

const monitorMemoryInterval = setInterval(() => {
  const { heapUsed, heapTotal } = process.memoryUsage();
  LoggerService.debug(
    `Heap usage is at ${Math.floor(heapUsed / 1024 / 1024)}/${Math.floor(
      heapTotal / 1024 / 1024,
    )}MB`,
  );
}, 10000);

// Keeps track of active instances
const workerInstances = new Map<
  string,
  {
    worker: WorkerService<WorkerType>;
    startup: () => Promise<void>;
  }
>();

// CronJob to check if all workers are alive
// if not, trigger a shutdown of the application.
// It's easier to simply restart the whole application
// automatically rather than trying to handle
// revives of individual workers.
const healthCheck = new CronJob(ConfigService.workerHealthCheckInterval, () => {
  LoggerService.log('Running healthcheck');
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

// Whenever worker shuts down, also shutdown
// all the other workers to cause a restart
// of the application itself.
const workerShutdownCallback = async (
  workerIdentifier: string,
  error?: string,
): Promise<void> => {
  LoggerService.log(`Worker ${workerIdentifier} exited`, error);

  // Remove the worker that has exited from the
  // list of active instances
  workerInstances.delete(workerIdentifier);

  // If this was the last worker, shut down
  // the application
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

    // Dump the list of active handles in debug mode
    if (ConfigService.logLevel === LogLevel.DEBUG) wtfnode.dump();

    // Stop memory log interval
    clearInterval(monitorMemoryInterval);

    // Some handles may or may not take a bit longer
    // to be freed. Force kill the process if this happens
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
    // Don't use an arrow function for the callback
    // since we wanna have the context available
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
  const migrationTask = await RedisService.tryReserveTask(
    TaskIdentifier.MIGRATE_DATABASE,
    'init',
    ConfigService.instanceUuid,
    30,
  );

  if (migrationTask) {
    // Migrate the database
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

// Actually start the application
void bootstrap().then(() => {
  healthCheck.start();
  LoggerService.log('Startup completed');
});
