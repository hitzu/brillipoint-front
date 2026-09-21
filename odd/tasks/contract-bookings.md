# Contract bookings — link bookings to contracts

## Objective

A contract holds several dated commitments: the event, plus the scoutings,
meetings and trials around it. Staff must be able to create any of them from
the agenda or from a contract row, and expo must attach a booking to the
contract it just sold.

## The API this targets

Reworked in `7b0b56a feat: booking functionality`. One route creates every
booking:

```
POST /bookings   { scheduleType, eventDate, serviceStartsAt, serviceEndsAt,
                   title?, purpose?, venueName?, mapsUrl?, contractId? }
```

- `contractId` is an optional body field. With it the booking belongs to a
  contract; without it the booking stands alone.
- `BOOKING_TYPE` (internal / commercial) was deleted. A booking is a booking.
- `POST /contracts` no longer creates any booking, and `slotId` is optional.
- `404` when `contractId` names a contract that does not exist.

Routes that no longer exist and must never be called again:
`POST /bookings/internal`, `POST /contracts/:id/bookings`,
`POST /bookings/:id/confirm`.

## Agreed order

1. **Repair what the API rework broke.** — DONE
2. **Contracts list: an "Agendar" row action.** — DONE
3. **Expo: contract first, then its booking.** — DONE (partially; see below)

### 1. Repair — done

- `createBooking(payload)` replaces `createInternalBooking` and
  `createContractBooking`. One route, contract as a payload field.
- `ExactBookingPayload` gained `contractId?: number`.
- `useAgendaPage.saveBooking` no longer branches between endpoints; it
  reschedules when editing and creates otherwise, merging `contractId` onto the
  payload when one was picked.
- `confirmBooking` and the whole hold branch are gone. `BOOKING_STATUS` only
  ever had `confirmed`, and `/bookings/:id/confirm` never existed in the
  controller — the front had been calling a 404 since the beginning.
- `ContractPicker` restored: contract search in the creation modal, empty by
  default, matching on SKU or client name, clearable back to no contract.
- `BOOKING_BLOCKS` restored as the single definition of the three sellable
  blocks. The all-day preset stays a separate agenda convenience, not a block.

### 2. Contracts list — done

`ScheduleBookingModal` in `features/contracts` wraps the agenda's `BookingForm`
with the contract fixed, owns the create-then-note sequence, and closes on
success. The list page gained an "Agendar" row action ahead of payments, since
it is the one staff reach for most.

A failed note never rejects the save: the booking already exists at that point,
and surfacing it as a failure invites the seller to create a duplicate.

### 3. Expo — contract first, then booking

Done: after `generateContract` succeeds, `useContractForm` creates the sold
block's booking against the new contract. `bookingPayloadForBlock` derives the
instants from the single block definition, so the hours the agenda shows are the
hours the block was sold as — nobody types them.

The call sits outside the payment/note batch and outside the outer catch. The
contract and its deposit already exist by then, so a booking failure sets
`bookingWarning` instead of the contract error: reporting it as a failed sale
would push the seller to sell the same thing twice. The warning surfaces on the
success screen, because a contract with no booking is invisible in the agenda
and coordination has to know.

Expo's two slot labels now read their name and range from the shared block
definition, so "Tarde" shows 12:00–20:00 — the range actually written — instead
of the old "después de las 4:00 PM", which no longer matched.

**Still open — the slot machinery.** Expo continues to call `POST /slots/hold`
and to read availability from `/slots`. Removing it means rebuilding
`availabilityByPeriod` (`useContractForm.ts:255`), `monthHasReservedDate`, and
the Lusso brand-blocking rules on top of the bookings agenda. That is a
separate work unit, and only after it can expo offer the third block —
`/slots/hold` accepts two periods.

## Availability: decided

Map blocks on the client. `dayAvailability()` in
`features/booking-agenda/utils/agendaAvailability.ts` already merges a day's
bookings into occupied intervals, and expo already fetches that data through
`publicBookingCalendar.ts`. A per-day availability endpoint would fork the block
definition across front and API — two sources of truth for what "Tarde" means.

A block is offered or it is not; no partial-occupancy bar. Selling a block
promises its full range, so any overlap makes it undeliverable. A progress bar
would hand the calculation back to the seller mid-sale, which is the exact thing
blocks exist to prevent.

If finer capacity is ever needed, the purpose-free criterion is a booking's
duration against the block — never its `purpose`.

## Checks

- `npx vitest run` — 117 passing. One pre-existing failure in
  `features/partners/repository/__tests__/partnersRepository.test.ts`
  (`heroLead` copy), unrelated and present on a clean tree.
- `npx tsc --noEmit` — clean.
- No ESLint config in this project; `next lint` drops into its setup wizard.
