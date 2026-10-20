import type { Fixture, MenuState } from './types'

export * from './types'
export { generateWindows, applyDeadline, firstFulfilmentDate } from './generate'
export { compareWithLegacy } from './compare'
export type { Comparison, Match } from './compare'
export { chipText } from './chip'
export { computeFlags } from './flags'
export type { Flag } from './flags'
export * from './format'

/** The menu state a Cook's fixture resets to. */
export function menuStateFromFixture(f: Fixture): MenuState {
  return {
    opensAt: new Date(f.referenceMenu.opensAt),
    closesAt: new Date(f.referenceMenu.closesAt),
    zoneIds: [...f.referenceMenu.zoneIds],
    pickupLocationIds: [...f.referenceMenu.pickupLocationIds],
    start: { ...f.suggestedStart },
  }
}
