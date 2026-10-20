# Data

## Fixture shape
Use one JSON file per Cook in `fixtures/`. `fed-by-jed.json` is the hand-checked example, so copy its
shape exactly.

- `cook`: `id`, `name`, `timezone` (IANA), `ordersPerWeek`, `riskTags[]`, and `why`.
- `suggestedStart`: one of the following, inferred from legacy data:
  - `{type: "menu_opens"}`
  - `{type: "after_close"}`
  - `{type: "specific_date", date}`
- `zones[]` and `pickupLocations[]`: `{id, name}`. Pickup locations also take `private: boolean`.
- `schedules[]`: these are derived, so they represent the "assume their schedule has been added" state.
- `referenceMenu`: `opensAt`, `closesAt`, `zoneIds`, `pickupLocationIds`, and `legacyWindows[]`. Each
  legacy window has `type`, `zoneId` or `pickupLocationId`, `from`, `to`, `cutoff`, `maxOrders` and
  `private`.

All datetimes are ISO 8601 strings with the Cook's local offset.

## Building the other fixtures
Run `queries.sql` against Metabase database 2 (Cookaborough, MySQL) through the Metabase MCP. In each
query, replace `:cook_id` with the Cook's ID. Run them in order:

1. **Q1** confirms the Cook is still active (more than 10 orders a week).
2. **Q2** finds the reference menu.
3. **Q3** returns the legacy windows for that menu, converted to local time.
4. **Q4** derives the schedules. For each zone or pickup location, it takes the most common
   weekday, time window and cutoff pattern across the Cook's last 8 menus.

To build `suggestedStart`, compare the first legacy window with `closesAt`:
- If the first window starts at or after close, use `after_close`.
- Otherwise, use `menu_opens`.

**Size limits.** Crooked Kitchen and Samphire have hundreds of legacy windows on a single menu. For those
two, keep only the legacy windows that fall in the first 4 weeks after menu open, and add
`"legacyTruncated": true` to `referenceMenu`.

**Privacy.** Fixtures hold business-level setup only: no customer names, addresses or orders. Keep this
repo private, because fixtures contain real business names.
