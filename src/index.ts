import * as wtfnode from 'wtfnode';
import { CronJob } from 'cron';

import {
  DestinationConnectorIdentifier,
  LogLevel,
  SourceConnectorIdentifier,
  WorkerType,
} from './models/enums';
import LoggerService from './core/logger/logger.service';
import WorkerService from './core/worker/worker.service';

import ConfigService from './core/config/config.service';

const workers = [
  {
    type: WorkerType.CHAT,
    connector: DestinationConnectorIdentifier.DISCORD,
  },
  {
    type: WorkerType.SOURCE_SYNC,
    connector: SourceConnectorIdentifier.SPEEDRUNSLIVE,
  },
];

const workerInstances = new Map<
  string,
  {
    worker: WorkerService<WorkerType>;
    startup: () => Promise<void>;
  }
>();

const healthCheck = new CronJob(ConfigService.workerHealthCheckInterval, () => {
  LoggerService.log('Running healthcheck');
  for (const workerInstance of workerInstances.values()) {
    if (!workerInstance.worker.IsHealthy) {
      LoggerService.warn(
        `Found dead worker (${workerInstance.worker.identifier})`,
      );
      LoggerService.warn(`Shutting down`);
      setTimeout(() => {
        LoggerService.warn(`Process still alive, forcing exit`);
        process.kill(process.pid, 'SIGKILL');
      }, 30);
      process.kill(process.pid, 'SIGINT');
      return;
    }
  }
  LoggerService.log('Healthcheck finished');
});

const workerShutdownCallback = (
  workerIdentifier: string,
  error?: string,
): void => {
  LoggerService.log(`Worker ${workerIdentifier} exited`, error);
  workerInstances.delete(workerIdentifier);

  if (workerInstances.size === 0) {
    healthCheck.stop();
    LoggerService.log(`No workers left, exiting main thread`);
    if (ConfigService.logLevel === LogLevel.DEBUG) wtfnode.dump();
    process.exit(0);
  } else {
    LoggerService.log(`${workerInstances.size} workers left`);
  }
};

for (const worker of workers) {
  const workerInstance = new WorkerService(worker.type, function (err) {
    workerShutdownCallback(this.identifier, err);
  });

  workerInstances.set(workerInstance.identifier, {
    worker: workerInstance,
    startup: () => workerInstance.start(worker.connector),
  });
}

const bootstrap = async (): Promise<void> => {
  for (const workerInstance of workerInstances.values()) {
    await workerInstance.startup();
  }
};

void bootstrap().then(() => {
  healthCheck.start();
  LoggerService.log(':)');
});
