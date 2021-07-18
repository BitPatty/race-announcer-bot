import * as wtfnode from 'wtfnode';
import { CronJob } from 'cron';

import {
  DestinationConnectorIdentifier,
  LogLevel,
  SourceConnectorIdentifier,
  WorkerType,
} from './models/enums';
import Logger from './core/logger/logger';
import Worker from './core/worker/worker';

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
    worker: Worker<WorkerType>;
    startup: () => Promise<void>;
  }
>();

const healthCheck = new CronJob(ConfigService.workerHealthCheckInterval, () => {
  Logger.log('Running healthcheck');
  for (const workerInstance of workerInstances.values()) {
    if (!workerInstance.worker.IsHealthy) {
      Logger.warn(`Found dead worker (${workerInstance.worker.identifier})`);
      Logger.warn(`Shutting down`);
      process.kill(process.pid, 'SIGINT');
      return;
    }
  }
  Logger.log('Healthcheck finished');
});

const workerShutdownCallback = (
  workerIdentifier: string,
  error?: string,
): void => {
  Logger.log(`Worker ${workerIdentifier} exited`, error);
  workerInstances.delete(workerIdentifier);

  if (workerInstances.size === 0) {
    healthCheck.stop();
    Logger.log(`No workers left, exiting main thread`);
    if (ConfigService.logLevel === LogLevel.DEBUG) wtfnode.dump();
    process.exit(0);
  } else {
    Logger.log(`${workerInstances.size} workers left`);
  }
};

for (const worker of workers) {
  const workerInstance = new Worker(worker.type, function (err) {
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
  Logger.log(':)');
});
