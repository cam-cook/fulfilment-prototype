import { HOUR } from './dates'
import type { Fixture, GeneratedWindow, LegacyWindow } from './types'

export interface Match {
  generated: GeneratedWindow
  legacy: LegacyWindow
  /** Effective cutoff minus legacy cutoff, in hours. */
  cutoffDiffHours: number
}

export interface Comparison {
  matched: Match[]
  extra: GeneratedWindow[]
  missing: LegacyWindow[]
  /** Matched windows whose cutoff differs by 1 hour or more. */
  cutoffDiffs: Match[]
}

const legacyLocation = (w: LegacyWindow) => (w.type === 'delivery' ? w.zoneId : w.pickupLocationId)

// Same instant means same local start and end on the same date, so keys can use epoch millis.
const key = (type: string, loc: number | undefined, from: number, to: number) =>
  `${type}|${loc}|${from}|${to}`

export function compareWithLegacy(fixture: Fixture, offered: GeneratedWindow[]): Comparison {
  const pool = new Map<string, LegacyWindow[]>()
  for (const l of fixture.referenceMenu.legacyWindows) {
    const k = key(l.type, legacyLocation(l), Date.parse(l.from), Date.parse(l.to))
    pool.set(k, [...(pool.get(k) ?? []), l])
  }

  const matched: Match[] = []
  const extra: GeneratedWindow[] = []
  for (const g of offered) {
    const k = key(g.type, g.locationId, g.from.getTime(), g.to.getTime())
    const bucket = pool.get(k)
    const legacy = bucket?.shift()
    if (legacy) {
      matched.push({
        generated: g,
        legacy,
        cutoffDiffHours: (g.cutoff.getTime() - Date.parse(legacy.cutoff)) / HOUR,
      })
    } else {
      extra.push(g)
    }
  }

  const missing = [...pool.values()].flat()
  missing.sort((a, b) => Date.parse(a.from) - Date.parse(b.from))

  return {
    matched,
    extra,
    missing,
    cutoffDiffs: matched.filter((m) => Math.abs(m.cutoffDiffHours) >= 1),
  }
}
