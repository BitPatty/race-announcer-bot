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

import {
  CreateDateColumn,
  DeleteDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import TransformerUtils from '../../utils/transformer.utils';

import { EntityColumn } from './entity-column.decorator';

// Allow the type 'Object' to be used
/* eslint-disable @typescript-eslint/ban-types */

enum GeneratedColumnType {
  PRIMARY = 'primary',
  UUID = 'uuid',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  DELETED_AT = 'deleted_at',
}

/**
 * Decorator override for typeorm generated columns
 *
 * @param type  The generation strategy
 * @returns     The column decorator
 */
const GeneratedColumn = (type: GeneratedColumnType): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol): void => {
    const columnName = TransformerUtils.toAttributeName(propertyKey as string);

    switch (type) {
      case GeneratedColumnType.PRIMARY:
        PrimaryGeneratedColumn({ name: columnName })(target, propertyKey);
        break;
      case GeneratedColumnType.UUID:
        Generated('uuid')(target, propertyKey);
        EntityColumn({ unique: true })(target, propertyKey);
        break;
      case GeneratedColumnType.CREATED_AT:
        CreateDateColumn({ name: columnName, nullable: false })(
          target,
          propertyKey,
        );
        break;
      case GeneratedColumnType.UPDATED_AT:
        UpdateDateColumn({ name: columnName, nullable: false })(
          target,
          propertyKey,
        );
        break;
      case GeneratedColumnType.DELETED_AT:
        DeleteDateColumn({ name: columnName, nullable: true })(
          target,
          propertyKey,
        );
        break;
    }
  };
};

export { GeneratedColumn, GeneratedColumnType };
