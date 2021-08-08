import { Entity, ManyToOne } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import { DatabaseAttributeType } from '../enums';
import { EntityColumn, EntityJoinColumn } from '../decorators';

import BaseEntity, { EntityInitializer } from './base.entity';
import RaceEntity from './race.entity';
import TrackerEntity from './tracker.entity';

import TransformerUtils from '../../utils/transformer.utils';

@Entity(TransformerUtils.toTableName(AnnouncementEntity))
class AnnouncementEntity extends BaseEntity<AnnouncementEntity> {
  public constructor(d?: EntityInitializer<AnnouncementEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<AnnouncementEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @EntityColumn({ type: DatabaseAttributeType.DATETIME })
  public lastUpdated: Date;

  @EntityColumn({ type: DatabaseAttributeType.INTEGER })
  public changeCounter: number;

  @EntityColumn({ type: DatabaseAttributeType.INTEGER })
  public failedUpdateAttempts: number;

  @EntityColumn({ type: DatabaseAttributeType.VARCHAR, length: 4000 })
  public previousMessage: string;

  @ManyToOne(() => TrackerEntity)
  @EntityJoinColumn()
  public tracker: TrackerEntity;

  @ManyToOne(() => RaceEntity)
  @EntityJoinColumn()
  public race: RaceEntity;
}

export default AnnouncementEntity;
