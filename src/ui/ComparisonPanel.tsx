import { useState } from 'react'
import { fmtDay, fmtDayTime, fmtHours, fmtTime, type Comparison, type Fixture, type LegacyWindow } from '../engine'

type Tab = 'matched' | 'extra' | 'missing'
const LIMIT = 50

export function ComparisonPanel({ tz, fixture, comparison }: { tz: string; fixture: Fixture; comparison: Comparison }) {
  const [tab, setTab] = useState<Tab>('matched')
  const [all, setAll] = useState(false)

  const names = new Map<string, string>([
    ...fixture.zones.map((z) => [`delivery|${z.id}`, z.name] as const),
    ...fixture.pickupLocations.map((p) => [`pickup|${p.id}`, p.name] as const),
  ])
  const legacyName = (l: LegacyWindow) =>
    names.get(`${l.type}|${l.type === 'delivery' ? l.zoneId : l.pickupLocationId}`) ?? 'Unknown location'

  const diffIds = new Set(comparison.cutoffDiffs.map((m) => m.generated.id))

  const rows: { key: string; name: string; from: Date; to: Date; cutoff: string; note?: string; warn?: boolean }[] =
    tab === 'matched'
      ? comparison.matched.map((m) => ({
          key: m.generated.id,
          name: m.generated.locationName,
          from: m.generated.from,
          to: m.generated.to,
          cutoff: fmtDayTime(m.generated.cutoff, tz),
          note: diffIds.has(m.generated.id)
            ? `Cutoff ${fmtHours(m.cutoffDiffHours)} vs legacy ${fmtDayTime(new Date(m.legacy.cutoff), tz)}`
            : undefined,
          warn: diffIds.has(m.generated.id),
        }))
      : tab === 'extra'
        ? comparison.extra.map((g) => ({
            key: g.id,
            name: g.locationName,
            from: g.from,
            to: g.to,
            cutoff: fmtDayTime(g.cutoff, tz),
          }))
        : comparison.missing.map((l, i) => ({
            key: `${i}`,
            name: legacyName(l),
            from: new Date(l.from),
            to: new Date(l.to),
            cutoff: fmtDayTime(new Date(l.cutoff), tz),
            note: l.private ? 'Private pickup' : undefined,
          }))

  const shown = all ? rows : rows.slice(0, LIMIT)
  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: 'matched', label: 'Matched', n: comparison.matched.length },
    { id: 'extra', label: 'Extra', n: comparison.extra.length },
    { id: 'missing', label: 'Missing', n: comparison.missing.length },
  ]

  return (
    <section className="panel" aria-labelledby="comparison-title">
      <h2 id="comparison-title" className="panel-title">
        Comparison with legacy
      </h2>
      <p className="muted small">
        Against {fixture.referenceMenu.legacyWindows.length} legacy windows on menu {fixture.referenceMenu.id}.
        {comparison.cutoffDiffs.length > 0 && <> {comparison.cutoffDiffs.length} matched cutoffs differ by 1 hour or more.</>}
      </p>
      <div className="counts" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`count count-${t.id} ${tab === t.id ? 'on' : ''}`}
            onClick={() => {
              setTab(t.id)
              setAll(false)
            }}
          >
            <span className="count-n">{t.n}</span>
            <span className="count-label">{t.label}</span>
          </button>
        ))}
      </div>
      <p className="muted small">
        {tab === 'matched' && 'Generated and in legacy, by location, start and end.'}
        {tab === 'extra' && 'Generated but not in legacy.'}
        {tab === 'missing' && 'In legacy but not generated.'}
      </p>
      {rows.length === 0 ? (
        <p className="muted small">None.</p>
      ) : (
        <ul className="rows">
          {shown.map((r) => (
            <li key={r.key} className={`row row-compare ${r.warn ? 'row-warn' : ''}`}>
              <span className="row-name">{r.name}</span>
              <span className="row-day">{fmtDay(r.from, tz)}</span>
              <span className="row-time">
                {fmtTime(r.from, tz)} – {fmtTime(r.to, tz)}
              </span>
              <span className="row-cutoff">Order by {r.cutoff}</span>
              {r.note && <span className="row-note">{r.note}</span>}
            </li>
          ))}
        </ul>
      )}
      {rows.length > LIMIT && (
        <button type="button" className="link-button small" onClick={() => setAll((v) => !v)}>
          {all ? 'Show fewer' : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  )
}
