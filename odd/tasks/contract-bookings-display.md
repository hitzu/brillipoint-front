# Contract bookings display

## Objective
Show the contract's `bookings` (instead of legacy `contractSlots`) wherever contract slot dates are displayed.

## Problem / Why
The contracts-v4 API returns `slot: null`, `contractSlots: []` and a new `bookings[]` array
(`{ id, status, purpose, eventDate, serviceStartsAt, serviceEndsAt, title, venueName }`) on
`GET /contracts/get-by-token/{token}`, `GET /contracts/{id}` and the list endpoints.
The public reservation page still reads `contractSlots[0].slot.eventDate`, so it silently falls back
to `contract.createdAt` as the event date and shows no event dates.

## Scope
In scope (only consumer of contract slot display: public `/reserva/[token]`):
- `src/interfaces/contracts.ts` — response types
- `src/features/booking/pages/ReservationPublicPage.tsx`
- `src/features/booking/components/ReservationDatesSection.tsx`
- `src/features/booking/components/SocialMediaPlugin.tsx`
- `src/features/booking/components/SocialMediaFooter.tsx`

Out of scope: agenda/calendar slot availability (`Common/slots/slots-chips.tsx`, `views/Sales/Calendar.tsx`,
`slotsService`), expo-bebe block picker, dead duplicates in `src/views/Booking/*` (only used by `template-examples`).

## Constraints / decisions
- Display **date only**, same as today (no service time range, no venue). Decided by user 2026-09-23.
- Keep the synthetic "Fecha de contratación" row (from `contract.createdAt`).
- Booking `purpose` reuses `translateContractSlotPurpose` (`event` → "Evento Principal").
- Event date for the page: `bookings[0].eventDate`, fallback `contract.createdAt`.

## TDD
- Mode: enabled (source: user global config "Strict TDD Mode: enabled").
- Runner: `npx vitest run <path>` (`npm test` = `vitest run`).

## Tasks
- [x] T1 — Types: add `ContractBooking` interface and `bookings: ContractBooking[]` to `GetContractByIdResponse` and `ContractCompleteResponse`. `contractSlots` kept required until T4 (API still sends `[]`; making it optional breaks ReservationPublicPage before T3). Route: inline. Check: `npx tsc --noEmit` clean.
- [x] T2 — View model `src/features/booking/utils/reservationDates.ts`: `toReservationDates(createdAt, bookings)` → `{ key, purpose, date }[]` (creation-date row first, bookings sorted by `eventDate`, null purpose → `other`) and `getEventDate(bookings)` (earliest `event` booking, else earliest booking, else null). `ContractBooking.purpose` made `string | null` (DB column nullable). Route: inline. Checks: RED observed (module missing), GREEN 7/7, tsc clean. Full vitest: 207/208 — 1 pre-existing unrelated failure `partnersRepository.test.ts > resolves enabled occasions with organizer placeholders replaced` (copy text mismatch; branch diff doesn't touch partners). Commit b5627c2.
- [x] T3 — Wire page + components: `ReservationPublicPage` derives event date from bookings and passes view-model rows; `ReservationDatesSection`, `SocialMediaPlugin`, `SocialMediaFooter` consume rows instead of `ContractSlot`. Route: delegated writer (4 non-trivial files). RED observed (2 tests failed: `ReservationDatesSection` slots.map TypeError, `SocialMediaFooter` missing eventDate support), GREEN 63/63 in `src/features/booking`. Full vitest 210/211 (same pre-existing partners failure). `npx tsc --noEmit -p .` clean. Deviation: dropped the dead YMD-vs-ISO `Date` reconstruction in the page effect (only ever consumed by the removed commented-out halfway_date block) — `eventDate` state now carries the raw string straight through, since `parseLocalDate` inside the consuming components already discriminates YMD vs ISO without a lossy UTC round-trip.
- [x] T4 — Cleanup: `contractSlots` optional + `@deprecated`; `ContractSlot` kept `@deprecated` (still used by dead `src/views/Booking/*` imported by `template-examples`). Deleted unused `SocialMediaFooter` (features + test + views copy) per user — replaced by `SocialMediaCTA` (party) and `SocialMediaPlugin` (reservation + party). `template-examples/pages/reserva/[token].tsx:54` → `contractSlots?.[0]`. Route: inline (mechanical). Checks: tsc clean; vitest 208/209 (known partners failure).

## Acceptance criteria
- Reservation page shows "Fecha de contratación" + each booking's purpose and long Spanish date.
- Hero/event-date math uses the booking's `eventDate`.
- Social share/footer text uses the first event booking's date.
- `npx tsc --noEmit` and `npm test` pass.

## Known environmental failures
- `src/features/partners/repository/__tests__/partnersRepository.test.ts` > resolves enabled occasions with organizer placeholders replaced (pre-existing).

## Delivery
- Forecast < 400 authored lines → single PR, work-unit commit per task on `feat/rt/change-slot-by-booking`.

## Progress
- Plan created 2026-09-23.
- T1 done 2026-09-23 (type-only, no runtime behavior → no RED test; verified with tsc). Commit: 9ad397b.
- T2 done 2026-09-23 (b5627c2). RDD assess: medium, under_budget.
- T3 done 2026-09-23. RDD assess: not run by writer (parent's responsibility).
- T4 done 2026-09-23.
- Next: open PR (user decision). Follow-ups: Spanish labels for `scouting`/`meeting`; delete dead `src/views/Booking/*` + `template-examples` reserva to drop `ContractSlot`.
