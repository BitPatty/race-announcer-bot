import { Entity } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import { EntityColumn } from '../decorators';
import { SourceConnectorIdentifier } from '../enums';
import TransformerUtils from '../../utils/transformer.utils';

import BaseEntity, { EntityInitializer } from './base.entity';

/**
 * The racer entity class holds the users of
 * the source connectors which have been entrants
 * in one or more races
 */
@Entity(TransformerUtils.toTableName(RacerEntity))
class RacerEntity extends BaseEntity<RacerEntity> {
  public constructor(d?: EntityInitializer<RacerEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<RacerEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * The identifier used by the {@link RacerEntity.connector}
   * to identify the racer
   */
  @EntityColumn({ nullable: false })
  public identifier: string;

  /**
   * The display name of the racer
   */
  @EntityColumn({ nullable: false })
  public displayName: string;

  /**
   * The {@link SourceConnectorIdentifier} this racer
   * is assigned to
   */
  @EntityColumn({ enum: SourceConnectorIdentifier })
  public connector: SourceConnectorIdentifier;
}

export default RacerEntity;
