import { Connection, createConnection } from 'typeorm';
import { Lock } from 'lock';
import { LockIdentifier } from '../../domain/enums';
import ConfigService from '../config/config.service';

class DatabaseService {
  private static connection: Connection;

  public static getConnection(): Promise<Connection> {
    return new Promise<Connection>((resolve, reject) => {
      Lock()(LockIdentifier.DATABASE_CONNECTION, async (release) => {
        try {
          if (this.connection?.isConnected) return resolve(this.connection);
          this.connection = await createConnection(
            ConfigService.databaseConfiguration,
          );
          resolve(this.connection);
        } catch (err) {
          console.error(err);
          reject(err);
        } finally {
          release();
        }
      });
    });
  }

  public static async closeConnection(): Promise<void> {
    if (this.connection?.isConnected) {
      await this.connection.close();
    }
  }
}

export default DatabaseService;
