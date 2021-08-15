import DatabaseService from '../../src/core/database/database-service';

const clearDatabase = async (): Promise<void> => {
  await DatabaseService.closeConnection();
  const dbConnection = await DatabaseService.getConnection();
  await dbConnection.dropDatabase();
  await dbConnection.runMigrations();
  await DatabaseService.closeConnection();
};

export default clearDatabase;
