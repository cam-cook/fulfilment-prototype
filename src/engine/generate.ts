import { addDays, addWeeks, at, localDate, weekdayIndex, weekdayOf, WEEKDAYS } from './dates'
import type {
  Deadline,
  Fixture,
  GeneratedWindow,
  GenerationResult,
  MenuState,
  Rules,
  StartSetting,
} from './types'
import { isHidden } from './types'

export function firstFulfilmentDate(menu: MenuState, tz: string): Date {
  return resolveStart(menu.start, menu, tz)
}

function resolveStart(start: StartSetting, menu: MenuState, tz: string): Date {
  switch (start.type) {
    case 'menu_opens':
      return menu.opensAt
    case 'after_close':
      return menu.closesAt
    case 'specific_date':
      return at(start.date, '00:00', tz)
  }
}

export function applyDeadline(deadline: Deadline, occurrenceDate: string, tz: string): Date {
  if (deadline.strategy === 'days_before_at_time') {
    return at(addDays(occurrenceDate, -deadline.daysBefore), deadline.time, tz)
  }
  // Weeks start on Monday.
  const monday = addDays(occurrenceDate, -weekdayIndex(occurrenceDate))
  const targetMonday = addDays(monday, -7 * deadline.weeksBefore)
  return at(addDays(targetMonday, WEEKDAYS.indexOf(deadline.weekday)), deadline.time, tz)
}

export function generateWindows(
  fixture: Fixture,
  menu: MenuState,
  rules: Rules,
  now: Date,
): GenerationResult {
  const tz = fixture.cook.timezone
  const first = firstFulfilmentDate(menu, tz)
  const horizonBase = first > menu.closesAt ? first : menu.closesAt
  const horizon = addWeeks(horizonBase, rules.horizonWeeks, tz)

  // Generate from whichever is earlier, open or first fulfilment, so occurrences before first
  // fulfilment exist and can be shown as hidden.
  const startDate = localDate(first < menu.opensAt ? first : menu.opensAt, tz)
  const endDate = localDate(horizon, tz)

  const zoneNames = new Map(fixture.zones.map((z) => [z.id, z.name]))
  const pickupNames = new Map(fixture.pickupLocations.map((p) => [p.id, p.name]))
  const zoneSet = new Set(menu.zoneIds)
  const pickupSet = new Set(menu.pickupLocationIds)

  const windows: GeneratedWindow[] = []
  let dropped = 0

  for (const s of fixture.schedules) {
    const locationId = s.type === 'delivery' ? s.zoneId! : s.pickupLocationId!
    const selected = s.type === 'delivery' ? zoneSet.has(locationId) : pickupSet.has(locationId)
    if (!selected) continue
    const locationName =
      (s.type === 'delivery' ? zoneNames.get(locationId) : pickupNames.get(locationId)) ??
      `#${locationId}`
    const days = new Set(s.days)

    for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
      if (!days.has(weekdayOf(d))) continue
      for (const tw of s.timeWindows) {
        const from = at(d, tw.start, tz)
        if (from > horizon) continue
        const to = tw.end > tw.start ? at(d, tw.end, tz) : at(addDays(d, 1), tw.end, tz)
        const rawCutoff = applyDeadline(s.deadline, d, tz)

        // Step 4: a cutoff at or before open can never be ordered.
        if (rawCutoff <= menu.opensAt) {
          dropped++
          continue
        }

        let cutoff = rawCutoff
        let clamped = false
        let status: GeneratedWindow['status'] | null = null

        if (from < first) {
          status = 'hidden_before_first_fulfilment'
        } else if (rawCutoff > menu.closesAt) {
          if (rules.cutoffAfterClose === 'hide') {
            status = 'hidden_cutoff_after_close'
          } else {
            cutoff = menu.closesAt
            clamped = true
          }
        }

        if (status === null) {
          if (now < menu.opensAt) status = 'not_yet_open'
          else if (now >= cutoff) status = 'cutoff_passed'
          else status = 'orderable'
        }

        windows.push({
          id: `${s.id}:${d}:${tw.start}`,
          scheduleId: s.id,
          type: s.type,
          locationId,
          locationName,
          date: d,
          from,
          to,
          rawCutoff,
          cutoff,
          clamped,
          maxOrders: s.maxOrders,
          status,
        })
      }
    }
  }

  windows.sort((a, b) => a.from.getTime() - b.from.getTime() || a.locationName.localeCompare(b.locationName))

  return {
    firstFulfilment: first,
    horizon,
    windows,
    offered: windows.filter((w) => !isHidden(w.status)),
    droppedNeverOrderable: dropped,
  }
}
