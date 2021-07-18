import { Connection, Repository } from 'typeorm';
import pino from 'pino';

import { TaskLogEntity } from '../../models/entities';
import { TaskStatus, TaskType } from '../../models/enums';
import ConfigService from '../config/config.service';

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

class Logger {
  private readonly taskLogRepository: Repository<TaskLogEntity>;

  private static readonly logger = pino({
    level: ConfigService.logLevel,
    prettyPrint: true,
  });

  public constructor(private readonly databaseConnection: Connection) {
    this.taskLogRepository =
      this.databaseConnection.getRepository(TaskLogEntity);
  }

  public initTask(type: TaskType, context?: string): Promise<TaskLogEntity> {
    return this.taskLogRepository.save(
      new TaskLogEntity({
        type,
        status: TaskStatus.INITIALIZED,
        context: context ?? null,
        parentUuid: null,
      }),
    );
  }

  public updateTask(
    task: TaskLogEntity,
    status: TaskStatus,
    context?: string,
  ): Promise<TaskLogEntity> {
    return this.taskLogRepository.save(
      new TaskLogEntity({
        ...task,
        status,
        context: context ?? null,
        parentUuid: task.uuid,
      }),
    );
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

export default Logger;
