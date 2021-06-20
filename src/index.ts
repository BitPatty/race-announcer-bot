import ChatWorker from './infrastructure/chat-worker/chat.worker';

const bootstrap = async (): Promise<void> => {
  // const conn = await DatabaseService.getConnection();
  // await conn.synchronize();
  // await DatabaseService.closeConnection();

  await new ChatWorker().start();

  // console.log(await new RaceTimeGGConnector().getActiveRaces());
};

void bootstrap().then(() => {
  console.log(':)');
});
