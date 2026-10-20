import { describe, expect, it } from 'vitest'
import fixtureJson from '../../data/fixtures/fed-by-jed.json'
import { applyDeadline } from './generate'
import { DEFAULT_RULES, generateWindows, menuStateFromFixture, type Fixture } from './index'
import { fmtDayTime } from './format'

const MEL = 'Australia/Melbourne'

describe('deadline strategies', () => {
  it('days_before_at_time keeps 23:55 local across the April DST change', () => {
    // Melbourne leaves daylight saving on Sun 4 Apr 2027.
    const c = applyDeadline({ strategy: 'days_before_at_time', daysBefore: 7, time: '23:55' }, '2027-04-05', MEL)
    expect(fmtDayTime(c, MEL)).toBe('Mon 29 Mar, 11:55 pm')
    expect(c.toISOString()).toBe('2027-03-29T12:55:00.000Z') // +11:00
  })

  it('days_before_at_time keeps 23:55 local across the October DST change', () => {
    // Melbourne enters daylight saving on Sun 4 Oct 2026.
    const c = applyDeadline({ strategy: 'days_before_at_time', daysBefore: 7, time: '23:55' }, '2026-10-05', MEL)
    expect(c.toISOString()).toBe('2026-09-28T13:55:00.000Z') // +10:00
  })

  it('weekday_weeks_before_at_time lands on that weekday N weeks before the delivery week', () => {
    // Delivery Thu 19 Nov 2026 → its week starts Mon 16 Nov → 1 week before → Fri 13 Nov.
    const c = applyDeadline(
      { strategy: 'weekday_weeks_before_at_time', weekday: 'friday', weeksBefore: 1, time: '17:00' },
      '2026-11-19',
      MEL,
    )
    expect(fmtDayTime(c, MEL)).toBe('Fri 13 Nov, 5:00 pm')
  })

  it('weekday_weeks_before_at_time with 0 weeks uses the delivery week itself', () => {
    const c = applyDeadline(
      { strategy: 'weekday_weeks_before_at_time', weekday: 'monday', weeksBefore: 0, time: '09:00' },
      '2026-11-22', // Sunday
      MEL,
    )
    expect(fmtDayTime(c, MEL)).toBe('Mon 16 Nov, 9:00 am')
  })
})

describe('status relative to simulated now', () => {
  const fixture = fixtureJson as Fixture
  const menu = { ...menuStateFromFixture(fixture), start: { type: 'menu_opens' as const } }

  it('everything is Not yet open before the menu opens', () => {
    const r = generateWindows(fixture, menu, DEFAULT_RULES, new Date('2026-10-01T00:00:00+10:00'))
    expect(new Set(r.offered.map((w) => w.status))).toEqual(new Set(['not_yet_open']))
  })

  it('Cutoff passed once now reaches the cutoff', () => {
    const r = generateWindows(fixture, menu, DEFAULT_RULES, new Date('2026-10-19T23:55:00+11:00'))
    const mon26 = r.offered.filter((w) => w.date === '2026-10-26')
    expect(mon26.every((w) => w.status === 'cutoff_passed')).toBe(true)
    const mon2 = r.offered.filter((w) => w.date === '2026-11-02')
    expect(mon2.every((w) => w.status === 'orderable')).toBe(true)
  })

  it('deselected zones generate nothing', () => {
    const r = generateWindows(fixture, { ...menu, zoneIds: [2797] }, DEFAULT_RULES, menu.opensAt)
    expect(new Set(r.offered.map((w) => w.locationId))).toEqual(new Set([2797]))
  })
})
