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

import { Entity, ManyToOne } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import { DatabaseAttributeType } from '../enums';
import { EntityColumn, EntityJoinColumn } from '../decorators';

import BaseEntity, { EntityInitializer } from './base.entity';
import RaceEntity from './race.entity';
import TrackerEntity from './tracker.entity';

import TransformerUtils from '../../utils/transformer.utils';

/**
 * The announcement entity holds announcements posted
 * by the bot
 */
@Entity(TransformerUtils.toTableName(AnnouncementEntity))
class AnnouncementEntity extends BaseEntity<AnnouncementEntity> {
  public constructor(d?: EntityInitializer<AnnouncementEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<AnnouncementEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * The timestamp of when the announcement was last updated
   */
  @EntityColumn({ type: DatabaseAttributeType.DATETIME })
  public lastUpdated: Date;

  /**
   * The change counter reflecting the change counter
   * from the linked {@link RaceEntity} during the last
   * successful update of the announcement
   */
  @EntityColumn({ type: DatabaseAttributeType.INTEGER })
  public changeCounter: number;

  /**
   * The count of subsequently failed update attempts
   */
  @EntityColumn({ type: DatabaseAttributeType.INTEGER })
  public failedUpdateAttempts: number;

  /**
   * The details of the last announcement
   */
  @EntityColumn({
    type: DatabaseAttributeType.VARCHAR,
    length: 4000,
    nullable: false,
  })
  public previousMessage: string;

  /**
   * The tracker this announcement is mapped to
   */
  @ManyToOne(() => TrackerEntity)
  @EntityJoinColumn()
  public tracker: TrackerEntity;

  /**
   * The race this announcement is tracking
   */
  @ManyToOne(() => RaceEntity)
  @EntityJoinColumn()
  public race: RaceEntity;
}

export default AnnouncementEntity;
