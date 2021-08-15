import * as redis from 'redis';

import { TaskIdentifier } from '../../models/enums';

import ConfigService from '../config/config.service';
import LoggerService from '../logger/logger.service';

class RedisService {
  private static readonly client = redis.createClient({
    ...ConfigService.redisConfiguration,
    retry_strategy: (options) => {
      // Exit with EX_UNAVAILABLE if cannot connect
      if (options.error && options.error.code === 'ECONNREFUSED') {
        LoggerService.fatal('The redis server refused the connection');
        process.exit(69);
      }

      // Exit with EX_UNAVAILABLE if failed to connect for over a minute
      if (options.total_retry_time > 1000 * 60 * 60) {
        LoggerService.fatal('Connection to redis server timed out');
        process.exit(69);
      }

      // retry after 3 seconds
      return 3000;
    },
  });

  /**
   * Try to reserve the specified task for the current process
   *
   * @param taskIdentifier The task identifier
   * @param postfix The postfix which is appended to the task identifier to
   * uniquely identify the task
   * @param instanceUuid The current instance UUID
   * @param ttl The time to live for the reservation (in seconds)
   * @returns True if the reservation was successful
   */
  public static tryReserveTask(
    taskIdentifier: TaskIdentifier,
    postfix: string,
    instanceUuid: string,
    ttl: number,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      LoggerService.debug(
        `[Redis] Setting ${taskIdentifier}_${postfix} to ${instanceUuid}`,
      );
      this.client.set(
        `${taskIdentifier}_${postfix}`,
        instanceUuid,
        'EX',
        ttl,
        'NX',
        (err, reply) => {
          if (err) {
            LoggerService.error(JSON.stringify(err));
            reject();
          }
          resolve(reply === 'OK');
        },
      );
    });
  }

  /**
   * Removes the reservation associated for the specified task
   * if it is assigned to the specified instanceUuid
   * @param taskIdentifier The task identifier
   * @param postfix The identifier postfix
   * @param instanceUuid The instance uuid
   */
  public static async freeTask(
    taskIdentifier: TaskIdentifier,
    postfix: string,
    instanceUuid: string,
  ): Promise<void> {
    LoggerService.debug(`[Redis] Removing key ${taskIdentifier}_${postfix}`);

    const existingValue = await new Promise<string>((resolve) =>
      this.client.get(`${taskIdentifier}_${postfix}`, (err, data) => {
        if (err) {
          LoggerService.error('Something went wrong', err);
          return;
        }

        resolve(data as string);
      }),
    );

    if (existingValue !== instanceUuid) return;

    return new Promise((resolve) => {
      this.client.del(`${taskIdentifier}_${postfix}`, () => {
        resolve();
      });
    });
  }

  /**
   * Disconnects the client and frees resources
   */
  public static async dispose(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.client.quit(() => resolve());
    });
  }
}

export default RedisService;
