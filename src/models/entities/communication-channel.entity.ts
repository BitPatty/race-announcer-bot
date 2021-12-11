/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2021 Matteias Collet <matteias.collet@bluewin.ch>
 * Official Repository: https://github.com/BitPatty/RaceAnnouncerBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Entity } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import TransformerUtils from '../../utils/transformer.utils';

import { DatabaseAttributeType, MessageChannelType } from '../enums';
import DestinationConnectorIdentifier from '../../connectors/destination-connector-identifier.enum';

import { EntityColumn } from '../decorators';

import BaseEntity, { EntityInitializer } from './base.entity';

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
   * The name of the server
   */
  @EntityColumn({
    type: DatabaseAttributeType.VARCHAR,
    length: 255,
    nullable: true,
  })
  public serverName: string | null;

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
