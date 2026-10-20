import { forwardRef, useState } from 'react'
import {
  fmtDay,
  fmtDayTime,
  fmtTime,
  isHidden,
  plural,
  type GeneratedWindow,
  type GenerationResult,
  type MenuState,
  type WindowStatus,
} from '../engine'
import { addDays, localDate, weekdayIndex } from '../engine/dates'
import { BagIcon, TruckIcon } from './icons'

export const STATUS_LABEL: Record<WindowStatus, string> = {
  orderable: 'Orderable',
  cutoff_passed: 'Cutoff passed',
  not_yet_open: 'Not yet open',
  hidden_before_first_fulfilment: 'Hidden: before first fulfilment',
  hidden_cutoff_after_close: 'Hidden: cutoff after menu close',
}

interface Props {
  tz: string
  sim: GenerationResult | null
  menu: MenuState | null
  stale: boolean
  showHidden: boolean
  onToggleHidden: (v: boolean) => void
}

const ROWS_PER_GROUP = 12

export const PreviewPanel = forwardRef<HTMLElement, Props>(function PreviewPanel(
  { tz, sim, menu, stale, showHidden, onToggleHidden },
  ref,
) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (!sim || !menu) {
    return (
      <section className="panel" ref={ref} tabIndex={-1} aria-labelledby="preview-title">
        <h2 id="preview-title" className="panel-title">
          Preview
        </h2>
        <p className="muted">Set an open and close time to see windows.</p>
      </section>
    )
  }

  const hiddenCount = sim.windows.length - sim.offered.length
  const list = showHidden ? sim.windows : sim.offered

  const groups = new Map<string, { name: string; type: GeneratedWindow['type']; rows: GeneratedWindow[] }>()
  for (const w of list) {
    const k = `${w.type}|${w.locationId}`
    if (!groups.has(k)) groups.set(k, { name: w.locationName, type: w.type, rows: [] })
    groups.get(k)!.rows.push(w)
  }
  const sorted = [...groups.entries()].sort(
    (a, b) => a[1].type.localeCompare(b[1].type) || a[1].name.localeCompare(b[1].name),
  )
  const locations = new Set(sim.offered.map((w) => `${w.type}|${w.locationId}`)).size

  return (
    <section className="panel" ref={ref} tabIndex={-1} aria-labelledby="preview-title">
      <div className="panel-head">
        <h2 id="preview-title" className="panel-title">
          Preview
        </h2>
        <label className="check small">
          <input type="checkbox" checked={showHidden} onChange={(e) => onToggleHidden(e.target.checked)} />
          Show hidden windows ({hiddenCount})
        </label>
      </div>
      {stale && <p className="stale">Timing has an error. Showing the last valid settings.</p>}
      <p className="muted small">
        {plural(sim.offered.length, 'window')} offered across {plural(locations, 'location')} · first fulfilment{' '}
        {fmtDayTime(sim.firstFulfilment, tz)} · horizon {fmtDay(sim.horizon, tz)}
        {sim.droppedNeverOrderable > 0 && <> · {sim.droppedNeverOrderable} dropped (cutoff before menu open)</>}
      </p>

      <CalendarStrip tz={tz} menu={menu} windows={list} />

      {sorted.length === 0 && <p className="muted">No windows with these settings.</p>}

      {sorted.map(([k, g]) => {
        const isOpen = expanded.has(k)
        const rows = isOpen ? g.rows : g.rows.slice(0, ROWS_PER_GROUP)
        return (
          <div key={k} className="group">
            <h3 className="group-title">
              {g.type === 'delivery' ? <TruckIcon /> : <BagIcon />}
              {g.name}
              <span className="muted"> · {plural(g.rows.length, 'window')}</span>
            </h3>
            <ul className="rows">
              {rows.map((w) => (
                <WindowRow key={w.id} w={w} tz={tz} />
              ))}
            </ul>
            {g.rows.length > ROWS_PER_GROUP && (
              <button
                type="button"
                className="link-button small"
                onClick={() =>
                  setExpanded((s) => {
                    const n = new Set(s)
                    if (isOpen) n.delete(k)
                    else n.add(k)
                    return n
                  })
                }
              >
                {isOpen ? 'Show fewer' : `Show ${g.rows.length - ROWS_PER_GROUP} more`}
              </button>
            )}
          </div>
        )
      })}
    </section>
  )
})

function WindowRow({ w, tz }: { w: GeneratedWindow; tz: string }) {
  return (
    <li className={`row ${isHidden(w.status) ? 'row-hidden' : ''}`}>
      <span className="row-day">{fmtDay(w.from, tz)}</span>
      <span className="row-time">
        {fmtTime(w.from, tz)} – {fmtTime(w.to, tz)}
      </span>
      <span className="row-cutoff">
        Order by {fmtDayTime(w.cutoff, tz)}
        {w.clamped && <span className="muted"> (clamped from {fmtDayTime(w.rawCutoff, tz)})</span>}
      </span>
      <span className="row-cap">{w.maxOrders != null ? `Max ${w.maxOrders}` : ''}</span>
      <span className={`badge badge-${w.status}`}>{STATUS_LABEL[w.status]}</span>
    </li>
  )
}

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function CalendarStrip({ tz, menu, windows }: { tz: string; menu: MenuState; windows: GeneratedWindow[] }) {
  const openDate = localDate(menu.opensAt, tz)
  const closeDate = localDate(menu.closesAt, tz)
  const last = windows.reduce((m, w) => (w.date > m ? w.date : m), closeDate)
  const firstMonday = addDays(openDate, -weekdayIndex(openDate))
  const lastMonday = addDays(last, -weekdayIndex(last))

  const counts = new Map<string, { offered: number; hidden: number }>()
  for (const w of windows) {
    const c = counts.get(w.date) ?? { offered: 0, hidden: 0 }
    if (isHidden(w.status)) c.hidden++
    else c.offered++
    counts.set(w.date, c)
  }

  const weeks: string[] = []
  for (let m = firstMonday; m <= lastMonday; m = addDays(m, 7)) weeks.push(m)

  return (
    <div className="cal" aria-label="Calendar of windows">
      <div className="cal-week cal-legend" aria-hidden="true">
        <span className="cal-label" />
        {DOW.map((d, i) => (
          <span key={i} className="cal-day">
            {d}
          </span>
        ))}
      </div>
      <div className="cal-weeks">
        {weeks.map((m) => (
          <div key={m} className="cal-week">
            <span className="cal-label">{fmtDay(new Date(`${m}T12:00:00Z`), 'UTC').slice(4)}</span>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const d = addDays(m, i)
              const c = counts.get(d)
              const cls = [
                'cal-day',
                d === openDate ? 'cal-open' : '',
                d === closeDate ? 'cal-close' : '',
              ].join(' ')
              const title = `${fmtDay(new Date(`${d}T12:00:00Z`), 'UTC')}${
                c ? `: ${c.offered} offered${c.hidden ? `, ${c.hidden} hidden` : ''}` : ''
              }${d === openDate ? ' · menu opens' : ''}${d === closeDate ? ' · menu closes' : ''}`
              return (
                <span key={d} className={cls} title={title}>
                  {c?.offered ? <i className="dot" /> : c?.hidden ? <i className="dot dot-hidden" /> : null}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <div className="cal-key muted small">
        <span><i className="dot" /> offered</span>
        <span><i className="dot dot-hidden" /> hidden only</span>
        <span><i className="key-box cal-open" /> opens</span>
        <span><i className="key-box cal-close" /> closes</span>
      </div>
    </div>
  )
}
