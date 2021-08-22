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

import { BeforeInsert, BeforeUpdate, Entity, ManyToOne } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import {
  DatabaseAttributeType,
  RaceStatus,
  SourceConnectorIdentifier,
} from '../enums';

import { EntityColumn, EntityJoinColumn } from '../decorators';
import TransformerUtils from '../../utils/transformer.utils';

import BaseEntity, { EntityInitializer } from './base.entity';
import GameEntity from './game.entity';

/**
 * The race entity class holds the races fetched
 * from the source connectors
 */
@Entity(TransformerUtils.toTableName(RaceEntity))
class RaceEntity extends BaseEntity<RaceEntity> {
  public constructor(d?: EntityInitializer<RaceEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<RaceEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  /**
   * The user specified goal of the race
   */
  @EntityColumn({
    nullable: true,
    type: DatabaseAttributeType.VARCHAR,
    length: 1000,
  })
  public goal: string;

  /**
   * The URL to the race page of the provider
   */
  @EntityColumn({
    nullable: true,
  })
  public url?: string;

  /**
   * The identifier used by the mapped {@link RaceEntity.connector}
   * to
   */
  @EntityColumn()
  public identifier: string;

  /**
   * The source connector this race is assigned to
   */
  @EntityColumn({
    enum: SourceConnectorIdentifier,
  })
  public connector: SourceConnectorIdentifier;

  /**
   * The status of the race
   */
  @EntityColumn({
    enum: RaceStatus,
  })
  public status: RaceStatus;

  /**
   * The timestamp of when the race was last synced
   */
  @EntityColumn({
    type: DatabaseAttributeType.DATETIME,
    nullable: true,
  })
  public lastSyncAt?: Date;

  /**
   * The counter for recorded changes
   *
   * The counter is incremented each time a change
   * has been detected in the race details
   */
  @EntityColumn({
    type: DatabaseAttributeType.INTEGER,
  })
  public changeCounter: number;

  /**
   * The game mapped to this race
   */
  @ManyToOne(() => GameEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public game: GameEntity;

  @BeforeInsert()
  @BeforeUpdate()
  private truncateFields(): void {
    this.goal = TransformerUtils.truncateString(this.goal, 1000);
  }
}

export default RaceEntity;
