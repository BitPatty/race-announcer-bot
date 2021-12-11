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

import { DatabaseAttributeType } from '../enums';
import { EntityColumn } from '../decorators';
import SourceConnectorIdentifier from '../../connectors/source-connector-identifier.enum';

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
   * The full name of the racer
   */
  @EntityColumn({
    nullable: true,
    type: DatabaseAttributeType.VARCHAR,
    length: 255,
  })
  public fullName: string | null;

  /**
   * The {@link SourceConnectorIdentifier} this racer
   * is assigned to
   */
  @EntityColumn({ enum: SourceConnectorIdentifier })
  public connector: SourceConnectorIdentifier;
}

export default RacerEntity;
