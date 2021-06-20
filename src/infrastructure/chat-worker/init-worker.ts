import { DestinationConnector } from '../../domain/interfaces';
import {
  DestinationConnectorIdentifier,
  WorkerIngressType,
} from '../../domain/enums';
import { parentPort } from 'worker_threads';
import DiscordConnector from '../../connectors/destination-connectors/discord.connector';
import WorkerEgressType from '../../domain/enums/worker-egress-type.enum';

const processArgs = process.argv;
console.log('Starting worker with args => ', processArgs);

if (processArgs.length < 3) {
  throw new Error('Missing provider identifier');
}

if (processArgs.length > 3) throw new Error('Too many arguments');

const providerArg = processArgs[2];

if (
  !(Object.values(DestinationConnectorIdentifier) as string[]).includes(
    providerArg,
  )
) {
  throw new Error(`Unknown provider "${providerArg}"`);
}

const selectedProvider: DestinationConnectorIdentifier =
  providerArg as DestinationConnectorIdentifier;

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

const cleanup = async (): Promise<void> => {
  console.log(`[Worker] Cleaning up`);
  await provider.dispose();
  console.log(`[Worker] Finished cleaning up`);
  parentPort?.postMessage(WorkerIngressType.CLEANUP_FINISHED);
};

const bootstrap = async (): Promise<void> => {
  parentPort?.postMessage('[Worker] Connecting..');
  await provider.connect();
  parentPort?.postMessage('[Worker] Connected');
};

void bootstrap().then(() => {
  parentPort?.on('message', async (msg) => {
    console.log(`[Worker] Received parent message "${msg}"`);
    if (msg === WorkerEgressType.CLEANUP) {
      await cleanup();
    }
  });
});
