import {
  DestinationConnectorIdentifier,
  SourceConnectorIdentifier,
  WorkerType,
} from './domain/enums';
import Worker from './infrastructure/worker/worker';

const bootstrap = async (): Promise<void> => {
  await Promise.all([
    new Worker(WorkerType.CHAT).start(DestinationConnectorIdentifier.DISCORD),
    new Worker(WorkerType.SOURCE_SYNC).start(
      SourceConnectorIdentifier.SPEEDRUNSLIVE,
    ),
  ]);
};

void bootstrap().then(() => {
  console.log(':)');
});
