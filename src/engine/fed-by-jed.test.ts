import { describe, expect, it } from 'vitest'
import fixtureJson from '../../data/fixtures/fed-by-jed.json'
import {
  chipText,
  compareWithLegacy,
  computeFlags,
  DEFAULT_RULES,
  fmtDay,
  fmtDayTime,
  generateWindows,
  menuStateFromFixture,
  type Fixture,
  type Rules,
  type StartSetting,
} from './index'

// Golden scenario from docs/SCENARIOS.md. Expected values are copied verbatim and must not be
// edited to make a test pass.

const fixture = fixtureJson as Fixture
const tz = fixture.cook.timezone
const MONDAY_ZONES = [2797, 2799, 2801, 2802]
const TUESDAY_ZONES = [2798, 2800]

function run(start: StartSetting, rules: Partial<Rules> = {}) {
  const menu = { ...menuStateFromFixture(fixture), start }
  const r = { ...DEFAULT_RULES, ...rules }
  const result = generateWindows(fixture, menu, r, menu.opensAt)
  const comparison = compareWithLegacy(fixture, result.offered)
  const flags = computeFlags(fixture, menu, result, comparison)
  const chip = chipText(result.offered, start, menu.opensAt, r, tz)
  const daysFor = (zone: number) =>
    result.offered.filter((w) => w.locationId === zone).map((w) => fmtDay(w.from, tz))
  return { result, comparison, flags, chip, daysFor }
}

describe('FJ-1: start after ordering closes, A2 = hide', () => {
  const s = run({ type: 'after_close' }, { cutoffAfterClose: 'hide' })

  it.each(MONDAY_ZONES)('Monday zone %i offers exactly one window, on Mon 16 Nov', (z) => {
    expect(s.daysFor(z)).toEqual(['Mon 16 Nov'])
  })

  it.each(TUESDAY_ZONES)('Tuesday zone %i offers exactly one window, on Tue 17 Nov', (z) => {
    expect(s.daysFor(z)).toEqual(['Tue 17 Nov'])
  })

  it('comparison: Matched 6, Extra 0, Missing 0', () => {
    expect(s.comparison.matched).toHaveLength(6)
    expect(s.comparison.extra).toHaveLength(0)
    expect(s.comparison.missing).toHaveLength(0)
  })

  it('chip: "First delivery • Mon 16 Nov"', () => {
    expect(s.chip).toBe('First delivery • Mon 16 Nov')
  })
})

describe('FJ-2: start when the menu opens, A2 = hide', () => {
  const s = run({ type: 'menu_opens' }, { cutoffAfterClose: 'hide' })

  it.each(MONDAY_ZONES)('Monday zone %i offers 26 Oct, 2 Nov, 9 Nov and 16 Nov', (z) => {
    expect(s.daysFor(z)).toEqual(['Mon 26 Oct', 'Mon 2 Nov', 'Mon 9 Nov', 'Mon 16 Nov'])
  })

  it('Mon 19 Oct is dropped because its cutoff falls before the menu opens', () => {
    expect(s.result.windows.some((w) => w.date === '2026-10-19')).toBe(false)
    expect(s.result.droppedNeverOrderable).toBeGreaterThan(0)
  })

  it.each(TUESDAY_ZONES)('Tuesday zone %i offers 27 Oct, 3 Nov, 10 Nov and 17 Nov', (z) => {
    expect(s.daysFor(z)).toEqual(['Tue 27 Oct', 'Tue 3 Nov', 'Tue 10 Nov', 'Tue 17 Nov'])
  })

  it('comparison: Matched 6, Extra 18, Missing 0', () => {
    expect(s.comparison.matched).toHaveLength(6)
    expect(s.comparison.extra).toHaveLength(18)
    expect(s.comparison.missing).toHaveLength(0)
  })

  it('flag: "4× legacy windows"', () => {
    expect(s.flags.map((f) => f.title)).toContain('4× legacy windows')
  })
})

describe('FJ-3: start after ordering closes, A2 = clamp', () => {
  const s = run({ type: 'after_close' }, { cutoffAfterClose: 'clamp' })
  const close = new Date(fixture.referenceMenu.closesAt)

  it('every occurrence after menu close has an effective cutoff of Mon 9 Nov at 23:55', () => {
    const after = s.result.offered.filter((w) => w.from > close)
    expect(after.length).toBeGreaterThan(0)
    for (const w of after) expect(fmtDayTime(w.cutoff, tz)).toBe('Mon 9 Nov, 11:55 pm')
  })

  it('offers occurrences up to the horizon (8 weeks by default)', () => {
    const last = s.result.offered[s.result.offered.length - 1]
    expect(last.from <= s.result.horizon).toBe(true)
    expect(fmtDay(s.result.horizon, tz)).toBe('Mon 4 Jan')
  })

  it.each([...MONDAY_ZONES, ...TUESDAY_ZONES])('zone %i offers 8 or more windows', (z) => {
    expect(s.daysFor(z).length).toBeGreaterThanOrEqual(8)
  })

  it('Extra is greater than 0', () => {
    expect(s.comparison.extra.length).toBeGreaterThan(0)
  })

  it('flag: "Windows offered after the intended delivery week"', () => {
    expect(s.flags.map((f) => f.title)).toContain('Windows offered after the intended delivery week')
  })
})
