import { Connection, Repository } from 'typeorm';
import pino from 'pino';

import { TaskLogEntity } from '../../models/entities';
import ConfigService from '../config/config.service';

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

class LoggerService {
  private readonly taskLogRepository: Repository<TaskLogEntity>;

  private static readonly logger = pino({
    level: ConfigService.logLevel,
    prettyPrint: true,
  });

  public constructor(private readonly databaseConnection: Connection) {
    this.taskLogRepository =
      this.databaseConnection.getRepository(TaskLogEntity);
  }

  public static log(msg: string, ...args: any[]): void {
    this.logger.info(`[${ConfigService.instanceUuid}] ${msg}`, ...args);
  }

  public static warn(msg: string, ...args: any[]): void {
    this.logger.warn(`[${ConfigService.instanceUuid}] ${msg}`, ...args);
  }

  public static debug(msg: string, ...args: any[]): void {
    this.logger.debug(`[${ConfigService.instanceUuid}] ${msg}`, ...args);
  }

  public static error(msg: string, ...args: any[]): void {
    this.logger.error(`[${ConfigService.instanceUuid}] ${msg}`, ...args);
  }
}

export default LoggerService;
