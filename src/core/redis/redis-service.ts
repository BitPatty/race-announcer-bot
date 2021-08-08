import * as redis from 'redis';
import { TaskIdentifier } from '../../models/enums';
import ConfigService from '../config/config.service';
import LoggerService from '../logger/logger.service';

class RedisService {
  private static readonly client = redis.createClient(
    ConfigService.redisConfiguration,
  );

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
        `Setting ${taskIdentifier}_${postfix} to ${instanceUuid}`,
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

  public static async freeTask(
    taskIdentifier: TaskIdentifier,
    postfix: string,
    instanceUuid: string,
  ): Promise<void> {
    LoggerService.debug(`Removing key ${taskIdentifier}_${postfix}`);

    const existingValue = await new Promise<string>((resolve, reject) =>
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
}

export default RedisService;
