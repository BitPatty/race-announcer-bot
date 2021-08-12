import { Entity } from 'typeorm';
import { EntityColumn } from '../decorators';
import { SourceConnectorIdentifier } from '../enums';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import TransformerUtils from '../../utils/transformer.utils';

/**
 * The game entity holds the games available
 * on a race platform
 */
@Entity(TransformerUtils.toTableName(GameEntity))
class GameEntity extends BaseEntity<GameEntity> {
  public constructor(d?: EntityInitializer<GameEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<GameEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * The name of the game
   */
  @EntityColumn({ nullable: false })
  public name: string;

  /**
   * The identifier used by the {@link GameEntity.connector}
   * to identify the game
   */
  @EntityColumn({ nullable: false })
  public identifier: string;

  /**
   * The source connector this game is assigned to
   */
  @EntityColumn({ enum: SourceConnectorIdentifier })
  public connector: SourceConnectorIdentifier;

  /**
   * The abbreviation of the game
   */
  @EntityColumn({ nullable: false })
  public abbreviation: string;
}

export default GameEntity;
