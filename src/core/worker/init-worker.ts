import { parentPort } from 'worker_threads';

import {
  DestinationConnectorIdentifier,
  SourceConnectorIdentifier,
  WorkerIngressType,
  WorkerType,
} from '../../models/enums';
import WorkerEgressType from '../../models/enums/worker-egress-type.enum';

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

const workerName = `${selectedWorkerType}|${providerArg}`;

/**
 * Start the procedure
 */
const bootstrap = async (): Promise<void> => {
  parentPort?.postMessage(`[Worker] (${workerName}) Starting..`);
  await workerInstance.start();
  parentPort?.postMessage(`[Worker] (${workerName}) Started`);
};

/**
 * Clean up the worker and ready for exit
 */
const cleanup = async (): Promise<void> => {
  LoggerService.log(`[Worker] (${workerName}) Cleaning up`);
  await workerInstance.dispose();
  LoggerService.log(`[Worker] (${workerName}) Finished cleaning up`);
  parentPort?.postMessage(WorkerIngressType.CLEANUP_FINISHED);
  parentPort?.close();
};

void bootstrap()
  .then(() => {
    parentPort?.on('message', async (msg) => {
      LoggerService.log(
        `[Worker] (${workerName}) Received parent message "${msg}"`,
      );
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
  })
  .catch(async (err) => {
    try {
      LoggerService.error(`Failed bootstrap`, err);
      await cleanup();
    } finally {
      process.exit(1);
    }
  });
