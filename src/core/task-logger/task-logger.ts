import { Connection, Repository } from 'typeorm';
import { TaskLogEntity } from '../../models/entities';
import { TaskStatus, TaskType } from '../../models/enums';

class TaskLogger {
  private taskLogRepository: Repository<TaskLogEntity>;
  public constructor(private readonly databaseConnection: Connection) {}

  private async loadRepository(): Promise<void> {
    if (!this.taskLogRepository) {
      this.taskLogRepository = await this.databaseConnection.getRepository(
        TaskLogEntity,
      );
    }
  }

  public async initTask(
    type: TaskType,
    context?: string,
  ): Promise<TaskLogEntity> {
    await this.loadRepository();
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
}

export default TaskLogger;
