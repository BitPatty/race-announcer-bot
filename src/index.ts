import {
  DestinationConnectorIdentifier,
  SourceConnectorIdentifier,
  WorkerType,
} from './models/enums';
import Worker from './core/worker/worker';

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
