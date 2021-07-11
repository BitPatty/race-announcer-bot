import * as moment from 'moment';

class DateTimeUtils {
  public static parseISOTimeSpanToSeconds(
    timespan: string | null,
  ): number | null {
    if (!timespan) return null;
    return moment.duration(timespan).asSeconds();
  }
}

export default DateTimeUtils;
