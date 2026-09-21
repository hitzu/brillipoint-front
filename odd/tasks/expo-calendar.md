# Expo calendar — retire the slot layer

Parked backlog. Nothing here is started; it is the list of what the expo
calendar still owes once it becomes the active work unit.

## Why this exists

Expo already **reads** occupancy from the bookings agenda
(`features/expo-bebe/services/publicBookingCalendar.ts` consumes
`ScheduleAgendaDayDto`) but still **reserves** through `POST /slots/hold`. It
displays one model and writes another. Bookings are the evolution of slots, so
the slot layer goes; the direction is settled, only the work is pending.

Since `997897f`–`626c630`, a contract sold in expo does get its booking. The
slot hold is now redundant reservation, not the source of truth.

## What has to be rebuilt before `/slots/hold` can go

Each of these reads `/slots` today and has no replacement yet.

| What | Where | Replacement |
|---|---|---|
| `availabilityByPeriod` | `ContractView/hooks/useContractForm.ts:255` | derive from `dayAvailability()` over agenda entries |
| `monthHasReservedDate` | same hook, `getSlotsByMonthAndYear` | month-level risk from agenda entries |
| Lusso brand blocking | `utils/brandBlocking.ts`, `bookedBrandIds` | needs brand on the agenda entry, or a separate read |

The brand rules are the hard part: the agenda's public entries deliberately
strip identity (`publicBookingCalendar.ts` nulls `contractId`, `sku`,
`clientName`), so brand-aware blocking cannot be computed from the public
feed as it stands.

## Block availability — rule already decided

A block is offered or it is not. No partial-occupancy bar.

Selling a block promises its whole range, so any overlapping booking makes it
undeliverable — the Sept 12 case, an 18:00–20:00 event against the 12:00–20:00
Tarde block, is unavailable, not 75% free. A bar would hand the arithmetic back
to the seller mid-sale, which is the thing blocks exist to prevent.

Compute it on the client from `dayAvailability()` in
`features/booking-agenda/utils/agendaAvailability.ts`, which already merges a
day's bookings into occupied intervals. Do not add a per-day availability
endpoint: it would fork the block definition across front and API, leaving two
answers to "what is Tarde".

If finer capacity is ever wanted, the purpose-free criterion is a booking's
duration against the block — never its `purpose`.

## The third block

Expo shows two. `/slots/hold` accepts exactly two periods
(`SLOT_PERIOD` = `am_block`, `pm_block`), so the third cannot ship while the
hold is in the flow. Once it is gone:

- widen `ContractPeriod` (`features/expo-bebe/utils/calendar.ts:25`) to
  `BookingBlockId`
- render the three from `BOOKING_BLOCKS` in `DateSlotSection.tsx`
- `slotToPeriod` (`utils/calendar.ts:33`) maps `morning`/`afternoon` only and
  needs a third case or removal

The agenda side is already done: `BOOKING_BLOCKS` holds all three and
`bookingPayloadForBlock` derives any of them.

## Loose ends found along the way

Small, unrelated to each other, none blocking.

- **`partners` test is red on a clean tree.**
  `features/partners/repository/__tests__/partnersRepository.test.ts` expects
  `heroLead` to contain "coordinada por Partner Demo"; the copy no longer says
  it. Verified pre-existing by stashing everything. Either the copy or the
  assertion is stale.
- **No ESLint config.** `next lint` drops into its setup wizard, so nothing
  lints. Worth deciding whether that is intentional.
- **`AgendaBlock` is vestigial.** `booking-agenda/types.ts` carries
  `am_block | pm_block | night_block` for agenda entries, but the API states it
  has no blocks in that slice (`bookings-agenda.service.ts:49`) and never emits
  them. The field is always empty.
- **`src/pages/contracts/index.tsx` holds 276 lines of logic** in a route
  entrypoint, against the thin-pages rule in CLAUDE.md. The new Agendar action
  was put in `features/contracts` rather than adding to it, but the rest is
  still there.
- **API branch `feat/contract-bookings`** still carries the five superseded
  commits from the first endpoint design (`POST /contracts/:id/bookings`).
  Decide whether to drop it.
