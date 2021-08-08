import * as moment from 'moment';

class DateTimeUtils {
  public static parseISOTimeSpanToSeconds(
    timespan: string | null,
  ): number | null {
    if (!timespan) return null;
    return moment.duration(timespan).asSeconds();
  }

  public static subtractHours(date: Date, hours: number): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() - hours);
    return newDate;
  }
}

export default DateTimeUtils;
