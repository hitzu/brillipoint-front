# Splash background (images.background)

Source: Claude Artifact "Splash Background Handoff" (https://claude.ai/artifact/C6ZUGyi2J3V4H9stD6QNvv).

## Objective
When the theme provides `images.background` (9:16), the party splash shows it full-screen with a dark bottom scrim and white name/date. Without it, behavior stays exactly as today.

## Decisions
- No `background` => current behavior unchanged (F3 dropped; user decision 2026-09-28).
- F2 is resolved by F1: `components/Splash` is dead code; `/fiesta` and `/mis-fotos` both render `experiences/fotobooth/Splash.tsx` via `getExperience` and `/fiesta` already passes `images`.
- `cover` never becomes the splash background.

## Mode
TDD: enabled (project config), runner: `vitest run` (`npm test`). Route: delegated direct writer (one writer).

## Tasks
- [x] T1 (F1+F2) Background mode in `experiences/fotobooth/Splash.tsx` + `assets/css/fotobooth.module.css`: with `images.background` skip `.splashBg`, blobs; add bottom scrim; name/date white; emblem on a light round plate. Tests first.
- [x] T2 (F5) `pages/MisFotosPage.tsx` "photos on the way" view: use `formatSplashDate`; apply `buildThemeVars(theme)`. Tests first.
- [ ] T3 (F4) Investigate honoree name color (splash `.splashName` gradient primary->secondary; gallery header) vs `tokens.text`. Needs a decision: changing it alters the no-background look.

## Acceptance
- With background: photo visible edge to edge on both pages, no gradient/blobs over it, white name/date over scrim.
- Without background: identical to today.
- `cover` never used as background.
- "Photos on the way" themed with formatted date.

## Progress / evidence
- T1: `resolveSplashLayout` helper (4 tests, RED: TS6053 missing module -> GREEN `npm run test:party` 109/109); `tsc --noEmit` clean. Component/CSS wiring not covered by automated tests; visual check by user pending. Note: party tests run via `npm run test:party` (node:test), not vitest (config excludes party).
- T2: date fix applied to EnCamino and Error empty states via `formatSplashDate`; theme was already applied through `buildThemeVars` on `.centerState` (white was only a CSS fallback). No automated test: `formatSplashDate` imports `@common`, unresolvable by the party runner.
