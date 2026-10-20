# Fulfilment simulator: brief for Claude Code

A throwaway design prototype for Cookaborough. It replays real Cooks' setups through the new menu
**Timing** and **Fulfilment** cards, so the design team can see which delivery and pickup windows the new
model would generate, and where it differs from what each Cook runs today.

This is not production code. Optimise for clarity, fast iteration and correct date maths.

## Read these before writing code
1. `docs/SPEC.md`: what to build, the layout and the interactions.
2. `docs/GENERATION-RULES.md`: how windows are generated. **Treat this as the source of truth.**
3. `docs/SCENARIOS.md`: the Cooks, why each is in the set, and the expected results.
4. `data/fixtures/*.json`: one file per Cook. `fed-by-jed.json` is the hand-checked golden fixture.

## Stack
- Vite, React and TypeScript, with no backend. Fixtures are loaded as static JSON.
- `date-fns` and `date-fns-tz` for all date maths. Every calculation happens in the Cook's own IANA
  timezone (fixture `cook.timezone`), never the browser's.
- Vitest for the generation engine. Keep the engine as pure functions in `src/engine/`, separate from the UI.

## Working rules
- Build the engine and its tests first (milestone 1 in SPEC.md), then the UI.
- Every scenario in SCENARIOS.md with an "Expected" block becomes a Vitest test. Do not change an
  expected value to make a test pass. Stop and flag it instead.
- Anything marked **ASSUMPTION** in GENERATION-RULES.md must be a visible toggle in the Rules panel, not a
  hard-coded choice.
- Switching Cook resets all state to that Cook's fixture.

## Design source
The Figma file is `RL8w8hvLyjY1EVBH0Yrybd` ("Menus details"):
- Timing card: node `3119:64320`
- Fulfilment card, all states: node `3832:15596`

If the Figma MCP is connected, use `get_design_context` and `get_screenshot` on those nodes and match
spacing, type and states. Use the Cookbook Pro design system tokens where available. Otherwise use plain
CSS that matches the screenshots, with neutral greys, a white card with a 1px border and 8px radius, and
the blue info chip.

## Interface copy rules
These cover Cookaborough house style. The Figma copy wins if it conflicts.
- Australian English (organise, colour, fulfilment). Dates read Day Month, for example "Mon 16 Nov".
- Sentence case, no exclamation marks, verb-led buttons, numerals rather than words.
- Never "you" or "your" in interface text, and never refer to the business as "the Cook" in its own interface.
