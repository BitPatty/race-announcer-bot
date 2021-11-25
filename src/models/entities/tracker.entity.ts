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

import TransformerUtils from '../../utils/transformer.utils';

import { EntityColumn, EntityJoinColumn } from '../decorators';

import BaseEntity, { EntityInitializer } from './base.entity';
import CommunicationChannelEntity from './communication-channel.entity';
import GameEntity from './game.entity';

/**
 * The tracker entity holds the registered trackers
 * for games/channels
 */
@Entity(TransformerUtils.toTableName(TrackerEntity))
class TrackerEntity extends BaseEntity<TrackerEntity> {
  public constructor(d?: EntityInitializer<TrackerEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<TrackerEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * Whether or not the tracker is considered to be alive
   */
  @EntityColumn({ default: false })
  public isActive: boolean;

  /**
   * The channel in which the tracker should
   * post announcements
   */
  @ManyToOne(() => CommunicationChannelEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public channel: CommunicationChannelEntity;

  /**
   * The game the tracker is tracking
   */
  @ManyToOne(() => GameEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public game: GameEntity;
}

export default TrackerEntity;
