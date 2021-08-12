import { Entity, ManyToOne } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import { DatabaseAttributeType } from '../enums';
import { EntityColumn, EntityJoinColumn } from '../decorators';

import BaseEntity, { EntityInitializer } from './base.entity';
import RaceEntity from './race.entity';
import TrackerEntity from './tracker.entity';

import TransformerUtils from '../../utils/transformer.utils';

/**
 * The announcement entity holds announcements posted
 * by the bot
 */
@Entity(TransformerUtils.toTableName(AnnouncementEntity))
class AnnouncementEntity extends BaseEntity<AnnouncementEntity> {
  public constructor(d?: EntityInitializer<AnnouncementEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<AnnouncementEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * The timestamp of when the announcement was last updated
   */
  @EntityColumn({ type: DatabaseAttributeType.DATETIME })
  public lastUpdated: Date;

  /**
   * The change counter reflecting the change counter
   * from the linked {@link RaceEntity} during the last
   * successful update of the announcement
   */
  @EntityColumn({ type: DatabaseAttributeType.INTEGER })
  public changeCounter: number;

  /**
   * The count of subsequently failed update attempts
   */
  @EntityColumn({ type: DatabaseAttributeType.INTEGER })
  public failedUpdateAttempts: number;

  /**
   * The details of the last announcement
   */
  @EntityColumn({
    type: DatabaseAttributeType.VARCHAR,
    length: 4000,
    nullable: false,
  })
  public previousMessage: string;

  /**
   * The tracker this announcement is mapped to
   */
  @ManyToOne(() => TrackerEntity)
  @EntityJoinColumn()
  public tracker: TrackerEntity;

  /**
   * The race this announcement is tracking
   */
  @ManyToOne(() => RaceEntity)
  @EntityJoinColumn()
  public race: RaceEntity;
}

export default AnnouncementEntity;
