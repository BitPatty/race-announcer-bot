import * as redis from 'redis';
import { TaskIdentifier } from '../../models/enums';
import ConfigService from '../config/config.service';
import Logger from '../logger/logger';

class RedisService {
  private static readonly client = redis.createClient(
    ConfigService.redisConfiguration,
  );

  public static tryReserveTask(
    taskIdentifier: TaskIdentifier,
    postfix: string,
    instanceUuid: string,
    ttl: number,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      Logger.debug(`Setting ${taskIdentifier}_${postfix} to ${instanceUuid}`);
      this.client.set(
        `${taskIdentifier}_${postfix}`,
        instanceUuid,
        'EX',
        ttl,
        'NX',
        (err, reply) => {
          if (err) {
            Logger.error(JSON.stringify(err));
          }
          resolve(reply === 'OK');
        },
      );
    });
  }

  public static freeTask(
    taskIdentifier: TaskIdentifier,
    postfix: string,
  ): Promise<void> {
    Logger.debug(`Removing key ${taskIdentifier}_${postfix}`);

    return new Promise((resolve) => {
      this.client.del(`${taskIdentifier}_${postfix}`, () => {
        resolve();
      });
    });
  }
}

export default RedisService;
