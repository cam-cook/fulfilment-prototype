import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronDownIcon, PlusIcon, XIcon } from './icons'

interface Option {
  id: number
  name: string
}

interface Props {
  id: string
  label: string
  placeholder: string
  noteLabel: string
  options: Option[]
  selected: number[]
  onChange: (ids: number[]) => void
}

export function MultiSelect({ id, label, placeholder, noteLabel, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const selectedSet = new Set(selected)
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options])
  const filtered = options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
  const chips = selected.map((s) => byId.get(s)).filter((o): o is Option => !!o)

  const toggle = (oid: number) =>
    onChange(selectedSet.has(oid) ? selected.filter((s) => s !== oid) : [...selected, oid])

  return (
    <div className="ms" ref={root}>
      <label className="field-label" htmlFor={`${id}-button`}>
        {label}
      </label>
      <div className="ms-row">
        <div className="ms-control">
          <button
            id={`${id}-button`}
            type="button"
            className="select ms-button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={selected.length ? '' : 'placeholder'}>
              {selected.length ? `${selected.length} of ${options.length} selected` : placeholder}
            </span>
            <ChevronDownIcon />
          </button>
          {open && (
            <div className="ms-pop">
              {options.length > 8 && (
                <input
                  className="input ms-search"
                  placeholder="Search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              )}
              <div className="ms-actions">
                <button type="button" className="link-button" onClick={() => onChange(options.map((o) => o.id))}>
                  Select all
                </button>
                <button type="button" className="link-button" onClick={() => onChange([])}>
                  Clear
                </button>
              </div>
              <ul className="ms-list" role="listbox" aria-multiselectable="true">
                {filtered.length === 0 && <li className="muted small ms-empty">No matches</li>}
                {filtered.map((o) => (
                  <li key={o.id} role="option" aria-selected={selectedSet.has(o.id)}>
                    <label>
                      <input type="checkbox" checked={selectedSet.has(o.id)} onChange={() => toggle(o.id)} />
                      {o.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button type="button" className="ghost-button" title="Not part of this prototype">
          <PlusIcon /> {noteLabel}
        </button>
      </div>
      {chips.length > 0 && <ChipList items={chips} onRemove={toggle} />}
    </div>
  )
}

/** Chips that collapse to "+N more" after two rows. */
function ChipList({ items, onRemove }: { items: Option[]; onRemove: (id: number) => void }) {
  const measure = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(items.length)
  const [expanded, setExpanded] = useState(false)

  useLayoutEffect(() => {
    const el = measure.current
    if (!el) return
    const calc = () => {
      const kids = Array.from(el.children) as HTMLElement[]
      const tops = [...new Set(kids.map((k) => k.offsetTop))].sort((a, b) => a - b)
      if (tops.length <= 2) return setFit(items.length)
      // Leave room on row 2 for the "+N more" chip.
      setFit(Math.max(1, kids.filter((k) => k.offsetTop <= tops[1]).length - 1))
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [items])

  const shown = expanded ? items : items.slice(0, fit)
  const hidden = items.length - shown.length

  const chip = (o: Option, interactive: boolean) => (
    <span key={o.id} className="chip">
      {o.name}
      {interactive ? (
        <button type="button" aria-label={`Remove ${o.name}`} onClick={() => onRemove(o.id)}>
          <XIcon />
        </button>
      ) : (
        <span className="chip-x">
          <XIcon />
        </span>
      )}
    </span>
  )

  return (
    <div className="chips-wrap">
      <div className="chips chips-measure" ref={measure} aria-hidden="true">
        {items.map((o) => chip(o, false))}
      </div>
      <div className="chips">
        {shown.map((o) => chip(o, true))}
        {hidden > 0 && (
          <button type="button" className="chip chip-more" onClick={() => setExpanded(true)}>
            +{hidden} more
          </button>
        )}
        {expanded && items.length > fit && (
          <button type="button" className="chip chip-more" onClick={() => setExpanded(false)}>
            Show less
          </button>
        )}
      </div>
    </div>
  )
}
