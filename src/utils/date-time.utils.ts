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

import * as moment from 'moment';

class DateTimeUtils {
  /**
   * Parses an ISO 8601 duration and returns the total
   * seconds in the timespan (rounded down!)
   * @param timespan The timespan string
   * @returns The total seconds in the timespan
   */
  public static parseISOTimeSpanToSeconds(
    timespan: string | null,
  ): number | null {
    if (!timespan) return null;
    return Math.floor(moment.duration(timespan).asSeconds());
  }

  /**
   * Subtracts the specified number of hours from the timestamp
   * @param date The timestamp
   * @param hours The number of hours to subtract
   * @returns The updated date
   */
  public static subtractHours(date: Date, hours: number): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() - hours);
    return newDate;
  }
}

export default DateTimeUtils;
