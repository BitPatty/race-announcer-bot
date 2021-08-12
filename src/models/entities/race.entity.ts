import { Entity, ManyToOne } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import {
  DatabaseAttributeType,
  RaceStatus,
  SourceConnectorIdentifier,
} from '../enums';

import { EntityColumn, EntityJoinColumn } from '../decorators';
import TransformerUtils from '../../utils/transformer.utils';

import BaseEntity, { EntityInitializer } from './base.entity';
import GameEntity from './game.entity';

/**
 * The race entity class holds the races fetched
 * from the source connectors
 */
@Entity(TransformerUtils.toTableName(RaceEntity))
class RaceEntity extends BaseEntity<RaceEntity> {
  public constructor(d?: EntityInitializer<RaceEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<RaceEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * The user specified goal of the race
   */
  @EntityColumn({
    nullable: true,
    type: DatabaseAttributeType.VARCHAR,
    length: 1000,
  })
  public goal: string;

  /**
   * The URL to the race page of the provider
   */
  @EntityColumn({
    nullable: true,
  })
  public url?: string;

  /**
   * The identifier used by the mapped {@link RaceEntity.connector}
   * to
   */
  @EntityColumn()
  public identifier: string;

  /**
   * The source connector this race is assigned to
   */
  @EntityColumn({
    enum: SourceConnectorIdentifier,
  })
  public connector: SourceConnectorIdentifier;

  /**
   * The status of the race
   */
  @EntityColumn({
    enum: RaceStatus,
  })
  public status: RaceStatus;

  /**
   * The timestamp of when the race was last synced
   */
  @EntityColumn({
    type: DatabaseAttributeType.DATETIME,
    nullable: true,
  })
  public lastSyncAt?: Date;

  /**
   * The counter for recorded changes
   *
   * The counter is incremented each time a change
   * has been detected in the race details
   */
  @EntityColumn({
    type: DatabaseAttributeType.INTEGER,
  })
  public changeCounter: number;

  /**
   * The game mapped to this race
   */
  @ManyToOne(() => GameEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public game: GameEntity;
}

export default RaceEntity;
