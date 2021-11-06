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
 * Checks if the specified enum contains the specified value
 * @param enumeration The enum
 * @param value The value
 * @param ignoreCasing Whether perform a case insensitive search
 * @returns True if the enum contains the specified value
 */
const enumContainsValue = <T extends string, TEnumValue extends string>(
  enumeration: { [key in T]: TEnumValue },
  value: TEnumValue,
  ignoreCasing = true,
): boolean => {
  const enumValues = Object.values(enumeration) as TEnumValue[];
  return ignoreCasing
    ? enumValues.map((e) => e.toLowerCase()).includes(value.toLowerCase())
    : enumValues.includes(value);
};

/**
 * Gets the values contained within the specified enum
 * @param enumeration The enum
 * @returns The values within the enum
 */
const getEnumValues = <
  T extends string,
  TEnumValue extends string,
>(enumeration: { [key in T]: TEnumValue }): TEnumValue[] => {
  return Object.values(enumeration);
};

/**
 * Finds the enum value for the specified string
 * (CASE INSENSITIVE)
 * @param enumeration The enum
 * @param value The value
 * @returns The enum value or NULL if the string
 * is not contained in the enum
 */
const parseEnumValue = <T extends string, TEnumValue extends string>(
  enumeration: { [key in T]: TEnumValue },
  value: TEnumValue | null,
): TEnumValue | null => {
  if (!value) return null;
  const enumValues = Object.values(enumeration) as TEnumValue[];
  return (
    enumValues.find((e) => e.toLowerCase() === value.toLowerCase()) ?? null
  );
};

export { enumContainsValue, getEnumValues, parseEnumValue };
