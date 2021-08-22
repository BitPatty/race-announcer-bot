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

/**
 * Helper class for entity transformers
 *
 * Used to ensure a consistent naming scheme in the
 * database
 */
class TransformerUtils {
  /**
   * Converts a camelCase string to its snake_case representation
   * @param str The string to convert
   * @returns The snake_case representation of the camelCase value
   */
  private static camelCaseToSnakeCase(str: string): string {
    return str
      .replace(/([A-Z]+)/g, '_$1')
      .toLowerCase()
      .replace(/^_+/, '');
  }

  /**
   * Transforms the property to its attribute representation
   * in the database
   * @param propName The name of the property
   * @returns The attribute name
   */
  public static toAttributeName(propName: string): string {
    return this.camelCaseToSnakeCase(propName);
  }

  /**
   * Transforms the class name to its entity representation
   * in the database
   * @param className The name of the class
   * @returns The entity name
   */
  public static toTableName<T>(className: new () => T): string {
    return this.camelCaseToSnakeCase(className.name).replace(/_entity$/, '');
  }

  /**
   * Truncates the string to the specified number
   * of characters if necessary
   * @param str The string
   * @param length The max length of the string
   * @returns The truncated string or the original string,
   * if it already met the constraints
   */
  public static truncateString<T extends string | null>(
    str: T,
    length: number,
  ): T {
    if (!str) return str as T;
    if (str.length <= length) return str;

    const ff = '[...]';
    const truncatedString = str.substring(0, length - ff.length - 1).split(' ');
    truncatedString.pop();
    return `${truncatedString.join(' ')} ${ff}` as T;
  }
}

export default TransformerUtils;
