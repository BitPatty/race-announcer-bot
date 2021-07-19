import {
  DatabaseAttributeType,
  DestinationConnectorIdentifier,
} from '../enums';
import { Entity } from 'typeorm';
import { EntityColumn } from '../decorators';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import TransformerUtils from '../../utils/transformer.utils';

@Entity(TransformerUtils.toTableName(CommunicationChannelEntity))
class CommunicationChannelEntity extends BaseEntity<CommunicationChannelEntity> {
  public constructor(d?: EntityInitializer<CommunicationChannelEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] =
      keys<EntityInitializer<CommunicationChannelEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @EntityColumn({
    default: false,
  })
  public isActive: boolean;

  @EntityColumn()
  public identifier: string;

  @EntityColumn({
    type: DatabaseAttributeType.VARCHAR,
    length: 255,
    nullable: true,
  })
  public serverIdentifier: string | null;

  @EntityColumn({
    default: false,
  })
  public permissionCheckSuccessful: boolean;

  @EntityColumn({
    enum: DestinationConnectorIdentifier,
  })
  public connector: DestinationConnectorIdentifier;
}

export default CommunicationChannelEntity;
