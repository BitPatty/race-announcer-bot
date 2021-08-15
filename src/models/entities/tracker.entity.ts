import { Entity, ManyToOne } from 'typeorm';
import { EntityColumn, EntityJoinColumn } from '../decorators';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import CommunicationChannelEntity from './communication-channel.entity';
import GameEntity from './game.entity';
import TransformerUtils from '../../utils/transformer.utils';

/**
 * The tracker entity holds the registered trackers
 * for games/channels
 */
@Entity(TransformerUtils.toTableName(TrackerEntity))
class TrackerEntity extends BaseEntity<TrackerEntity> {
  public constructor(d?: EntityInitializer<TrackerEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<TrackerEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * Whether or not the tracker is considered to be alive
   */
  @EntityColumn({ default: false })
  public isActive: boolean;

  /**
   * The channel in which the tracker should
   * post announcements
   */
  @ManyToOne(() => CommunicationChannelEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public channel: CommunicationChannelEntity;

  /**
   * The game the tracker is tracking
   */
  @ManyToOne(() => GameEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public game: GameEntity;
}

export default TrackerEntity;
