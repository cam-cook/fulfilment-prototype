import { fmtDay, fmtDayYear } from './format'
import type { GeneratedWindow, Rules, StartSetting } from './types'

const WEEK = 7 * 24 * 3_600_000

/**
 * Text for the Fulfilment card's info chip. `offered` must be sorted by start.
 * Pass `opensAt: null` when the menu has no open date yet.
 */
export function chipText(
  offered: GeneratedWindow[],
  start: StartSetting,
  opensAt: Date | null,
  rules: Rules,
  tz: string,
): string {
  if (!opensAt) return 'Set an open date for this menu to see the first delivery'
  if (offered.length === 0) return 'No windows offered with these settings'

  const earliest = offered[0]

  // "Start fulfilment later" ticked.
  if (start.type !== 'menu_opens') {
    const label = earliest.type === 'delivery' ? 'First delivery' : 'First pickup'
    return `${label} • ${fmtDay(earliest.from, tz)}`
  }

  // Unticked: A3 decides what the range covers.
  const inRange =
    rules.chipRange === 'first_week'
      ? offered.filter((w) => w.from.getTime() < earliest.from.getTime() + WEEK)
      : offered
  const latest = inRange[inRange.length - 1]
  const types = new Set(inRange.map((w) => w.type))
  const label = types.size === 2 ? 'Delivery and pickup' : types.has('delivery') ? 'Delivery' : 'Pickup'

  if (earliest.date === latest.date) return `${label} on ${fmtDayYear(earliest.from, tz)}`
  return `${label} from ${fmtDay(earliest.from, tz)} to ${fmtDayYear(latest.from, tz)}`
}
