// import DatabaseService from './infrastructure/database/database.service';
import RaceTimeGGConnector from './connectors/source-connectors/racetimegg/racetimegg.connector';

const bootstrap = async (): Promise<void> => {
  // await DatabaseService.getConnection();
  // await DatabaseService.closeConnection();

  console.log(await new RaceTimeGGConnector().getActiveRaces());
};

void bootstrap().then(() => {
  console.log(':)');
});
