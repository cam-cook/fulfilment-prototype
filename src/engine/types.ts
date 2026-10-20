export type FulfilmentType = 'delivery' | 'pickup'

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type Deadline =
  | { strategy: 'days_before_at_time'; daysBefore: number; time: string }
  | { strategy: 'weekday_weeks_before_at_time'; weekday: Weekday; weeksBefore: number; time: string }

export interface Schedule {
  id: string
  type: FulfilmentType
  zoneId?: number
  pickupLocationId?: number
  days: Weekday[]
  timeWindows: { start: string; end: string }[]
  deadline: Deadline
  maxOrders: number | null
}

export interface LegacyWindow {
  type: FulfilmentType
  zoneId?: number
  pickupLocationId?: number
  from: string
  to: string
  cutoff: string
  maxOrders: number | null
  private: boolean
}

export type StartSetting =
  | { type: 'menu_opens' }
  | { type: 'after_close' }
  | { type: 'specific_date'; date: string } // yyyy-MM-dd, local

export interface Fixture {
  cook: {
    id: number
    name: string
    timezone: string
    ordersPerWeek: number
    riskTags: string[]
    why: string
  }
  suggestedStart: StartSetting
  zones: { id: number; name: string }[]
  pickupLocations: { id: number; name: string; private?: boolean }[]
  schedules: Schedule[]
  referenceMenu: {
    id: number
    name: string
    opensAt: string
    closesAt: string
    zoneIds: number[]
    pickupLocationIds: number[]
    legacyWindows: LegacyWindow[]
    legacyTruncated?: boolean
  }
}

export interface MenuState {
  opensAt: Date
  closesAt: Date
  zoneIds: number[]
  pickupLocationIds: number[]
  start: StartSetting
}

/** One toggle per ASSUMPTION in GENERATION-RULES.md. */
export interface Rules {
  /** A1: weeks past max(menu close, first fulfilment). */
  horizonWeeks: 4 | 8 | 26
  /** A2: what happens to a window whose cutoff falls after menu close. */
  cutoffAfterClose: 'hide' | 'clamp'
  /** A3: what the unticked first fulfilment chip's range covers. */
  chipRange: 'first_week' | 'all_offered'
}

export const DEFAULT_RULES: Rules = {
  horizonWeeks: 8,
  cutoffAfterClose: 'hide',
  chipRange: 'first_week',
}

export type WindowStatus =
  | 'orderable'
  | 'cutoff_passed'
  | 'not_yet_open'
  | 'hidden_before_first_fulfilment'
  | 'hidden_cutoff_after_close'

export interface GeneratedWindow {
  id: string
  scheduleId: string
  type: FulfilmentType
  locationId: number
  locationName: string
  /** Local calendar date of the occurrence, yyyy-MM-dd. */
  date: string
  from: Date
  to: Date
  /** Cutoff from the deadline strategy, before A2 is applied. */
  rawCutoff: Date
  /** Cutoff customers see. Equals rawCutoff unless clamped. */
  cutoff: Date
  clamped: boolean
  maxOrders: number | null
  status: WindowStatus
}

export interface GenerationResult {
  firstFulfilment: Date
  horizon: Date
  /** Every non-dropped occurrence, hidden ones included. */
  windows: GeneratedWindow[]
  /** Only what customers would be offered. */
  offered: GeneratedWindow[]
  /** Count of occurrences dropped because their cutoff is at or before menu open. */
  droppedNeverOrderable: number
}

export const isHidden = (s: WindowStatus) =>
  s === 'hidden_before_first_fulfilment' || s === 'hidden_cutoff_after_close'
