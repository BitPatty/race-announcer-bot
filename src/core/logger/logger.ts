import { Connection, Repository } from 'typeorm';
import { LogLevel, TaskStatus, TaskType } from '../../models/enums';
import { TaskLogEntity } from '../../models/entities';
import ConfigService from '../config/config.service';

/* eslint-disable no-console */

class Logger {
  private taskLogRepository: Repository<TaskLogEntity>;

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

  public static log(msg: string): void {
    console.log(msg);
  }

  public static warn(msg: string): void {
    console.warn(msg);
  }

  public static debug(msg: string): void {
    if (ConfigService.logLevel !== LogLevel.DEBUG) return;
    console.debug(msg);
  }

  public static error(msg: string): void {
    console.error(msg);
    console.trace();
  }
}

export default Logger;
