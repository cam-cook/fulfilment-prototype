import { at, localDate, localTime } from './engine/dates'
import { DEFAULT_RULES, type Fixture, type MenuState, type Rules, type StartSetting } from './engine'

/** Everything the controls edit. Dates and times are local to the Cook, as typed. */
export interface Draft {
  openDate: string
  openTime: string
  closeDate: string
  closeTime: string
  zoneIds: number[]
  pickupLocationIds: number[]
  startLater: boolean
  laterMode: 'after_close' | 'specific_date'
  specificDate: string
  rules: Rules
  /** Simulated now, 'yyyy-MM-ddTHH:mm' local. */
  now: string
  showHidden: boolean
}

export function draftFromFixture(f: Fixture): Draft {
  const tz = f.cook.timezone
  const open = new Date(f.referenceMenu.opensAt)
  const close = new Date(f.referenceMenu.closesAt)
  const s = f.suggestedStart
  return {
    openDate: localDate(open, tz),
    openTime: localTime(open, tz),
    closeDate: localDate(close, tz),
    closeTime: localTime(close, tz),
    zoneIds: [...f.referenceMenu.zoneIds],
    pickupLocationIds: [...f.referenceMenu.pickupLocationIds],
    startLater: s.type !== 'menu_opens',
    laterMode: s.type === 'specific_date' ? 'specific_date' : 'after_close',
    specificDate: s.type === 'specific_date' ? s.date : localDate(close, tz),
    rules: { ...DEFAULT_RULES },
    now: `${localDate(open, tz)}T${localTime(open, tz)}`,
    showHidden: false,
  }
}

export function startFromDraft(d: Draft): StartSetting {
  if (!d.startLater) return { type: 'menu_opens' }
  if (d.laterMode === 'specific_date' && d.specificDate) return { type: 'specific_date', date: d.specificDate }
  return { type: 'after_close' }
}

export type MenuParse =
  | { ok: true; menu: MenuState }
  | { ok: false; reason: 'no_open' | 'no_close' | 'close_before_open' }

export function menuFromDraft(d: Draft, tz: string): MenuParse {
  if (!d.openDate || !d.openTime) return { ok: false, reason: 'no_open' }
  if (!d.closeDate || !d.closeTime) return { ok: false, reason: 'no_close' }
  const opensAt = at(d.openDate, d.openTime, tz)
  const closesAt = at(d.closeDate, d.closeTime, tz)
  if (!(closesAt > opensAt)) return { ok: false, reason: 'close_before_open' }
  return {
    ok: true,
    menu: { opensAt, closesAt, zoneIds: d.zoneIds, pickupLocationIds: d.pickupLocationIds, start: startFromDraft(d) },
  }
}

export function nowFromDraft(d: Draft, tz: string): Date | null {
  const [date, time] = d.now.split('T')
  return date && time ? at(date, time.slice(0, 5), tz) : null
}
