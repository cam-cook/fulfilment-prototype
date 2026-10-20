import type { Comparison } from './compare'
import { addDays, at, localDate, weekdayIndex } from './dates'
import { fmtDay, plural } from './format'
import type { Fixture, GenerationResult, MenuState } from './types'

export interface Flag {
  id: string
  severity: 'warning' | 'info'
  title: string
  detail: string
}

function multiple(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

export function computeFlags(
  fixture: Fixture,
  menu: MenuState,
  result: GenerationResult,
  comparison: Comparison,
): Flag[] {
  const tz = fixture.cook.timezone
  const legacy = fixture.referenceMenu.legacyWindows
  const offered = result.offered
  const flags: Flag[] = []

  if (legacy.length > 0 && offered.length > legacy.length) {
    flags.push({
      id: 'more-than-legacy',
      severity: 'warning',
      title: `${multiple(offered.length / legacy.length)}× legacy windows`,
      detail: `${plural(offered.length, 'window')} offered, against ${legacy.length} on the legacy menu.`,
    })
  }

  // The intended delivery week is the Monday-to-Sunday week of the last legacy window.
  if (legacy.length > 0) {
    const lastLegacy = legacy.reduce((a, b) => (Date.parse(b.from) > Date.parse(a.from) ? b : a))
    const lastDate = localDate(new Date(lastLegacy.from), tz)
    const weekEnd = at(addDays(lastDate, 7 - weekdayIndex(lastDate)), '00:00', tz)
    const after = offered.filter((w) => w.from >= weekEnd)
    if (after.length > 0) {
      flags.push({
        id: 'after-intended-week',
        severity: 'warning',
        title: 'Windows offered after the intended delivery week',
        detail: `${plural(after.length, 'window')} fall after the week of ${fmtDay(new Date(lastLegacy.from), tz)}, the last legacy window.`,
      })
    }
  }

  if (comparison.missing.length > 0) {
    flags.push({
      id: 'missing',
      severity: 'warning',
      title: `${plural(comparison.missing.length, 'legacy window')} can't be generated`,
      detail: 'The schedules don’t produce these, so customers would lose them.',
    })
  }

  if (comparison.cutoffDiffs.length > 0) {
    const max = Math.max(...comparison.cutoffDiffs.map((m) => Math.abs(m.cutoffDiffHours)))
    flags.push({
      id: 'cutoff-diff',
      severity: 'warning',
      title: `${plural(comparison.cutoffDiffs.length, 'cutoff')} differ from legacy`,
      detail: `Up to ${multiple(max)} hours apart on matched windows.`,
    })
  }

  const privateLegacy = legacy.filter((w) => w.type === 'pickup' && w.private)
  if (privateLegacy.length > 0) {
    flags.push({
      id: 'private-pickup',
      severity: 'warning',
      title: 'Private pickups used in legacy',
      detail: `${plural(privateLegacy.length, 'legacy pickup window')} ${privateLegacy.length === 1 ? 'is' : 'are'} private. The card has no private option.`,
    })
  }

  if (menu.zoneIds.length > 50) {
    flags.push({
      id: 'many-zones',
      severity: 'info',
      title: 'More than 50 zones selected',
      detail: `${menu.zoneIds.length} zones selected on this menu.`,
    })
  }

  const perDay = new Map<string, { name: string; date: string; n: number }>()
  for (const w of offered) {
    const k = `${w.type}|${w.locationId}|${w.date}`
    const e = perDay.get(k) ?? { name: w.locationName, date: w.date, n: 0 }
    e.n++
    perDay.set(k, e)
  }
  const busiest = [...perDay.values()].filter((e) => e.n > 30).sort((a, b) => b.n - a.n)
  if (busiest.length > 0) {
    flags.push({
      id: 'slot-style',
      severity: 'warning',
      title: 'Slot-style schedule',
      detail: `Up to ${busiest[0].n} windows a day in ${busiest[0].name}.`,
    })
  }

  return flags
}
