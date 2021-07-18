import { Connection, Repository } from 'typeorm';
import { TaskLogEntity } from '../../models/entities';
import { TaskStatus, TaskType } from '../../models/enums';
import pino from 'pino';

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

class Logger {
  private readonly taskLogRepository: Repository<TaskLogEntity>;

  private static readonly logger = pino({
    level: 'debug',
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
    this.logger.info(msg, args);
  }

  public static warn(msg: string, ...args: any[]): void {
    this.logger.warn(msg, args);
  }

  public static debug(msg: string, ...args: any[]): void {
    this.logger.debug(msg, args);
  }

  public static error(msg: string, ...args: any[]): void {
    this.logger.error(msg, args);
  }
}

export default Logger;
