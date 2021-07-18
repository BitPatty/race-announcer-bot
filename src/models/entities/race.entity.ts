import {
  DatabaseAttributeType,
  RaceStatus,
  SourceConnectorIdentifier,
} from '../enums';
import { Entity, ManyToOne } from 'typeorm';
import { EntityColumn, EntityJoinColumn } from '../decorators';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import GameEntity from './game.entity';
import TransformerUtils from '../../utils/transformer.utils';

@Entity(TransformerUtils.toTableName(RaceEntity))
class RaceEntity extends BaseEntity<RaceEntity> {
  public constructor(d?: EntityInitializer<RaceEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<RaceEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @EntityColumn({
    type: DatabaseAttributeType.DATETIME,
    nullable: true,
  })
  public startedAt?: Date;

  @EntityColumn({
    type: DatabaseAttributeType.DATETIME,
    nullable: true,
  })
  public finishedAt?: Date;

  @EntityColumn({
    nullable: true,
  })
  public goal: string;

  @EntityColumn()
  public identifier: string;

  @EntityColumn({
    enum: SourceConnectorIdentifier,
  })
  public connector: SourceConnectorIdentifier;

  @EntityColumn({
    enum: RaceStatus,
  })
  public status: RaceStatus;

  @EntityColumn({
    type: DatabaseAttributeType.DATETIME,
    nullable: true,
  })
  public lastSyncAt?: Date;

  @EntityColumn({
    type: DatabaseAttributeType.DATETIME,
    nullable: true,
  })
  public lastChangeAt?: Date;

  @ManyToOne(() => GameEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public game: GameEntity;
}

export default RaceEntity;
