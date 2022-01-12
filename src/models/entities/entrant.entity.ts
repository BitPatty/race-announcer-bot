/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2022 Matteias Collet <matteias.collet@bluewin.ch>
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

import { Entity, ManyToOne } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import TransformerUtils from '../../utils/transformer.utils';

import { DatabaseAttributeType, EntrantStatus } from '../enums';
import { EntityColumn, EntityJoinColumn } from '../decorators';

import BaseEntity, { EntityInitializer } from './base.entity';
import RaceEntity from './race.entity';
import RacerEntity from './racer.entity';

/**
 * The entrant entity holds the mapping from a {@link RacerEntity}
 * to a {@link RaceEntity}
 */
@Entity(TransformerUtils.toTableName(EntrantEntity))
class EntrantEntity extends BaseEntity<EntrantEntity> {
  public constructor(d?: EntityInitializer<EntrantEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<EntrantEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * The status of the entrant
   */
  @EntityColumn({
    nullable: false,
    enum: EntrantStatus,
  })
  public status: EntrantStatus;

  /**
   * The final time fo the entrant
   */
  @EntityColumn({
    nullable: true,
    type: DatabaseAttributeType.INTEGER,
  })
  public finalTime: number | null;

  /**
   * The racer this entrant is mapped to
   */
  @ManyToOne(() => RacerEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public racer: RacerEntity;

  /**
   * The race this entrant is mapped to
   */
  @ManyToOne(() => RaceEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public race: RaceEntity;
}

export default EntrantEntity;
