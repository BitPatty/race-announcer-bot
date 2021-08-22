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

import { GeneratedColumn, GeneratedColumnType } from '../decorators';

type EntityInitializer<T extends BaseEntity<T>> = Omit<T, keyof BaseEntity<T>>;

abstract class BaseEntity<T extends BaseEntity<T>> {
  /**
   * Unique identifier of this entity in the entity set
   */
  @GeneratedColumn(GeneratedColumnType.PRIMARY)
  public id: number;

  /**
   * Unique identifier of this entity across the application
   */
  @GeneratedColumn(GeneratedColumnType.UUID)
  public uuid: string;

  /**
   * The timestamp of when this entity was recorded
   */
  @GeneratedColumn(GeneratedColumnType.CREATED_AT)
  public createdAt: Date;

  /**
   * The timestamp of when this entity last changed
   */
  @GeneratedColumn(GeneratedColumnType.UPDATED_AT)
  public updatedAt: Date;

  /**
   * The timestamp of when this entity has been soft deleted
   */
  @GeneratedColumn(GeneratedColumnType.DELETED_AT)
  public deletedAt: Date;
}

export default BaseEntity;
export { EntityInitializer };
