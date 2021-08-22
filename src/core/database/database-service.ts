/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2021 Matteias Collet <matteias.collet@bluewin.ch>
 * Official Repository: https://github.com/BitPatty/RaceAnnouncerBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
          }
          resolve();
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
