import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import {
  DatabaseAttributeType,
  RaceStatus,
  SourceConnectorIdentifier,
} from '../enums';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import GameEntity from './game.entity';
import Transformers from '../../utils/transformers';

@Entity(Transformers.toTableName(RaceEntity))
class RaceEntity extends BaseEntity<RaceEntity> {
  public constructor(d?: EntityInitializer<RaceEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<RaceEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @Column({
    name: Transformers.toAttributeName(nameof<RaceEntity>((e) => e.startedAt)),
    nullable: true,
  })
  public startedAt?: Date;

  @Column({
    name: Transformers.toAttributeName(nameof<RaceEntity>((e) => e.finishedAt)),
    nullable: true,
  })
  public finishedAt?: Date;

  @Column({
    name: Transformers.toAttributeName(
      nameof<RaceEntity>((e) => e.raceIdentifier),
    ),
  })
  public raceIdentifier: string;

  @Column({
    name: Transformers.toAttributeName(
      nameof<RaceEntity>((e) => e.sourceConnectorIdentifier),
    ),
    type: DatabaseAttributeType.ENUM,
    enum: SourceConnectorIdentifier,
  })
  public sourceConnectorIdentifier: SourceConnectorIdentifier;

  @Column({
    name: Transformers.toAttributeName(nameof<RaceEntity>((e) => e.status)),
    type: DatabaseAttributeType.ENUM,
    enum: RaceStatus,
  })
  public status: RaceStatus;

  @ManyToOne(() => GameEntity, {
    nullable: false,
  })
  @JoinColumn({
    name: Transformers.toAttributeName(nameof<RaceEntity>((e) => e.game)),
  })
  public game: GameEntity;
}

export default RaceEntity;
