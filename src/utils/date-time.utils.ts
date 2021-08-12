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
