import {
  DatabaseAttributeType,
  DestinationConnectorIdentifier,
  MessageChannelType,
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

  /**
   * Whether or not the channel is considered to be alive
   */
  @EntityColumn({
    default: false,
  })
  public isActive: boolean;

  /**
   * The identifier used by the {@link CommunicationChannelEntity.connector} to
   * identify the channel
   */
  @EntityColumn()
  public identifier: string;

  /**
   * The name of the channel
   */
  @EntityColumn({
    type: DatabaseAttributeType.VARCHAR,
    length: 255,
    nullable: true,
  })
  public name: string | null;

  /**
   * The identifier of the server this channel
   * belongs to
   */
  @EntityColumn({
    type: DatabaseAttributeType.VARCHAR,
    length: 255,
    nullable: true,
  })
  public serverIdentifier: string | null;

  /**
   * The type of the channel
   */
  @EntityColumn({
    enum: MessageChannelType,
  })
  public type: MessageChannelType;

  /**
   * The destionation connector this channel is mapped to
   */
  @EntityColumn({
    enum: DestinationConnectorIdentifier,
  })
  public connector: DestinationConnectorIdentifier;
}

export default CommunicationChannelEntity;
