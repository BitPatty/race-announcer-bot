import { Entity } from 'typeorm';
import { EntityColumn } from '../decorators';
import { SourceConnectorIdentifier } from '../enums';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import Transformers from '../../utils/transformers';

@Entity(Transformers.toTableName(RacerEntity))
class RacerEntity extends BaseEntity<RacerEntity> {
  public constructor(d?: EntityInitializer<RacerEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<RacerEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @EntityColumn({ nullable: false })
  public displayName: string;

  @EntityColumn({ enum: SourceConnectorIdentifier })
  public connector: SourceConnectorIdentifier;
}

export default RacerEntity;
