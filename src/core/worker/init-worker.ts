import { parentPort } from 'worker_threads';

import {
  DestinationConnectorIdentifier,
  SourceConnectorIdentifier,
  WorkerEgressType,
  WorkerIngressType,
  WorkerType,
} from '../../models/enums';

import AnnouncementWorker from './announcement-worker';
import LoggerService from '../logger/logger.service';

import ChatWorker from './chat-worker';
import SourceWorker from './source-worker';
import Worker from './worker.interface';

const processArgs = process.argv;
LoggerService.log(`Starting worker with args => ${processArgs}`);

if (processArgs.length < 4) throw new Error('Missing provider identifier');
if (processArgs.length > 4) throw new Error('Too many arguments');

const workerTypeArg = processArgs[2];
const providerArg = processArgs[3];

if (!(Object.values(WorkerType) as string[]).includes(workerTypeArg)) {
  throw new Error(`Unknown worker type ${workerTypeArg}`);
}

const selectedWorkerType: WorkerType = workerTypeArg as WorkerType;

const workerInstance: Worker = (() => {
  switch (selectedWorkerType) {
    case WorkerType.CHAT:
      return new ChatWorker(providerArg as DestinationConnectorIdentifier);
    case WorkerType.SOURCE_SYNC:
      return new SourceWorker(providerArg as SourceConnectorIdentifier);
    case WorkerType.ANNOUNCER:
      return new AnnouncementWorker(
        providerArg as DestinationConnectorIdentifier,
      );
    default:
      throw new Error(`Unsupported worker type ${selectedWorkerType}`);
  }
})();

process.env.WORKER_NAME = `${selectedWorkerType}|${providerArg}`;

/**
 * Start the procedure
 */
const bootstrap = async (): Promise<void> => {
  parentPort?.postMessage(`Starting..`);
  await workerInstance.start();
  parentPort?.postMessage(`Started`);
};

/**
 * Clean up the worker and ready for exit
 */
const cleanup = async (): Promise<void> => {
  LoggerService.log(`Cleaning up`);
  await workerInstance.dispose();
  LoggerService.log(`Finished cleaning up`);
  parentPort?.postMessage(WorkerIngressType.CLEANUP_FINISHED);
  parentPort?.close();
};

parentPort?.on('message', async (msg) => {
  LoggerService.log(`Received parent message "${msg}"`);
  if (msg === WorkerEgressType.CLEANUP) {
    try {
      await cleanup();
      process.exit(0);
    } catch (err) {
      LoggerService.error(err);
      process.exit(1);
    }
  }
});

void bootstrap()
  .then(() => {
    LoggerService.log('Bootstrap finished');
  })
  .catch(async (err) => {
    try {
      LoggerService.error(`Failed bootstrap`, err);
      await cleanup();
    } finally {
      process.exit(1);
    }
  });
