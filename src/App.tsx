import { useRef, useState } from 'react'
import { chipText, compareWithLegacy, computeFlags, generateWindows, type MenuState } from './engine'
import { FIXTURES } from './fixtures'
import { draftFromFixture, menuFromDraft, nowFromDraft, startFromDraft, type Draft } from './state'
import { LeftColumn } from './ui/LeftColumn'
import { TimingCard } from './ui/TimingCard'
import { FulfilmentCard } from './ui/FulfilmentCard'
import { PreviewPanel } from './ui/PreviewPanel'
import { ComparisonPanel } from './ui/ComparisonPanel'
import { FlagsPanel } from './ui/FlagsPanel'

export function App() {
  const [slug, setSlug] = useState(FIXTURES[0].slug)
  const fixture = FIXTURES.find((f) => f.slug === slug)!.fixture
  const tz = fixture.cook.timezone
  const [draft, setDraft] = useState<Draft>(() => draftFromFixture(fixture))
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  const reset = (nextSlug = slug) => {
    const f = FIXTURES.find((x) => x.slug === nextSlug)!.fixture
    setSlug(nextSlug)
    setDraft(draftFromFixture(f))
    lastValid.current = null
  }

  // Keep the last valid preview while the Timing card has an error.
  const parsed = menuFromDraft(draft, tz)
  const lastValid = useRef<MenuState | null>(null)
  if (parsed.ok) lastValid.current = parsed.menu
  const menu: MenuState | null = parsed.ok
    ? parsed.menu
    : lastValid.current && { ...lastValid.current, zoneIds: draft.zoneIds, pickupLocationIds: draft.pickupLocationIds, start: startFromDraft(draft) }

  const now = nowFromDraft(draft, tz) ?? menu?.opensAt ?? new Date()

  const sim = (() => {
    if (!menu) return null
    const result = generateWindows(fixture, menu, draft.rules, now)
    const comparison = compareWithLegacy(fixture, result.offered)
    const flags = computeFlags(fixture, menu, result, comparison)
    return { result, comparison, flags }
  })()

  const chip = chipText(
    sim?.result.offered ?? [],
    startFromDraft(draft),
    parsed.ok || parsed.reason !== 'no_open' ? (menu?.opensAt ?? null) : null,
    draft.rules,
    tz,
  )

  const previewRef = useRef<HTMLElement>(null)
  const focusPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    previewRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fulfilment simulator</h1>
        <span className="muted">Prototype · {fixture.referenceMenu.name} (menu {fixture.referenceMenu.id})</span>
      </header>
      <div className="columns">
        <aside className="col col-left">
          <LeftColumn
            fixtures={FIXTURES}
            slug={slug}
            fixture={fixture}
            draft={draft}
            onSwitch={reset}
            onReset={() => reset()}
            update={update}
            menuOpensAt={menu?.opensAt ?? null}
          />
        </aside>
        <main className="col col-centre">
          <TimingCard draft={draft} update={update} error={parsed.ok ? null : parsed.reason} />
          <FulfilmentCard fixture={fixture} draft={draft} update={update} chip={chip} hasOpen={parsed.ok || parsed.reason !== 'no_open'} onPreview={focusPreview} />
        </main>
        <section className="col col-right">
          <PreviewPanel
            ref={previewRef}
            tz={tz}
            sim={sim?.result ?? null}
            menu={menu}
            stale={!parsed.ok}
            showHidden={draft.showHidden}
            onToggleHidden={(v) => update({ showHidden: v })}
          />
          {sim && <ComparisonPanel tz={tz} fixture={fixture} comparison={sim.comparison} />}
          {sim && <FlagsPanel flags={sim.flags} />}
        </section>
      </div>
    </div>
  )
}
