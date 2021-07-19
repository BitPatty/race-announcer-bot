import { Entity } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import { DatabaseAttributeType, TaskIdentifier, TaskStatus } from '../enums';
import { EntityColumn } from '../decorators';
import TransformerUtils from '../../utils/transformer.utils';

import BaseEntity, { EntityInitializer } from './base.entity';

@Entity(TransformerUtils.toTableName(TaskLogEntity))
class TaskLogEntity extends BaseEntity<TaskLogEntity> {
  public constructor(d?: EntityInitializer<TaskLogEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<TaskLogEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @EntityColumn({ enum: TaskStatus })
  public status: TaskStatus;

  @EntityColumn({ enum: TaskIdentifier })
  public type: TaskIdentifier;

  @EntityColumn({ type: DatabaseAttributeType.TEXT, nullable: true })
  public context: string | null;

  @EntityColumn({
    type: DatabaseAttributeType.VARCHAR,
    length: 32,
    nullable: true,
  })
  public parentUuid: string | null;
}

export default TaskLogEntity;
