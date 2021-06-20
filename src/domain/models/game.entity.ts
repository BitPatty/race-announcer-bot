import { Entity } from 'typeorm';
import { EntityColumn } from '../decorators';
import { SourceConnectorIdentifier } from '../enums';
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

  @EntityColumn({ nullable: false })
  public name: string;

  @EntityColumn({ nullable: false })
  public identifier: string;

  @EntityColumn({ enum: SourceConnectorIdentifier })
  public connector: SourceConnectorIdentifier;

  @EntityColumn({ nullable: true })
  public abbreviation?: string;
}

export default GameEntity;
