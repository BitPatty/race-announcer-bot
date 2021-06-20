import { Column, Entity } from 'typeorm';
import { DatabaseAttributeType, SourceConnectorIdentifier } from '../enums';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import Transformers from '../../utils/transformers';

@Entity(Transformers.toTableName(GameEntity))
class GameEntity extends BaseEntity<GameEntity> {
  public constructor(d?: EntityInitializer<GameEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<GameEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @Column({
    name: Transformers.toAttributeName(nameof<GameEntity>((e) => e.name)),
    nullable: false,
  })
  public name: string;

  @Column({
    name: Transformers.toAttributeName(nameof<GameEntity>((e) => e.identifier)),
    nullable: false,
  })
  public identifier: string;

  @Column({
    name: Transformers.toAttributeName(nameof<GameEntity>((e) => e.connector)),
    type: DatabaseAttributeType.ENUM,
    enum: SourceConnectorIdentifier,
  })
  public connector: SourceConnectorIdentifier;

  @Column({
    name: Transformers.toAttributeName(
      nameof<GameEntity>((e) => e.abbreviation),
    ),
    nullable: true,
  })
  public abbreviation?: string;
}

export default GameEntity;
