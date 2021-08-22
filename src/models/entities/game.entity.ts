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
import { EntityColumn } from '../decorators';
import { SourceConnectorIdentifier } from '../enums';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import TransformerUtils from '../../utils/transformer.utils';

/**
 * The game entity holds the games available
 * on a race platform
 */
@Entity(TransformerUtils.toTableName(GameEntity))
class GameEntity extends BaseEntity<GameEntity> {
  public constructor(d?: EntityInitializer<GameEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<GameEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * The name of the game
   */
  @EntityColumn({ nullable: false })
  public name: string;

  /**
   * The identifier used by the {@link GameEntity.connector}
   * to identify the game
   */
  @EntityColumn({ nullable: false })
  public identifier: string;

  /**
   * The source connector this game is assigned to
   */
  @EntityColumn({ enum: SourceConnectorIdentifier })
  public connector: SourceConnectorIdentifier;

  /**
   * The abbreviation of the game
   */
  @EntityColumn({ nullable: false })
  public abbreviation: string;
}

export default GameEntity;
