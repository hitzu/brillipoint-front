# Calendar navigation redesign (/agenda + /expo)

## Objective
Simplify the shared booking calendar: general-to-particular navigation in agenda, month chips instead of a select, less noise, and expo locked to the light theme.

## Problem / Why
- Expo inherits the admin dark theme via `:global([data-pc-theme="dark"])` rules in shared CSS modules.
- Month `select` + arrows is clunky; Google-Calendar-style month chips are faster.
- Month view block buttons (Mañana/Tarde/Noche) add noise; the weekends view is the primary booking view.
- Agenda summary shows noise ("Apartar libre…", "Mayor hueco", "Libre todo el día").
- Agenda offers four flat views; users want month/weekends first, then drill into a date's detail.

## Scope / Constraints
- `BookingCalendar` and `AgendaNavigation` are shared by agenda and expo; agenda-only behavior must be opted in from `AgendaPage`.
- Expo behavior must stay: date click -> contract (`onPickDate`); weekend block click -> contract with block (`onReserve`).
- Generated UI copy stays Spanish (existing convention).

## TDD
- Mode: strict (session config "Strict TDD Mode: enabled"). Runner: `npx vitest run` (package.json `test`).

## Tasks
- [x] T1 Expo always light theme (public variant ignoring `data-pc-theme="dark"`).
- [x] T2 Navigation: year buttons + 3-letter month chips replace the month select; arrows hidden in month views, kept in detail (week) views. Both screens.
- [x] T3 Remove Mañana/Tarde/Noche block buttons in "Mes" view only; keep them in "Fines de semana". Both screens.
- [x] T4 Agenda summary: remove "Apartar libre…" buttons, "Mayor hueco", "Libre todo el día".
- [x] T5 Agenda two levels: top picker only Mes | Fines de semana; clicking a date opens the detail (Resumen | Horarios + "← volver"); in detail, clicking the day number opens the create modal.
- [x] T6 Mes view: inline events (max 2 + "+N más"), no empty-count text, hour ticks hidden on mobile.

## Acceptance criteria
- Expo renders light even with `data-pc-theme="dark"` on the document. ✅ (`data-tone="public"` selector guard)
- No month `<select>`; 12 month buttons with aria-pressed. ✅
- Month view has no block buttons; weekends view keeps them. ✅
- Agenda flows: month -> date -> detail -> back; day number in detail opens modal. ✅
- Expo flows unchanged (date -> contract, block -> contract with block). ✅ (CalendarView.test.tsx unchanged assertions still pass)

## Checks
- `npx vitest run src/features/booking-agenda src/features/expo-bebe`
- `npx tsc --noEmit`

## Route
- Delegated direct (writer trigger: 2+ non-trivial files; mapping trigger: 4+ files).

## Progress / Evidence
- Branch: `feat/calendar-navigation-redesign`.

### T1 + T2 — commit `1274a7b`
- Files: `AgendaNavigation.tsx/.module.css/.test.tsx`, `BookingCalendar.tsx/.module.css`, `expo-bebe/components/CalendarView.tsx/.test.tsx`.
- Combined into one commit: both changes landed in the same `AgendaNavigation`/`BookingCalendar` rewrite (tone prop + chip navigation), so splitting them into two commits would have required an artificial partial-file commit.
- RED: 7 new/updated `AgendaNavigation.test.tsx` assertions failing (select-based month nav, arrows always shown, no tone attribute). GREEN after implementing month chips, arrow hiding in month views, `onBack` support, and `tone="app"|"public"` with a `:not([data-tone="public"])` CSS guard.
- `npx vitest run src/features/booking-agenda src/features/expo-bebe`: 34 files / 169 tests passed.
- `npx tsc --noEmit`: 0 errors.

### T3 — commit `8f385ec`
- Files: `MonthGrid.tsx`, `MonthGrid.test.tsx`, `BookingCalendar.tsx`.
- MonthGrid ("Mes") now always renders `DayTimeline` on the hour-tick scale and never receives a create policy, so block buttons (and any create action) never render in Mes for either screen; "Fines de semana" (`MonthWeekendsGrid`) is untouched.
- RED: updated "shows a selected-day detail panel with create buttons" test failed (still asserted buttons existed). GREEN after the MonthGrid change.
- Full agenda+expo suite: 34/34 files, 169/169 tests. `tsc --noEmit`: 0 errors.

### T4 — commit `be0bb92`
- Files: `DayTimeline.tsx/.module.css/.test.tsx`, `MonthWeekendsGrid.test.tsx`, `AgendaPage/__tests__/index.test.tsx`.
- Removed DayTimeline's hours-scale summary/actions block ("Libre todo el día", "Mayor hueco: Xh", "Apartar {label}" buttons) entirely — it only ever backed agenda's exact-time quick-create (expo always uses the block scale). Dead `.summary`/`.actions`/`.actionButton` CSS removed.
- Updated `MonthWeekendsGrid.test.tsx`'s block-button test to explicitly use `timelineScale="blocks"` (the real expo path) and added a companion test asserting agenda's hours-scale weekends view now offers no create actions at all.
- Updated `AgendaPage` test: removed the "Apartar Libre" quick-create test, added tests confirming the action is gone and that "Nuevo evento" still opens a blank form.
- Full agenda+expo suite: 34/34 files, 169/169 tests. `tsc --noEmit`: 0 errors.

### T5 — commit `44fcee7`
- Files: `useAgendaPage.ts`, `AgendaPage/index.tsx`, `AgendaPage/__tests__/index.test.tsx`, `BookingCalendar.tsx`, `AgendaHours.tsx`, `AgendaHours.test.ts`.
- `useAgendaPage` now tracks `level` ("browse"/"detail"), `browseView` (Mes/Fines de semana, persisted across a detail visit), `detailView` (Resumen/Horarios) and `browseAnchorDate` (restored by "Volver"). The top `AgendaNavigation` only ever sees `views=["month","month-weekends"]` while browsing or `views=["summary","hours"]` plus `onBack` while in a detail.
- `BookingCalendar`'s `onDateSelect` is now `page.selectCalendarDate`: while browsing it enters detail (remembers the anchor date, switches to Resumen); while already in a detail it opens the existing "Nuevo evento" create modal prefilled with that date (`startNewForDate`).
- Added `onDaySelect` to `AgendaHours`/`BookingCalendar` (FullCalendar `dayHeaderContent`) so clicking a day-column header in Horarios also opens the create modal — this bypasses FullCalendar's `dateClick`/drag-`select` ambiguity that already existed for the exact-time drag-select flow.
- RED: new `AgendaPage` integration tests (view-picker restriction, drill-in, Volver, day-number-opens-modal, Mes-view drill-in) and an `AgendaHours` source-content test for `dayHeaderContent`/`onDaySelect` failed against the pre-T5 four-view picker. GREEN after the hook/page/AgendaHours changes.
- Full agenda+expo suite: 34/34 files, 174/174 tests. `tsc --noEmit`: 0 errors.

## Final verification
- `npx vitest run src/features/booking-agenda src/features/expo-bebe`: 34 files, 174 tests passed.
- `npx tsc --noEmit`: 0 errors (clean before and after; no pre-existing errors touched).

### T6 — Mes view lists events inline (mobile-first)
- Added after user feedback: replace "N eventos" with up to 2 lines `HH:MM – HH:MM · label`, then `+N más`; empty days show nothing; hour ticks hidden in Mes cells on mobile (<768px).
- Route: direct inline (MonthGrid + css, one-line DayTimeline class hook).
- RED: 2 new `MonthGrid.test.tsx` tests failed. GREEN: `npx vitest run src/features/booking-agenda src/features/expo-bebe` 176/176; `npx tsc --noEmit` 0 errors.
