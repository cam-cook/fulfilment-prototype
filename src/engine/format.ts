import { formatInTimeZone } from 'date-fns-tz'

// Australian, Day Month: "Mon 16 Nov", "Order by Mon 9 Nov, 11:55 pm".

export const fmtDay = (d: Date, tz: string) => formatInTimeZone(d, tz, 'EEE d MMM')
export const fmtDayYear = (d: Date, tz: string) => formatInTimeZone(d, tz, 'EEE d MMM yyyy')

export function fmtTime(d: Date, tz: string): string {
  return formatInTimeZone(d, tz, 'h:mm a').replace('AM', 'am').replace('PM', 'pm')
}

export const fmtDayTime = (d: Date, tz: string) => `${fmtDay(d, tz)}, ${fmtTime(d, tz)}`

export function fmtHours(h: number): string {
  const abs = Math.abs(h)
  const n = Number.isInteger(abs) ? String(abs) : abs.toFixed(1)
  const unit = abs === 1 ? 'hour' : 'hours'
  return `${h > 0 ? '+' : h < 0 ? '−' : ''}${n} ${unit}`
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
