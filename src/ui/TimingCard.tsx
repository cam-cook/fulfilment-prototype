import type { Draft } from '../state'

interface Props {
  draft: Draft
  update: (patch: Partial<Draft>) => void
  error: 'no_open' | 'no_close' | 'close_before_open' | null
}

export function TimingCard({ draft, update, error }: Props) {
  return (
    <section className="card" aria-labelledby="timing-title">
      <h2 id="timing-title" className="card-title">
        Timing
      </h2>
      <p className="card-helper">
        Set opening and closing times for this menu.{' '}
        <a href="#" onClick={(e) => e.preventDefault()}>
          Tips for best open and closing time
        </a>
      </p>

      <div className="timing-row">
        <div className="field-label">Menu open</div>
        <div className="pair">
          <input
            className="input"
            type="date"
            aria-label="Menu open date"
            value={draft.openDate}
            onChange={(e) => update({ openDate: e.target.value })}
          />
          <input
            className="input"
            type="time"
            aria-label="Menu open time"
            value={draft.openTime}
            onChange={(e) => update({ openTime: e.target.value })}
          />
        </div>
      </div>

      <div className="timing-row">
        <div className="field-label">Menu close</div>
        <div className="pair">
          <input
            className={`input ${error === 'close_before_open' ? 'invalid' : ''}`}
            type="date"
            aria-label="Menu close date"
            aria-invalid={error === 'close_before_open'}
            value={draft.closeDate}
            onChange={(e) => update({ closeDate: e.target.value })}
          />
          <input
            className={`input ${error === 'close_before_open' ? 'invalid' : ''}`}
            type="time"
            aria-label="Menu close time"
            aria-invalid={error === 'close_before_open'}
            value={draft.closeTime}
            onChange={(e) => update({ closeTime: e.target.value })}
          />
        </div>
        {error === 'close_before_open' && (
          <p className="field-error" role="alert">
            Menu close must be after menu open.
          </p>
        )}
        {error === 'no_close' && (
          <p className="field-error" role="alert">
            Add a close date and time.
          </p>
        )}
      </div>
    </section>
  )
}
