import { parentPort } from 'worker_threads';

import { DestinationConnector } from '../../domain/interfaces';

import {
  DestinationConnectorIdentifier,
  DestinationEvent,
  WorkerIngressType,
} from '../../domain/enums';
import WorkerEgressType from '../../domain/enums/worker-egress-type.enum';

import DiscordConnector from '../../connectors/destination-connectors/discord.connector';

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
  !(Object.values(DestinationConnectorIdentifier) as string[]).includes(
    providerArg,
  )
) {
  throw new Error(`Unknown provider "${providerArg}"`);
}

const selectedProvider: DestinationConnectorIdentifier =
  providerArg as DestinationConnectorIdentifier;

/**
 * Get the provider connector for the specified
 * provider identifier
 * @param identifier The provider identifier
 * @returns The provider connector instance
 */
const getProvider = <T extends DestinationConnectorIdentifier>(
  identifier: T,
): DestinationConnector<T> => {
  switch (identifier) {
    case DestinationConnectorIdentifier.DISCORD:
      return new DiscordConnector() as unknown as DestinationConnector<T>;
    default:
      throw new Error(`Worker not configured for provider "${identifier}"`);
  }
};

const provider = getProvider(selectedProvider);
const workerName = provider.constructor.name;

provider.addEventListener(DestinationEvent.COMMAND_RECEIVED, (msg) => {
  console.log(`[Worker] (${workerName}) ${JSON.stringify(msg)}`);
});

provider.addEventListener(DestinationEvent.DISCONNECTED, () => {
  console.log(`[Worker] (${workerName}) Disconnected`);
});

/**
 * Clean up the worker and ready for exit
 */
const cleanup = async (): Promise<void> => {
  console.log(`[Worker] (${workerName}) Cleaning up`);
  await provider.dispose();
  console.log(`[Worker] (${workerName}) Finished cleaning up`);
  parentPort?.postMessage(WorkerIngressType.CLEANUP_FINISHED);
};

/**
 * Start up procedure
 */
const bootstrap = async (): Promise<void> => {
  parentPort?.postMessage(`[Worker] (${workerName}) Connecting..`);
  await provider.connect();
  parentPort?.postMessage(`[Worker] (${workerName}) Connected`);
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
