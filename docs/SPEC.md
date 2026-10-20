# Spec: fulfilment simulator

## Goal
Pick a problematic Cook, assume their schedules already exist, then change the menu's Timing and
Fulfilment settings and immediately see:
1. which windows customers would be offered, with their cutoffs
2. how that compares with the windows the Cook actually ran on the same menu (legacy)
3. warnings where the new model can't reproduce the Cook's real setup

## Layout
Use three columns on desktop, stacking on narrow screens.

| Left (about 280px) | Centre (about 560px) | Right (flexible) |
|---|---|---|
| Cook switcher | Timing card | Preview |
| Cook summary | Fulfilment card | Comparison with legacy |
| Rules panel | | Flags |

### Left column
- **Cook switcher.** A select listing the fixtures. Changing it resets everything (see "Reset" below).
- **Cook summary.** Name, timezone, average orders per week, risk tags, and the "why this Cook" text
  from the fixture.
- **Rules panel.** One toggle per ASSUMPTION in GENERATION-RULES.md, each with a short label and its
  current value. Changing a rule regenerates the windows instantly.
- **Simulated now.** A date-time control, defaulting to the menu open time. It decides which windows are
  currently orderable.
- **Reset to fixture.** A button that restores the selected Cook's original state.

### Centre column: Timing card (Figma 3119:64320)
- Title "Timing", with the helper text and link exactly as they appear in Figma.
- Menu open, with a date field and a time field. Menu close, with a date field and a time field.
- Pre-fill both from `referenceMenu.opensAt` and `closesAt`, displayed in the Cook's timezone.
- Validation: close must be after open. Show an inline error, and keep the last valid preview.

### Centre column: Fulfilment card (Figma 3832:15596)
Reproduce all five Figma states.
- **Delivery zones.** A multi-select over `zones[]` that renders chips, with `referenceMenu.zoneIds`
  pre-selected. The chip list must cope with 100 or more zones (The Gluten Free Chef has 133). Collapse
  it to "+N more" after two rows, and add "Select all" and "Clear" to the dropdown.
- **Pickup locations.** Works the same way, over `pickupLocations[]`.
- **"Add delivery note" and "Add pickup note".** Non-functional stubs.
- **First fulfilment.** Shows "Based on Delivery and Pickup schedules." Mention only the types that are
  selected; the fifth Figma state shows the delivery-only version.
- **Info chip.** It mirrors the Figma states:
  - No open date: "Set an open date for this menu to see the first delivery".
  - "Start fulfilment later" unticked: the first fulfilment range, for example
    "Delivery from Mon 26 Oct to Nov 3 2026". The exact meaning is an open question; see SCENARIOS.md.
  - "Start fulfilment later" ticked: "First delivery • Mon 16 Nov".
- **"Start fulfilment later" checkbox.**
  - Unticked: fulfilment starts when the menu opens.
  - Ticked: radio buttons for "After ordering closes" and "From a specific date". The specific-date
    option reveals a date picker.
- **"Preview windows" button.** Scrolls to and focuses the Preview panel.

### Right column: Preview
- Group windows by zone or pickup location, then list them in date order.
- Each row shows the day and date, the time range, the cutoff ("Order by Mon 9 Nov, 11:55 pm"), the
  capacity if there is one, and a status badge.
- Status badges:
  - `Orderable`
  - `Cutoff passed`, relative to the simulated now
  - `Not yet open`
  - `Hidden: before first fulfilment`
  - `Hidden: cutoff after menu close`, shown only under the "hide" rule
- Add a "Show hidden windows" toggle, off by default, so the panel normally shows only what customers see.
- Add a small calendar strip above the list, spanning the weeks from menu open to the last window, with
  dots on the days that have windows.

### Right column: Comparison with legacy
- Match each generated window to `referenceMenu.legacyWindows` by zone or location, start time and end time.
- Show three counts, each with its own list:
  - Matched
  - Extra: generated but not in legacy
  - Missing: in legacy but not generated
- Flag any matched window whose cutoff differs, showing the difference in hours.

### Right column: Flags
Computed warnings, written in plain language:
- More windows than legacy, showing the multiple (for example "4× legacy windows").
- Legacy windows that can't be generated.
- Cutoffs that differ from legacy.
- Private pickup used in legacy, with no private option on the card.
- More than 50 zones selected.
- More than 30 windows per day in one zone (slot-style).

## Reset
A Cook switch, or "Reset to fixture", reloads the fixture and sets:
- Timing to the reference menu's open and close times.
- Zones and locations to the reference selections.
- "Start fulfilment later" to the fixture's `suggestedStart` value.
- The rules to their defaults.
- Simulated now to the menu open time.

## Milestones
1. **Engine and tests.** Covers `generateWindows(fixture, menuState, rules, now)` and
   `compareWithLegacy()`. Done when every expected scenario passes.
2. **Static UI.** All three columns, rendered from the Fed by Jed fixture.
3. **Interactivity.** Cook switcher, Timing and Fulfilment controls, the Rules panel, and Reset.
4. **Remaining fixtures.** Load the other Cooks (see `data/queries.sql`), then check the Flags against SCENARIOS.md.

## Out of scope
Real data writes, authentication, orders, payments, and routing exports.
