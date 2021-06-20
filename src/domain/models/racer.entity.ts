import { Column, Entity } from 'typeorm';
import { DatabaseAttributeType, SourceConnectorIdentifier } from '../enums';
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

  @Column({
    name: Transformers.toAttributeName(
      nameof<RacerEntity>((e) => e.displayName),
    ),
    nullable: false,
  })
  public displayName: string;

  @Column({
    name: Transformers.toAttributeName(nameof<RacerEntity>((e) => e.connector)),
    type: DatabaseAttributeType.ENUM,
    enum: SourceConnectorIdentifier,
  })
  public connector: SourceConnectorIdentifier;
}

export default RacerEntity;
