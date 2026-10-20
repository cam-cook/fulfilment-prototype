# Scenarios

These are active Cooks, each averaging more than 10 paid orders a week between 27 Jul and 18 Oct 2026.
Each Cook has a reference menu: the most recent menu that opened before 20 Oct 2026. Their schedules are
derived from their real windows (see `data/queries.sql`).

| Fixture | Cook | Orders/wk | Why it's in the set |
|---|---|---|---|
| fed-by-jed | Fed by Jed (678), Melbourne | 223 | Menus stay open about 4 weeks but deliver once. Tests rule A2. |
| local-kitchen-co | Local Kitchen Co (383), Adelaide | 255 | Windows vary per menu in 10 of 12 zones, private pickups, about 2 menus a week |
| harris-family-trust | Harris Family Trust (762), Melbourne | 190 | 286 private pickups |
| katering | Katering Pty Ltd (596), Sydney | 173 | Happy-path control with light variation |
| gluten-free-chef | The Gluten Free Chef (9), Melbourne | 114 | 133 zones, cutoffs vary per menu |
| samphire | S Hitchings / Samphire (372), Perth | 109 | One menu for a year, daily capped windows |
| blakeaway | Blakeaway (12), Melbourne | 54 | Times and cutoffs vary in all 55 zones |
| crooked-kitchen | Crooked Kitchen (248), Melbourne | 22 | 10-minute capped slots, about 7 a day |
| judy-purvis | Judy Purvis (498), Sydney | 13 | 44 window patterns in one zone |

## Golden scenario: Fed by Jed
**Reference menu.** Menu 26152, "Green Menu delivered November 16-17". It opens Wed 14 Oct 2026 at 08:00
and closes Mon 9 Nov 2026 at 23:55.

**Legacy windows.** There is one window per zone:
- **Monday zones.** Mon 16 Nov, with a cutoff of Mon 9 Nov at 23:55 (7 days before).
- **Tuesday zones.** Tue 17 Nov, with a cutoff of Mon 9 Nov at 23:55 (8 days before).

The derived schedules are in the fixture.

### Expected FJ-1: start after ordering closes, A2 = hide
- Each Monday zone offers exactly one window, on Mon 16 Nov.
- Each Tuesday zone offers exactly one window, on Tue 17 Nov.
- Comparison: Matched 6, Extra 0, Missing 0.
- Chip: "First delivery • Mon 16 Nov".

### Expected FJ-2: start when the menu opens (default), A2 = hide
- **Monday zones.** Each offers 4 windows: Mon 26 Oct, Mon 2 Nov, Mon 9 Nov and Mon 16 Nov. Mon 19 Oct is
  dropped because its cutoff (Mon 12 Oct) falls before the menu opens.
- **Tuesday zones.** Each offers 4 windows: Tue 27 Oct, Tue 3 Nov, Tue 10 Nov and Tue 17 Nov.
- Comparison: Matched 6, Extra 18, Missing 0.
- Flag: "4× legacy windows".

### Expected FJ-3: start after ordering closes, A2 = clamp
- Every occurrence after menu close is offered, up to the horizon (8 weeks by default). Each has an
  effective cutoff of Mon 9 Nov at 23:55.
- Each zone offers 8 or more windows, and Extra is greater than 0.
- Flag: "Windows offered after the intended delivery week".
- This scenario proves that the clamp rule breaks this Cook.

**Takeaway to confirm with engineering.** Fed by Jed's current setup only works on the new card if both
of these are true:
- The backend hides windows whose cutoff falls after menu close (A2 = hide).
- The Cook ticks "Start fulfilment later" and chooses "After ordering closes".

## Context for every Cook
Across active Cooks, 70% of menus currently start fulfilment after ordering closes, so most menus will
need "Start fulfilment later" ticked. Set each fixture's `suggestedStart` from its legacy data.

## Open questions (for the Rules panel and design review)
1. A2: hide or clamp? See FJ-3.
2. A3: what does the date range on the unticked chip represent?
3. Private pickups: there's no private option on the card or in the schedule model.
4. The fifth Figma state shows a date picker without radio buttons. Under what condition does it appear?
5. On the Timing card, the close-time field placeholder reads "dd / mm / yyyy". This is probably a Figma
   placeholder error.
