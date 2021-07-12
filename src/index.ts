import {
  DestinationConnectorIdentifier,
  SourceConnectorIdentifier,
} from './domain/enums';
import ChatWorker from './infrastructure/chat-worker/chat.worker';
import SourceWorker from './infrastructure/source-worker/source-worker';

const bootstrap = async (): Promise<void> => {
  await new ChatWorker().start(DestinationConnectorIdentifier.DISCORD);
  await new SourceWorker().start(SourceConnectorIdentifier.SPEEDRUNSLIVE);
};

void bootstrap().then(() => {
  console.log(':)');
});
