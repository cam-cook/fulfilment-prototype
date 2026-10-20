import type { Fixture } from '../engine'
import type { Draft } from '../state'
import { MultiSelect } from './MultiSelect'
import { CalendarIcon, EyeIcon, TruckIcon } from './icons'

interface Props {
  fixture: Fixture
  draft: Draft
  update: (patch: Partial<Draft>) => void
  chip: string
  hasOpen: boolean
  onPreview: () => void
}

export function FulfilmentCard({ fixture, draft, update, chip, hasOpen, onPreview }: Props) {
  const hasDelivery = draft.zoneIds.length > 0
  const hasPickup = draft.pickupLocationIds.length > 0

  const basedOn =
    hasDelivery && hasPickup ? (
      <>
        Based on <u>Delivery</u> and <u>Pickup</u> schedules.
      </>
    ) : hasPickup ? (
      <>
        Based on <u>Pickup</u> schedules.
      </>
    ) : hasDelivery ? (
      <>
        Based on <u>Delivery</u> schedules.
      </>
    ) : (
      <>Select a zone or pickup location.</>
    )

  const infoChip = (
    <div className={`info-chip ${hasOpen ? 'blue' : 'grey'}`} role="status">
      {hasOpen ? <TruckIcon /> : <CalendarIcon />}
      {chip}
    </div>
  )

  return (
    <section className="card" aria-labelledby="fulfilment-title">
      <div className="card-head">
        <h2 id="fulfilment-title" className="card-title">
          Fulfilment
        </h2>
        <button type="button" className="button button-secondary" onClick={onPreview}>
          <EyeIcon /> Preview windows
        </button>
      </div>

      <MultiSelect
        id="zones"
        label="Delivery zones"
        placeholder="Select zones"
        noteLabel="Add delivery note"
        options={fixture.zones}
        selected={draft.zoneIds}
        onChange={(zoneIds) => update({ zoneIds })}
      />
      <MultiSelect
        id="pickups"
        label="Pickup locations"
        placeholder="Select locations"
        noteLabel="Add pickup note"
        options={fixture.pickupLocations}
        selected={draft.pickupLocationIds}
        onChange={(pickupLocationIds) => update({ pickupLocationIds })}
      />

      <hr className="divider" />

      <div className="field-label">First fulfilment</div>
      <p className="card-helper">{basedOn}</p>

      {!draft.startLater && infoChip}

      <label className="check">
        <input type="checkbox" checked={draft.startLater} onChange={(e) => update({ startLater: e.target.checked })} />
        Start fulfilment later
      </label>

      {draft.startLater && (
        <div className="later">
          <label className="radio">
            <input
              type="radio"
              name="later"
              checked={draft.laterMode === 'after_close'}
              onChange={() => update({ laterMode: 'after_close' })}
            />
            After ordering closes
          </label>
          <label className="radio">
            <input
              type="radio"
              name="later"
              checked={draft.laterMode === 'specific_date'}
              onChange={() => update({ laterMode: 'specific_date' })}
            />
            From a specific date
          </label>
          {draft.laterMode === 'specific_date' && (
            <input
              className="input"
              type="date"
              aria-label="First fulfilment date"
              value={draft.specificDate}
              onChange={(e) => update({ specificDate: e.target.value })}
            />
          )}
        </div>
      )}

      {draft.startLater && infoChip}
    </section>
  )
}
