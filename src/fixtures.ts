import type { Fixture } from './engine'

const modules = import.meta.glob('../data/fixtures/*.json', { eager: true, import: 'default' }) as Record<
  string,
  Fixture
>

export interface FixtureEntry {
  slug: string
  fixture: Fixture
}

// Golden fixture first, then by orders per week, as in SCENARIOS.md.
export const FIXTURES: FixtureEntry[] = Object.entries(modules)
  .map(([path, fixture]) => ({ slug: path.split('/').pop()!.replace(/\.json$/, ''), fixture }))
  .sort((a, b) =>
    a.slug === 'fed-by-jed' ? -1 : b.slug === 'fed-by-jed' ? 1 : b.fixture.cook.ordersPerWeek - a.fixture.cook.ordersPerWeek,
  )
