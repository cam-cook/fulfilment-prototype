import type { Fixture, Rules } from '../engine'
import { localDate, localTime } from '../engine/dates'
import type { FixtureEntry } from '../fixtures'
import type { Draft } from '../state'

interface Props {
  fixtures: FixtureEntry[]
  slug: string
  fixture: Fixture
  draft: Draft
  onSwitch: (slug: string) => void
  onReset: () => void
  update: (patch: Partial<Draft>) => void
  menuOpensAt: Date | null
}

function Segmented<T extends string | number>(props: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  name: string
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={props.name}>
      {props.options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={props.value === o.value}
          className={props.value === o.value ? 'on' : ''}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function LeftColumn({ fixtures, slug, fixture, draft, onSwitch, onReset, update, menuOpensAt }: Props) {
  const { cook } = fixture
  const tz = cook.timezone
  const setRule = <K extends keyof Rules>(k: K, v: Rules[K]) => update({ rules: { ...draft.rules, [k]: v } })

  return (
    <>
      <div className="panel">
        <label className="field-label" htmlFor="cook">
          Cook
        </label>
        <select id="cook" className="select" value={slug} onChange={(e) => onSwitch(e.target.value)}>
          {fixtures.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.fixture.cook.name}
            </option>
          ))}
        </select>

        <dl className="summary">
          <dt>Timezone</dt>
          <dd>{tz}</dd>
          <dt>Orders a week</dt>
          <dd>{cook.ordersPerWeek}</dd>
          <dt>Zones · pickups</dt>
          <dd>
            {fixture.zones.length} · {fixture.pickupLocations.length}
          </dd>
          <dt>Legacy windows</dt>
          <dd>
            {fixture.referenceMenu.legacyWindows.length}
            {fixture.referenceMenu.legacyTruncated && <span className="muted"> (first 4 weeks only)</span>}
          </dd>
        </dl>
        <div className="tags">
          {cook.riskTags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
        <p className="why">{cook.why}</p>
      </div>

      <div className="panel">
        <h2 className="panel-title">Rules</h2>
        <p className="muted small">Assumptions from GENERATION-RULES.md. Changes apply instantly.</p>

        <div className="rule">
          <div className="rule-head">
            <span className="rule-id">A1</span> Horizon
            <span className="rule-value">{draft.rules.horizonWeeks} weeks</span>
          </div>
          <p className="muted small">Weeks generated past menu close or first fulfilment, whichever is later.</p>
          <Segmented
            name="Horizon"
            value={draft.rules.horizonWeeks}
            onChange={(v) => setRule('horizonWeeks', v)}
            options={[
              { value: 4, label: '4 weeks' },
              { value: 8, label: '8 weeks' },
              { value: 26, label: '26 weeks' },
            ]}
          />
        </div>

        <div className="rule">
          <div className="rule-head">
            <span className="rule-id">A2</span> Cutoff after menu close
            <span className="rule-value">{draft.rules.cutoffAfterClose}</span>
          </div>
          <p className="muted small">
            Hide the window, or offer it with its cutoff moved to menu close.
          </p>
          <Segmented
            name="Cutoff after menu close"
            value={draft.rules.cutoffAfterClose}
            onChange={(v) => setRule('cutoffAfterClose', v)}
            options={[
              { value: 'hide', label: 'Hide' },
              { value: 'clamp', label: 'Clamp to close' },
            ]}
          />
        </div>

        <div className="rule">
          <div className="rule-head">
            <span className="rule-id">A3</span> Unticked chip range
            <span className="rule-value">{draft.rules.chipRange === 'first_week' ? 'first week' : 'all offered'}</span>
          </div>
          <p className="muted small">What the date range on the chip covers when fulfilment starts at menu open.</p>
          <Segmented
            name="Unticked chip range"
            value={draft.rules.chipRange}
            onChange={(v) => setRule('chipRange', v)}
            options={[
              { value: 'first_week', label: 'First week' },
              { value: 'all_offered', label: 'All offered' },
            ]}
          />
        </div>
      </div>

      <div className="panel">
        <label className="field-label" htmlFor="now">
          Simulated now
        </label>
        <input
          id="now"
          className="input"
          type="datetime-local"
          value={draft.now}
          onChange={(e) => update({ now: e.target.value })}
        />
        <p className="muted small">
          In {tz}. Decides which windows are orderable.{' '}
          {menuOpensAt && (
            <button
              type="button"
              className="link-button"
              onClick={() => update({ now: `${localDate(menuOpensAt, tz)}T${localTime(menuOpensAt, tz)}` })}
            >
              Set to menu open
            </button>
          )}
        </p>
        <button type="button" className="button button-secondary full" onClick={onReset}>
          Reset to fixture
        </button>
      </div>
    </>
  )
}
