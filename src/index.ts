import { DestinationConnectorIdentifier } from './domain/enums';
import ChatWorker from './infrastructure/chat-worker/chat.worker';

const bootstrap = async (): Promise<void> => {
  await new ChatWorker().start(DestinationConnectorIdentifier.DISCORD);
};

void bootstrap().then(() => {
  console.log(':)');
});
