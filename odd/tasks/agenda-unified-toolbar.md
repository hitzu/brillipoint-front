# Agenda unified toolbar

## Objective
One navigation bar shared by the Resumen and Horarios week views, and a Resumen layout that matches Horarios' card style.

## Problem / why
- Horarios renders FullCalendar's default toolbar (title, Hoy, ‹ ›) in addition to the page toolbar. FullCalendar's arrows change its internal week without updating page state (no `datesSet`), so the page title and month filter go stale.
- Resumen repeats the raw ISO date (`2026-09-14`) under each "Lun 14" heading and has empty space above the headings.

## Target layout (user-chosen)
```
31 ago – 6 sep 2026                [Hoy] [‹ ›]   [Resumen | Horarios] ← Volver
```
Range title left; Hoy + arrows, view toggle, and Volver on the right in that order.

## Scope
- `src/features/booking-agenda/components/AgendaNavigation.tsx` (+ css, tests)
- `src/features/booking-agenda/components/AgendaHours.tsx` (`headerToolbar={false}`)
- `src/features/booking-agenda/components/AgendaSummary.tsx` + summary styles in `BookingCalendar.module.css`
- Page wiring for "Hoy" if needed (`pages/AgendaPage`, `useAgendaPage`)

## TDD
Mode: strict. Runner: `npx vitest run src/features/booking-agenda`.

## Tasks
- [x] T1 Toolbar: reorder to target layout, add "Hoy" (jumps to today's week, page-state driven). Route: delegated (writer trigger).
- [x] T2 Horarios: remove FullCalendar internal toolbar. Route: delegated with T1.
- [x] T3 Resumen: drop ISO date heading and top gap; align card/grid styling with Horarios. Route: delegated with T1.

## Progress / evidence
- Branch: `feat/booking-time-select`

### T1 — Toolbar
- `AgendaNavigation.tsx`: moved the range title (`<strong>`) to be the sole
  first child of `.agenda-week-navigation`; grouped Hoy, the ‹ › pair
  (`role="group" aria-label="Semana"`), the Resumen/Horarios toggle
  (`aria-label="Presentación"`), and Volver into one `.agenda-week-actions`
  wrapper (`margin-left: auto`), in that exact order. "Hoy" calls the same
  `onSelectDate` the arrows use, with `toYMD(new Date())` (existing civil
  Mexico City date utility) — no new prop was needed since it reuses page
  state exactly like the arrows.
- CSS (`AgendaNavigation.module.css`): replaced the old
  `.agenda-week-navigation > [role="group"]` / `> div:not([role="group"])`
  selectors (which assumed only 2 possible direct children) with
  `.agenda-week-actions > [aria-label="Semana"]` /
  `[aria-label="Presentación"]`, since both groups are now nested one level
  deeper. Mobile: `strong` still wraps to its own row
  (`flex: 1 1 100%` at `max-width: 767px`); `.agenda-week-actions` wraps via
  `flex-wrap: wrap`, so no horizontal overflow.
- The month/year filter row (`.agenda-date-filters`) uses different markup
  and was not touched — unaffected.

### T2 — Horarios
- `AgendaHours.tsx`: added `headerToolbar={false}` to the `FullCalendar`
  props, with a comment explaining why (page toolbar is now the only
  navigation).

### T3 — Resumen
- `AgendaSummary.tsx`: removed the `<h3>{date}</h3>` ISO-date line.
- `BookingCalendar.module.css`: gave `.agenda-summary` the same outer-card
  treatment as `.agenda-hours` (`padding: 1.5rem`, `background:
  var(--agenda-bg)`), and split the header row / grid into two bordered
  strips (`.agenda-summary-headings` with `background: var(--agenda-raised)`
  mirroring FullCalendar's `fc-col-header-cell`, `.agenda-summary-grid`
  bordered below it) so the card reads like Horarios' bordered
  header-row-over-grid layout. Column borders (`article` `border-right`)
  and the `.is-selected` highlight were kept unchanged. Removed the
  now-unused `.agenda-summary-grid h3` rule.
- Behavior for "empty space above the headings" could not be visually
  confirmed without a dev server (per instructions); the fix removes the
  only element (`h3`, plus its own margin) that could have been contributing
  padding/scroll above the row, and unifies the card's outer padding with
  Horarios'. Flagging as the one item worth a visual sanity check from the
  user.

## TDD evidence
Mode: strict, runner `npx vitest run src/features/booking-agenda`.
- RED: 4 new tests failed before implementation —
  `AgendaHours.test.ts > disables FullCalendar's own toolbar…`,
  `AgendaSummary.test.tsx > does not render the raw ISO date…`,
  `AgendaNavigation.test.tsx > orders the week toolbar as title, Hoy,
  arrows, toggle, then Volver last`, and `AgendaNavigation.test.tsx >
  'Hoy' moves the selected date to today's civil Mexico City date`
  (154 pre-existing tests passing, 4 failing, 158 total).
- GREEN: after implementation, `npx vitest run src/features/booking-agenda`
  → 28 test files, 158 tests, all passed.

## Verification
- `npx vitest run src/features/booking-agenda`: 28 passed / 28, 158 passed / 158.
- `npx tsc --noEmit -p .`: no errors.
