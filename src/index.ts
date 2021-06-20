import DatabaseService from './infrastructure/database/database.service';

const bootstrap = async (): Promise<void> => {
  const conn = await DatabaseService.getConnection();
  await conn.synchronize();
  await DatabaseService.closeConnection();

  // console.log(await new RaceTimeGGConnector().getActiveRaces());
};

void bootstrap().then(() => {
  console.log(':)');
});
