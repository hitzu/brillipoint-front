# Contracts-add agenda time controls and brand-gated extras

## Objective
Align `/contracts-add` with Agenda's exact-time behavior and make its package and extras sections guide brand selection consistently.

## Problem and why
The schedule had separate date/time behavior and an irrelevant all-day shortcut. Also, extras appeared blank before brand selection, while packages showed an explicit prompt that a brand is required.

## Scope
- Use Agenda `TimeSelect` for start/end, with 30-minute options and editable custom `HH:mm` values.
- Remove the independent end date. Keep eventDate anchored to start; end time <= start time means next day.
- Show the Agenda-style next-day indication.
- Remove the contracts-add-only “Todo el día” button and handler; leave Agenda's separate preset untouched.
- Gate extras like packages when no brand is selected: show a contextual extras prompt instead of an empty area.
- Update focused tests for schedule controls, validation, exact booking payload, shortcut removal, and brand-gated extras.
- Do not alter other fields, contract creation, booking-create sequencing, or unrelated UI.

## Constraints
- User explicitly authorized these changes.
- Strict TDD enabled; Vitest RED then GREEN.
- Preserve unrelated existing `tsconfig.tsbuildinfo` modification; exclude from feature commits.
- Current branch: `feat/rt/theme-brand-kits` (not the default branch).
- Route: delegated direct. T1 mapping covered four-plus files; T1, T2, and T3 writers were delegated because they span multiple files.
- Delivery strategy: `ask-on-risk` (default). T1 commit is 410 authored changed lines, generated files excluded. Chain strategy remains unresolved; do not make another commit until resolved.

## Acceptance criteria
- Start/end controls expose Agenda's half-hour options and accept valid custom times.
- End date is no longer independently editable.
- Overnight and equal-time ranges end the following day while eventDate stays anchored to start.
- Next-day state is shown from the times.
- Contracts-add has no all-day shortcut; Agenda's preset is unchanged.
- Without a brand, extras display “Selecciona una marca para ver los extras disponibles.”; with a brand, extras continue to display as before.
- Focused tests pass with observed RED → GREEN.

## Tasks
- [x] T1 — Align schedule controls and exact-booking date derivation with Agenda. Route: delegated direct.
- [x] T2 — Remove the contracts-add “Todo el día” shortcut and its unused handler; update tests. Route: delegated direct.
- [x] T3 — Show the brand-selection prerequisite in extras when no brand is selected; update tests. Route: delegated direct.

## Verification evidence
- T1 strict TDD RED: 8 failing / 25 passing; focused GREEN passed 33 tests in 2 files (writer, independent verifier, parent spot check). Equal start/end denotes 24 hours.
- T1 work-unit commit: `55478e811d2f51e03834030e58922eaa667fc5a7` (`feat(contracts-add): align schedule with agenda times`), 410 authored changed lines (generated files excluded).
- T2 strict TDD RED: 2 failing / 31 passing; focused GREEN and parent spot check passed 33 tests in 2 files; `git diff --check` passed. Agenda's preset remains unchanged.
- T3 strict TDD RED: 1 failing / 3 passing; GREEN: `npm test -- src/features/contracts-add/components/__tests__/ExtrasSection.test.tsx src/features/contracts-add/pages/__tests__/CreateContractPage.test.tsx` passed 2 files / 10 tests; parent spot check also passed; `git diff --check` passed.
- T3 renders an extras-specific brand prompt before a brand is selected; selected-brand behavior is unchanged.
- RDD is explicitly off (clone-local). T3 native risk assessment: medium, `under_budget`; no native review was started.
- T2 and T3 are implemented and verified but uncommitted. The next commit awaits the already-requested chain strategy; no PR has been created.

## Next step
Wait for the user's chain strategy before creating another commit.
