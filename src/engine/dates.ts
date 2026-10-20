import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import type { Weekday } from './types'

// Calendar dates are plain 'yyyy-MM-dd' strings so day arithmetic never touches a timezone.
// Instants are only built (via fromZonedTime) once a local date and time are known, which keeps
// 23:55 at 23:55 across daylight saving changes.

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

function toUtcNoon(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12))
}

export function addDays(date: string, n: number): string {
  const t = toUtcNoon(date)
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10)
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(date: string): number {
  return (toUtcNoon(date).getUTCDay() + 6) % 7
}

export function weekdayOf(date: string): Weekday {
  return WEEKDAYS[weekdayIndex(date)]
}

export function localDate(instant: Date, tz: string): string {
  return formatInTimeZone(instant, tz, 'yyyy-MM-dd')
}

export function localTime(instant: Date, tz: string): string {
  return formatInTimeZone(instant, tz, 'HH:mm')
}

/** Build an instant from a local date and 'HH:mm' time in tz. */
export function at(date: string, time: string, tz: string): Date {
  return fromZonedTime(`${date}T${time}:00`, tz)
}

export function addWeeks(instant: Date, weeks: number, tz: string): Date {
  return at(addDays(localDate(instant, tz), weeks * 7), localTime(instant, tz), tz)
}

export const HOUR = 3_600_000
