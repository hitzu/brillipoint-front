# Booking time select

## Objective
Replace the free `<input type="time">` Start/End fields in the booking form with a Google-Calendar-style time select: 30-minute steps, free typing allowed, end options labeled with duration relative to start (e.g. `02:00 (7 h)`), and a visible notice when the end falls on the next day.

## Problem / why
Today `endsAt <= startsAt` silently means "ends next day" (`endsNextDay`). Users cannot see that, nor the resulting duration.

## Scope
- `src/features/booking-agenda/components/BookingForm.tsx` (Inicio/Fin fields)
- New time-select component + pure option/duration util under `src/features/booking-agenda/`
- Tests alongside.

Out of scope: multi-day bookings, end date field, all-day checkbox. Quick-range buttons ("Todo el día" and blocks) stay unchanged: they only fill start/end.

## Constraints
- Keep `aria-label` "Inicio"/"Fin" and string `HH:mm` values; `useBookingForm` contract unchanged.
- Values outside the 30-min grid (e.g. 23:59 from presets, 04:00 drafts) must display and be editable.
- UI copy in Spanish (existing convention), code in English.

## TDD
Mode: strict (enabled in session config). Runner: `npx vitest run src/features/booking-agenda`.

## Tasks
- [x] T1 Pure util: start options (every 30 min) and end options starting at start+30min through 24h with duration label (`(30 min)`, `(1 h)`, `(14,5 h)`), plus next-day flag. Route: delegated (writer trigger, 2+ non-trivial files).
- [x] T2 TimeSelect combobox component (typing + dropdown list), wired into BookingForm; next-day notice. Route: delegated with T1.

## Acceptance criteria
- End list shows duration relative to start; choosing an earlier-hour end is labeled next day and a notice is visible. ✅ covered by `timeOptions.test.ts` (`endTimeOptions`, `nextDayDurationMinutes`) and `BookingForm.test.tsx` ("shows the end options with duration labels...", "shows a next-day notice...").
- Presets still fill both fields; existing BookingForm tests pass (updated only where the input type assertion changes). ✅ the two `.type === "time"` assertions (~line 119-122) were replaced with `role === "combobox"` checks, since the field is no longer a native `<input type="time">`.

## Progress / evidence
- Branch: `feat/booking-time-select`
- New files: `src/features/booking-agenda/utils/timeOptions.ts` (+ test), `src/features/booking-agenda/components/TimeSelect.tsx` (+ test, + `.module.css`).
- Modified: `src/features/booking-agenda/components/BookingForm.tsx` (Inicio/Fin now `TimeSelect`, next-day notice added), `BookingForm.test.tsx` (type assertions updated, 4 new tests added).
- TDD: RED observed for both `timeOptions.test.ts` (module not found) and `TimeSelect.test.tsx` (module not found) before implementation; GREEN observed after implementation.
- Verification:
  - `npx vitest run src/features/booking-agenda`: **148 passed (27 files)**.
  - `npx tsc --noEmit -p .`: **no errors** (clean).
- `useBookingForm.ts` untouched — `endsNextDay` still derived the same way; the notice in `BookingForm.tsx` reads `form.state.endsNextDay` directly.
