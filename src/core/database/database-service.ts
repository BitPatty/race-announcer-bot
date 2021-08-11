import { Connection, createConnection } from 'typeorm';
import { Lock } from 'lock';

import { LockIdentifier } from '../../models/enums';

import ConfigService from '../config/config.service';
import LoggerService from '../logger/logger.service';

class DatabaseService {
  private static connection: Connection;

  public static getConnection(): Promise<Connection> {
    return new Promise<Connection>((resolve, reject) => {
      Lock()(LockIdentifier.DATABASE_CONNECTION, async (release) => {
        try {
          if (this.connection?.isConnected) {
            resolve(this.connection);
            return;
          }

          this.connection = await createConnection(
            ConfigService.databaseConfiguration,
          );

          resolve(this.connection);
        } catch (err) {
          LoggerService.error(err);
          reject(err);
        } finally {
          release();
        }
      });
    });
  }

  public static closeConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      Lock()(LockIdentifier.DATABASE_CONNECTION, async (release) => {
        try {
          if (this.connection?.isConnected) {
            await this.connection.close();
            resolve();
          }
        } catch (err) {
          LoggerService.error(err);
          reject(err);
        } finally {
          release();
        }
      });
    });
  }
}

export default DatabaseService;
