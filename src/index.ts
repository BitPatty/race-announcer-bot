import ChatWorker from './infrastructure/chat-worker/chat.worker';

const bootstrap = async (): Promise<void> => {
  await new ChatWorker().start();
};

void bootstrap().then(() => {
  console.log(':)');
});
