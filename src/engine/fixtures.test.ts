import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES, generateWindows, menuStateFromFixture, type Fixture } from './index'

const modules = import.meta.glob('../../data/fixtures/*.json', { eager: true }) as Record<
  string,
  { default: Fixture }
>

const fixtures = Object.entries(modules).map(([path, mod]) => ({
  name: path.split('/').pop()!.replace('.json', ''),
  fixture: (mod.default ?? mod) as Fixture,
}))

describe('fixtures', () => {
  it('finds fixture files', () => {
    expect(fixtures.length).toBeGreaterThan(0)
  })

  describe.each(fixtures)('$name', ({ fixture: f }) => {
    it('has the required keys', () => {
      for (const k of ['cook', 'suggestedStart', 'zones', 'pickupLocations', 'schedules', 'referenceMenu']) {
        expect(f).toHaveProperty(k)
      }
      for (const k of ['id', 'name', 'timezone', 'ordersPerWeek', 'riskTags', 'why']) {
        expect(f.cook).toHaveProperty(k)
      }
      for (const k of ['id', 'name', 'opensAt', 'closesAt', 'zoneIds', 'pickupLocationIds', 'legacyWindows']) {
        expect(f.referenceMenu).toHaveProperty(k)
      }
      expect(['menu_opens', 'after_close', 'specific_date']).toContain(f.suggestedStart.type)
    })

    const zoneIds = new Set(f.zones.map((z) => z.id))
    const pickupIds = new Set(f.pickupLocations.map((p) => p.id))

    it('every schedule location exists', () => {
      for (const s of f.schedules) {
        if (s.type === 'delivery') expect(zoneIds.has(s.zoneId!), `${s.id} zone ${s.zoneId}`).toBe(true)
        else expect(pickupIds.has(s.pickupLocationId!), `${s.id} pickup ${s.pickupLocationId}`).toBe(true)
      }
    })

    it('every reference menu location exists', () => {
      for (const id of f.referenceMenu.zoneIds) expect(zoneIds.has(id), `zone ${id}`).toBe(true)
      for (const id of f.referenceMenu.pickupLocationIds) expect(pickupIds.has(id), `pickup ${id}`).toBe(true)
      for (const w of f.referenceMenu.legacyWindows) {
        if (w.type === 'delivery') expect(zoneIds.has(w.zoneId!), `legacy zone ${w.zoneId}`).toBe(true)
        else expect(pickupIds.has(w.pickupLocationId!), `legacy pickup ${w.pickupLocationId}`).toBe(true)
      }
    })

    it('closesAt is after opensAt', () => {
      expect(new Date(f.referenceMenu.closesAt).getTime()).toBeGreaterThan(
        new Date(f.referenceMenu.opensAt).getTime(),
      )
    })

    it('generates windows without throwing', () => {
      expect(() =>
        generateWindows(f, menuStateFromFixture(f), DEFAULT_RULES, new Date(f.referenceMenu.opensAt)),
      ).not.toThrow()
    })
  })
})
