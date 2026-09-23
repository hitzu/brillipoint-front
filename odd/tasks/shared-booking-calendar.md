# Shared booking calendar (agenda + expo)

## Objective
Evolve `BookingCalendar` into the single calendar used by `/agenda` and expo, with month and
month-weekends views, an hour-accurate day timeline, and a "create here" intent that each
container resolves its own way.

## Problem / Why
- `/agenda`: selecting a date only moves the selection; it never opens the booking creation
  modal (Google Calendar-style create is expected). The modal only opens via "Nuevo evento".
- Expo: reuses the same week-only calendar in `readOnly` mode. Operating at expos needs a full
  month view and, above all, a **month-weekends view** (Fri/Sat/Sun) showing per-day occupancy
  with exact times, and a way to reserve a free block straight from the calendar.
- `readOnly` disables everything; expo needs "no event details, but can create".

## Scope
- `src/features/booking-agenda/` (calendar components, utils, AgendaPage wiring, navigation).
- `src/features/expo-bebe/components/CalendarView.tsx`, `ExpoBebePage.tsx`, ContractView entry
  (date + block preselection).
Out of scope: backend endpoints, contract-add exact-hours flow (already exists), legacy
`src/views/*` calendars.

## Constraints / decisions (user, 2026-09-23)
- Calendar emits intents only: `onNavigate`, `onCreateRequest({ date, startsAt, endsAt, blockId? })`,
  `onEventSelect`. Containers decide (agenda → BookingForm modal; expo → contract tab).
- Create options are an injected policy `getCreateOptions(date, entries)`:
  - Expo = **blocks only** (`blockAvailability`): a button appears only for a block that is fully
    free. If no whole block fits, no button.
  - Agenda = exact free intervals.
- Partial gaps (e.g. 14:00–20:00 after an 11:00–14:00 booking) are still SHOWN with exact times but
  are not actionable in expo; staff handles them manually through contract-add (staff agreement only).
- Day timeline uses the operational window **04:00 → 04:00 next day** (matches blocks), tick labels
  every 4h, free segments labeled with exact times, largest free gap highlighted
  ("Libre todo el día" / "Mayor hueco: 8h").
- **Weekend view is the priority** for expo operation: wide Fri/Sat/Sun cells with full timeline,
  labels and block buttons inline; it is expo's default view.
- Month grids are custom CSS grids reusing `DayTimeline` (not FullCalendar dayGrid): interactive
  block buttons inside FullCalendar day cells conflict with its `dateClick` handling, and the
  weekend grid needs full layout control. FullCalendar stays for the existing week-hours view.

## TDD
- Mode: enabled (source: user global config "Strict TDD Mode: enabled").
- Runner: `npx vitest run <path>` (`npm test` = `vitest run`). Typecheck: `npx tsc --noEmit -p .`.

## Tasks
- [x] T1 — Pure utils (TDD): `dayTimeline.ts` (`timelineSegments(date, entries)` over the
  04:00–04:00 window merging today + early hours of next day; free/occupied segments with labels;
  `largestFreeGap`), `createOptions.ts` (`blockCreateOptions`, `exactCreateOptions`), `monthGrid.ts`
  (`monthGridDates(anchor, { weekendsOnly })` → weeks of YMD, `monthRange` → fetch from/to).
  Must cover the 11:00–14:00 case (am+pm blocked, night offered, 14–20 shown free). Route: delegated writer (3 new non-trivial files + tests).
  Evidence: RED (3 suites, modules missing) → GREEN `npx vitest run src/features/booking-agenda` 69/69; tsc clean; full vitest 224/225 (known partners failure). Parent spot check: utils 34/34. Commit 287548d (~561 lines incl. tests). RDD: off (clone_local) → no review.
  Follow-up for T2: dedupe `entries` on occupied segments by `key` (an overnight entry can appear from both days).
- [x] T2 — `DayTimeline` component + calendar intent contract: `onCreateRequest` / `getCreateOptions`
  on `BookingCalendar`; agenda opens `BookingForm` prefilled with date/times on create request
  (fixes the modal bug); week-hours FullCalendar `select` → `onCreateRequest`. Route: delegated writer.
  Evidence: RED (DayTimeline import missing) → GREEN booking-agenda+expo 133/133; parent spot check booking-agenda 81/81; tsc clean; full vitest 236/237 (known partners failure). Lint not runnable: repo has no ESLint config (`next lint` prompts interactively) — pre-existing. Overnight prefill reuses useBookingForm `endsNextDay = endsAt <= startsAt`. Segment entries deduped by key. `civilSelectionRange` helper written with its test (not red-first). RDD off.
- [x] T3 — Month + month-weekends views (custom grids with `DayTimeline`), navigation by month,
  view picker, month-range data fetch for agenda. Weekend grid: 3 wide columns, stacked on mobile.
  Route: delegated writer.
  Evidence: RED (4 suites: MonthWeekendsGrid/MonthGrid modules missing, AgendaNavigation month-stepping/views-prop, AgendaPage weekend-view/range) → GREEN booking-agenda+expo 146/146; tsc clean; full vitest 249/250 (known partners failure). `CalendarView` type added to `types.ts` (`"summary"|"hours"|"month"|"month-weekends"`), reused by `BookingCalendar`, `useAgendaPage`, `AgendaNavigation`. New `MonthWeekendsGrid.tsx`/`.module.css` (3 wide Fri/Sat/Sun columns, `full` DayTimeline, compact entry cards, `today`/`selectedDate` injectable) and `MonthGrid.tsx`/`.module.css` (7 Mon–Sun columns, `compact` DayTimeline, no inline buttons, selected-day detail panel with `full` DayTimeline + buttons). Both stack to a single column with a "Semana del X" label under 768px via CSS only (no separate mobile component, no JS breakpoint branching) — `BookingCalendar` renders these grids at every breakpoint, bypassing `MobileAgenda`. Past days (`date < today`, civil, injectable via `today` prop) never get create buttons even when fully free; outside-month days carry `data-outside-month`. `AgendaNavigation` steps by month in month views (title "Octubre 2026"-style, buttons "Mes anterior/siguiente") and gained a `views?: CalendarView[]` prop (defaults to all 4) to restrict the picker; existing Año/Mes selectors untouched. `AgendaPage` now derives its fetch range from `page.view`: month views use `monthFetchRange`, week views changed from `useAgendaRange(start, start+6)` to `useAgendaRange(start, start+7)` (one extra day, same reasoning as `monthFetchRange`, so the last visible day's DayTimeline sees next-day early hours) — updated `AgendaPage/__tests__/index.test.tsx`'s two range assertions accordingly (explicitly permitted by this task). Deviation: the doc's "'Hoy' still works" line refers to a button that does not exist anywhere in the current codebase (grepped, no match) — nothing to preserve; not invented, out of scope. Parent spot check: re-ran the 4 new/changed suites standalone (13 passed) plus the full booking-agenda+expo run. RDD: off (clone_local) → no review.
- [x] T4 — Expo wiring: `CalendarView` defaults to month-weekends with month toggle, block policy,
  month-range public fetch, `onCreateRequest` → contract tab with date + block preselected.
  Route: delegated writer.
  Evidence: RED (`CalendarView.test.tsx` rewritten for the weekend-grid-by-default behavior: 7
  failed/1 passed against the old week-based summary implementation; `ExpoBebePage.test.tsx`'s 2
  new reserve-flow tests: 2 failed/1 passed) → GREEN after implementation: `CalendarView.test.tsx`
  8/8, `ExpoBebePage.test.tsx` 3/3, `monthGrid.test.ts` 11/11 (new `monthsInRange` tests included).
  `npx vitest run src/features/booking-agenda src/features/expo-bebe`: 158/158. Full
  `npx vitest run`: 261/262 (known partners failure, unchanged). `npx tsc --noEmit -p .`: clean.
  New pure helper `monthsInRange(from, to)` in `monthGrid.ts` (walks the inclusive YMD range one
  month at a time — a YMD range is monotonic so no dedupe needed); replaces the old week-based
  `requiredMonths` in expo `CalendarView.tsx`, driven by `monthFetchRange(selectedDate, {
  weekendsOnly: view === "month-weekends" })`. Verified actual `monthFetchRange` output rather than
  assuming: for anchor 2026-10-15 the **weekend** view only spans Oct+Nov (2 months); the **month**
  view spans Sep/Oct/Nov (3 months) — both covered by `monthsInRange` tests. Expo `CalendarView` now
  holds `view` state (default `"month-weekends"`), shows the view picker restricted to
  `["month-weekends", "month"]`, passes `getCreateOptions={blockCreateOptions}` and a new
  `onCreateRequest` → `onReserve?.({ date, blockId })` (only when the option carries a `blockId`;
  ignores it otherwise, though the block policy never emits a blockId-less option). `onPickDate` is
  unchanged for day-header clicks (date only, per the accepted decision to keep that behavior).
  `ExpoBebePage` gained `blockSeed` state and `handleReserve`, threading `initialPeriod` into
  `ContractView` alongside the existing `initialFecha` (`useContractForm` already accepted
  `initialPeriod`/`seededPeriodRef` — no hook change needed). `handlePickDate` now also resets
  `blockSeed` to `null` so a later date-only pick cannot leak a stale block. Privacy check on the
  public endpoint (`publicBookingCalendar.ts`): `toPublicEntry` hardcodes `title: "Ocupado"` and
  `clientName: null` — no client data ever reaches expo UI state (`entryLabel` therefore always
  renders "Ocupado" for public entries); confirmed via a dedicated test asserting no `@`/phone/name
  text renders next to an occupied block. Styling: added a defensive `.calGrid` wrapper class in
  `expo-bebe.module.css` (`width:100%; min-width:0; overflow-x:hidden`) around `BookingCalendar` in
  expo's `CalendarView`; the shared grid CSS modules (`MonthWeekendsGrid.module.css`,
  `DayTimeline.module.css`) already use `min-width:0` and `fr`/wrap-based layout throughout, so no
  changes were needed there — the wrapper is belt-and-suspenders for the expo `.panel` specifically.
  Not verified visually (per standing instruction: user tests UI/browser changes themselves).
  Test dates deliberately fixed far in the future (2030) instead of mocking "today", to keep tests
  deterministic without fake-timers/RTL interaction risk. Parent spot check: not yet run (delegated
  writer report only). RDD: off (clone_local) → no review invoked.

- [x] T5 — Expo review fixes (user feedback 2026-09-23): (a) calendar only used 1/3 width — T4 reused class name `.calGrid`, which already existed as a legacy 3-col grid in `expo-bebe.module.css`; renamed wrapper to `.calendarBody`, removed dead `.calGrid`. (b) dead space above the grid — global template rule `section { padding: 100px 0 }` (uikit.scss/landing.scss) hit the grids' `<section>`; reset margin/padding in `MonthGrid`/`MonthWeekendsGrid` modules. (c) month arrows jumped to the contract tab — navigation reused `selectDate` (which calls `onPickDate`); nav now only calls `setSelectedDate`. (d) "missing" buttons were past days (before 2026-09-23) — added visible "Fecha pasada" note. Route: inline (small, understood). RED: nav test (onPickDate called 1×) and past-note test failed → GREEN 159/159; tsc clean.

- [x] T6 — Timeline bar rendered only the first segment (user feedback): segments never got the `.segment` class (`position: absolute`), so they stacked vertically inside the 1.5rem `overflow: hidden` bar. Added the class; last tick label anchored right. Route: inline. RED (class assertion) → GREEN 160/160; tsc clean. User decision: keep 04:00→04:00.

- [x] T7 — Block scale for expo (user, 2026-09-23: keep 04→04 window but no hour labels; indicate with Mañana/Tarde/Noche): `DayTimeline` `scale="blocks"` replaces hour ticks and in-bar time text with a Mañana|Tarde|Noche scale aligned to block ranges; exact times remain in aria-label/title and entry cards. Threaded as `timelineScale` (default "hours") through `BookingCalendar` → month grids; expo passes "blocks", agenda keeps hours. Route: inline. RED (2 tests) → GREEN 162/162; tsc clean.

- [x] T8 — Block buttons replace the block scale (user, 2026-09-23): in `scale="blocks"` the Mañana|Tarde|Noche row IS the action row — one button per block, proportional to its range, `disabled` when the block is unavailable, the day is past, or no policy is given; the "Libre todo el día"/"Mayor hueco" summary and the separate "Apartar …" list are dropped in blocks mode (hours mode unchanged). Route: inline. RED (3 tests) → GREEN 164/164; tsc clean.

## Acceptance criteria
- Agenda: clicking a free segment / day opens the booking modal with date (and times) prefilled.
- Expo: month-weekends view shows each Fri/Sat/Sun with exact occupied/free times and a button per
  fully free block; clicking it lands on contract creation with that date and block.
- A day with 11:00–14:00 booked shows "Libre 14:00–20:00" with no button and offers "Noche".
- `npx tsc --noEmit -p .` and `npm test` pass (except known failures below).

## Known environmental failures
- `src/features/partners/repository/__tests__/partnersRepository.test.ts` > resolves enabled
  occasions with organizer placeholders replaced (pre-existing, if still present).

## Delivery
- Forecast ~900–1100 authored lines (> 400). Strategy: `single-pr` (user, 2026-09-23: one branch with all commits, review the final result).
- Branch: `feat/rt/new-calendar-for-expo-page`, one work-unit commit per task.

## Progress
- Plan created 2026-09-23.
- T1 done 2026-09-23 (287548d).
- Delivery decided: single-pr.
- T2 done 2026-09-23.
- T3 done 2026-09-23.
- T4 done 2026-09-23.
- Next: final review by user (single PR).
