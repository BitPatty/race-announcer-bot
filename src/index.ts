import DatabaseService from './infrastructure/database/database.service';

const bootstrap = async (): Promise<void> => {
  await DatabaseService.getConnection();
  await DatabaseService.closeConnection();

  // console.log(await new RaceTimeGGConnector().getActiveRaces());
};

void bootstrap().then(() => {
  console.log(':)');
});
