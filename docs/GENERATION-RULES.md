# Generation rules

All times are local to `cook.timezone`. Store instants internally as UTC, and convert for display and for
day-of-week logic. Handle daylight saving correctly: a 23:55 cutoff stays at 23:55 local time across the change.

## Inputs
- **Schedule.** The fields are:
  - `type`: delivery or pickup
  - `zoneId` or `pickupLocationId`
  - `days`, for example `["monday"]`
  - `timeWindows`, for example `[{start:"05:00", end:"15:30"}]`
  - `deadline`
  - `maxOrders`, which is null when there's no cap
- **Deadline strategies.** These mirror `fulfilment_schedules`:
  - `days_before_at_time` `{daysBefore, time}`: the cutoff is the delivery date minus `daysBefore` days,
    at `time`.
  - `weekday_weeks_before_at_time` `{weekday, weeksBefore, time}`: the cutoff falls on that weekday,
    `weeksBefore` weeks before the delivery week, at `time`. Weeks start on Monday.
- **Menu state.** `opensAt`, `closesAt`, `zoneIds[]`, `pickupLocationIds[]`, and `start`. The `start`
  value is one of `menu_opens`, `after_close`, or `specific_date` with a date.

## Steps
1. **Occurrences.** For each schedule whose zone or location is selected, create one occurrence for each
   matching weekday and time window, from the first fulfilment date up to the horizon.
   - **ASSUMPTION A1 (horizon).** By default, the horizon is 8 weeks after menu close or 8 weeks after
     the first fulfilment date, whichever is later. Toggle values: 4, 8 or 26 weeks.
2. **First fulfilment date.**
   - `menu_opens` means `opensAt`.
   - `after_close` means `closesAt`.
   - `specific_date` means 00:00 local time on that date.
   - Drop any occurrence that starts before this date. These show as `Hidden: before first fulfilment`.
3. **Cutoff.** Apply the deadline strategy to each occurrence.
4. **Ordering window.** A window is orderable between `opensAt` and its effective cutoff.
   - Drop any occurrence whose cutoff is at or before `opensAt`, because it can never be ordered.
   - **ASSUMPTION A2 (cutoff after menu close).** This is the key rule to test:
     - `hide` (default): a window whose cutoff is after `closesAt` isn't offered. It shows as
       `Hidden: cutoff after menu close`.
     - `clamp`: the window is offered, and its effective cutoff becomes `closesAt`.
5. **Capacity.** `maxOrders` applies per occurrence, not per schedule. It's display only, as there are no orders.
6. **Status.** Work this out relative to the simulated now:
   - `Not yet open` if now is before `opensAt`
   - `Cutoff passed` if now is at or after the effective cutoff
   - `Orderable` otherwise

## First fulfilment chip
- **Ticked.** Show the earliest offered occurrence, for example "First delivery • Mon 16 Nov". Use
  "First pickup" if a pickup is the earliest.
- **Unticked.** Show the range from the earliest to the latest offered occurrence in the first fulfilment
  week.
  - **ASSUMPTION A3.** The Figma example "Delivery from Mon 26 Oct to Nov 3 2026" is ambiguous. Default to
    the first 7 days of offered windows, with toggle values "first week" and "all offered".

## Comparison with legacy
- **Match.** Same zone or location, with the same local start and end on the same date.
- **Cutoff difference.** The effective cutoff minus the legacy cutoff, in hours. Flag it if the
  difference is 1 hour or more.
