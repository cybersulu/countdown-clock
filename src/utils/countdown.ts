/**
 * Precise calendar countdown calculation across 6 units:
 * Years, Months, Days, Hours, Minutes, and Seconds.
 */

export interface CountdownTime {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isPast: boolean;
  isZero: boolean;
  formattedString: string;
}

export function padZero(num: number): string {
  return num < 10 && num >= 0 ? `0${num}` : `${num}`;
}

/**
 * Calculates accurate calendar difference between two timestamps
 * taking into account varying days in months and leap years.
 */
export function calculatePreciseCountdown(targetDate: Date | string, referenceDate: Date = new Date()): CountdownTime {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = referenceDate;

  const diffMs = target.getTime() - now.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);

  if (totalSeconds <= 0) {
    const absSeconds = Math.abs(totalSeconds);
    const isZero = absSeconds === 0;

    // For past events, calculate elapsed time
    const elapsed = calculateCalendarSpan(target, now);

    return {
      years: elapsed.years,
      months: elapsed.months,
      days: elapsed.days,
      hours: elapsed.hours,
      minutes: elapsed.minutes,
      seconds: elapsed.seconds,
      totalSeconds,
      isPast: totalSeconds < 0,
      isZero,
      formattedString: isZero
        ? '0y 0m 0d 00h 00m 00s'
        : `+${elapsed.years}y ${elapsed.months}m ${elapsed.days}d ${padZero(elapsed.hours)}h ${padZero(elapsed.minutes)}m ${padZero(elapsed.seconds)}s`,
    };
  }

  // Future target
  const span = calculateCalendarSpan(now, target);

  return {
    years: span.years,
    months: span.months,
    days: span.days,
    hours: span.hours,
    minutes: span.minutes,
    seconds: span.seconds,
    totalSeconds,
    isPast: false,
    isZero: false,
    formattedString: `${span.years}y ${span.months}m ${span.days}d ${padZero(span.hours)}h ${padZero(span.minutes)}m ${padZero(span.seconds)}s`,
  };
}

interface Span {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Helper to compute calendar difference from earlierDate to laterDate
 */
function calculateCalendarSpan(earlier: Date, later: Date): Span {
  let y = later.getFullYear() - earlier.getFullYear();
  let m = later.getMonth() - earlier.getMonth();
  let d = later.getDate() - earlier.getDate();
  let h = later.getHours() - earlier.getHours();
  let min = later.getMinutes() - earlier.getMinutes();
  let s = later.getSeconds() - earlier.getSeconds();

  if (s < 0) {
    s += 60;
    min--;
  }
  if (min < 0) {
    min += 60;
    h--;
  }
  if (h < 0) {
    h += 24;
    d--;
  }
  if (d < 0) {
    // Determine the number of days in the month preceding later's month
    const previousMonthDays = new Date(later.getFullYear(), later.getMonth(), 0).getDate();
    d += previousMonthDays;
    m--;
  }
  if (m < 0) {
    m += 12;
    y--;
  }

  return {
    years: Math.max(0, y),
    months: Math.max(0, m),
    days: Math.max(0, d),
    hours: Math.max(0, h),
    minutes: Math.max(0, min),
    seconds: Math.max(0, s),
  };
}

/**
 * Formats a Date object to local human-friendly string
 */
export function formatFriendlyDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
