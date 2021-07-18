import { parentPort } from 'worker_threads';

import Worker from './worker.interface';

import {
  DestinationConnectorIdentifier,
  SourceConnectorIdentifier,
  WorkerIngressType,
  WorkerType,
} from '../../models/enums';
import WorkerEgressType from '../../models/enums/worker-egress-type.enum';

import ChatWorker from './chat-worker';
import Logger from '../logger/logger';
import SourceWorker from './source-worker';

const processArgs = process.argv;
Logger.log(`Starting worker with args => ${processArgs}`);

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
  Logger.log(`[Worker] (${workerName}) Cleaning up`);
  await workerInstance.dispose();
  Logger.log(`[Worker] (${workerName}) Finished cleaning up`);
  parentPort?.postMessage(WorkerIngressType.CLEANUP_FINISHED);
};

void bootstrap().then(() => {
  parentPort?.on('message', async (msg) => {
    Logger.log(`[Worker] (${workerName}) Received parent message "${msg}"`);
    if (msg === WorkerEgressType.CLEANUP) {
      await cleanup();
    }
  });
});
