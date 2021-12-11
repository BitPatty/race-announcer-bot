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

import * as redis from 'redis';

import { TaskIdentifier } from '../../models/enums';

import ConfigService from '../config/config.service';
import LoggerService from '../logger/logger.service';

class RedisService {
  private static readonly client = redis.createClient({
    ...ConfigService.redisConfiguration,
    socket: {
      reconnectStrategy: (retries) => {
        // Exit with EX_UNAVAILABLE if failed to connect for over a minute
        if (retries > 20) {
          LoggerService.fatal('Connection to redis server timed out');
          process.exit(69);
        }

        // retry after 3 seconds
        return 3000;
      },
    },
  });

  /**
   * Connect to the redis service
   */
  public static async connect(): Promise<void> {
    await this.client.connect();
  }

  /**
   * Try to reserve the specified task for the current process
   *
   * @param taskIdentifier  The task identifier
   * @param postfix         The postfix which is appended to the task identifier to
   *                        uniquely identify the task
   * @param instanceUuid    The current instance UUID
   * @param ttl             The time to live for the reservation (in seconds)
   * @returns               True if the reservation was successful
   */
  public static async tryReserveTask(
    taskIdentifier: TaskIdentifier,
    postfix: string,
    instanceUuid: string,
    ttl: number,
  ): Promise<boolean> {
    LoggerService.debug(
      `[Redis] Setting ${taskIdentifier}_${postfix} to ${instanceUuid}`,
    );
    try {
      const reply = await this.client.set(
        `${taskIdentifier}_${postfix}`,
        instanceUuid,
        {
          NX: true,
          EX: ttl,
        },
      );

      return reply === 'OK';
    } catch (err) {
      LoggerService.error(JSON.stringify(err));
      throw err;
    }
  }

  /**
   * Removes the reservation associated for the specified task
   * if it is assigned to the specified instanceUuid
   *
   * @param taskIdentifier  The task identifier
   * @param postfix         The identifier postfix
   * @param instanceUuid    The instance uuid
   */
  public static async freeTask(
    taskIdentifier: TaskIdentifier,
    postfix: string,
    instanceUuid: string,
  ): Promise<void> {
    LoggerService.debug(`[Redis] Removing key ${taskIdentifier}_${postfix}`);
    try {
      const existingValue = await this.client.get(
        `${taskIdentifier}_${postfix}`,
      );
      if (existingValue !== instanceUuid) return Promise.resolve();
      await this.client.del(`${taskIdentifier}_${postfix}`);
    } catch (err) {
      LoggerService.error(JSON.stringify(err));
      throw err;
    }
  }

  /**
   * Disconnects the client and frees resources
   */
  public static async dispose(): Promise<void> {
    await this.client.quit();
  }
}

export default RedisService;
