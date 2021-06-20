import { Column, Entity } from 'typeorm';
import {
  DatabaseAttributeType,
  DestinationConnectorIdentifier,
} from '../enums';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import Transformers from '../../utils/transformers';

@Entity(Transformers.toTableName(CommunicationChannelEntity))
class CommunicationChannelEntity extends BaseEntity<CommunicationChannelEntity> {
  public constructor(d?: EntityInitializer<CommunicationChannelEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] =
      keys<EntityInitializer<CommunicationChannelEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @Column({
    name: Transformers.toAttributeName(
      nameof<CommunicationChannelEntity>((e) => e.isActive),
    ),
    default: false,
  })
  public isActive: boolean;

  @Column({
    name: Transformers.toAttributeName(
      nameof<CommunicationChannelEntity>((e) => e.identifier),
    ),
  })
  public identifier: string;

  @Column({
    name: Transformers.toAttributeName(
      nameof<CommunicationChannelEntity>((e) => e.permissionCheckSuccessful),
    ),
    default: false,
  })
  public permissionCheckSuccessful: boolean;

  @Column({
    name: Transformers.toAttributeName(
      nameof<CommunicationChannelEntity>((e) => e.connector),
    ),
    type: DatabaseAttributeType.ENUM,
    enum: DestinationConnectorIdentifier,
  })
  public connector: DestinationConnectorIdentifier;
}

export default CommunicationChannelEntity;
