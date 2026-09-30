# Event theme form (staff editor: splash background + confetti shapes)

Source: Engram handoff `handoff/frontend/bridal-event-theme-form` (#2375, bookandsign-api `feat/theme-authoring`).

## Objective
Add a separate "Theme" section to the event edit page (`/event-edit/[id]`) where staff can set the splash background photo and the confetti shapes of an event, while the rest of `themeOverrides` is shown read-only.

## Problem / why
`PATCH /events/:id` replaces the whole `themeOverrides` object (no deep merge). Editing one key without reading the current value wipes tokens, other images and decorations. The section will grow (companies / brand kits), so it lives in its own feature folder instead of the already-large edit page.

## Decisions (user-approved 2026-09-28)
- Hybrid with restriction: editable = `images.background` + `decorations.confetti.shapes` only. Every other `themeOverrides` key is displayed as read-only JSON in its own block. No raw JSON editing.
- Structure by `themeOverrides` key (one block per key) so future editable keys plug in without touching the rest.
- Before saving: fresh `GET /v2/events/id/:id` (verified: v2 spreads the entity, so `themeOverrides` is included), deep-merge client-side, send the full object. Unknown keys (e.g. `decorativeIcon`) must survive the merge.
- Never send `socialCta: null`.
- Confetti options come from the frontend catalog `CONFETTI_SHAPES` (`src/features/party/theme/confettiShapes.ts`).
- Background mime: png/jpeg/webp only (no svg).

## Scope
In: theme section component(s) under `src/features/events/theme/`, theme-assets upload service, `EventV2`/`UpdateEventPayload` typing, wiring into `src/pages/event-edit/[id].tsx`.
Out: tokens/socialCta/copy editing, corporate activations, custom SVG uploads, confetti colors/amount UI.

## Mode
TDD: enabled (global Strict TDD config). Runner: `npm test` (`vitest run`; `src/features/party/**` excluded). Delivery strategy: ask-on-risk; forecast ~350-450 authored lines.
RDD: off (clone_local) — no native review.

## Tasks
- [x] T1 Pure `mergeThemeOverrides` (+ helpers to set/remove background and set confetti shapes) with vitest tests first; add `themeOverrides` to `EventV2` and `UpdateEventPayload`. Route: delegated writer.
- [x] T2 `themeAssetsService` (`POST /theme-assets/upload-url` with `ownerType: 'event'`, `slot: 'background'`; PUT to signed URL). Route: delegated writer.
- [x] T3 `EventThemeSection` UI (background upload/preview/remove, confetti shape toggles from catalog, read-only JSON blocks for other keys, own save button: GET -> merge -> PATCH) wired into the edit page. Route: delegated writer.

## Acceptance
- Saving background or confetti keeps every other existing `themeOverrides` key intact (incl. unknown keys).
- Removing the background sends `images.background = null`.
- Confetti sends `{ enabled: true, shapes: [...] }` preserving existing `colors`/`amount`; shapes restricted to the catalog, max 20.
- Non-editable keys visible as read-only JSON.
- `npm test` and `npx tsc --noEmit` pass.

## Progress / evidence

### T1 — mergeThemeOverrides
- RED: `npx vitest run src/features/events/theme/__tests__/mergeThemeOverrides.test.ts` failed with
  `Cannot find module '../mergeThemeOverrides'` (module did not exist yet).
- GREEN: same command, 10/10 tests passed after implementing
  `src/features/events/theme/mergeThemeOverrides.ts` (`mergeThemeOverrides`,
  `setBackgroundImage`, `removeBackgroundImage`, `setConfettiShapes`).
- Added `themeOverrides?: ThemeOverrides | null` to `EventV2` and `UpdateEventPayload`
  in `src/interfaces/events.ts`.
- Decision: `socialCta: null` in a merge change is ignored (current value kept) —
  documented in the helper's JSDoc, matches "never send socialCta: null".
- Decision: deselecting all confetti shapes sends `{ enabled: true, shapes: [] }` —
  documented in `setConfettiShapes` JSDoc (public render falls back to default confetti).
- Commit: `3f6d9c9` — `feat(events): add themeOverrides merge helpers`

### T2 — themeAssetsService
- Added `src/interfaces/themeAssets.ts` (upload-url payload/response types) and
  `src/api/services/themeAssetsService.ts` (`createThemeAssetUploadUrl`,
  `uploadThemeAssetBlobToSignedUrl`), mirroring
  `partyPersonalizedPhotoService.uploadPersonalizedPhotoBlobToSignedUrl`.
- Thin wrapper — test written alongside the implementation (not strict RED-first,
  per task instructions allowing this for T2) with mocked axios/fetch:
  `npx vitest run src/api/services/__tests__/themeAssetsService.test.ts` — 3/3 passed.
- Commit: `c589537` — `feat(events): add theme assets upload service`

### T3 — EventThemeSection UI
- `src/features/events/theme/readOnlyThemeEntries.ts` (+ 5 tests, all green) — pure
  helper splitting `themeOverrides` into read-only entries (excludes
  `images.background` and `decorations.confetti`, keeps everything else per key,
  including unknown keys like `decorativeIcon`).
- `src/features/events/theme/EventThemeSection.tsx` (container: local edit state,
  own "Guardar tema" button — upload if a new file was picked, fresh
  `getEventById`, merge, `updateEventById`, refresh local state) +
  `components/ThemeBackgroundBlock.tsx`, `components/ThemeConfettiBlock.tsx`,
  `components/ThemeReadOnlyBlock.tsx` (all < 300 lines: 210/74/54/28).
- Wired into `src/pages/event-edit/[id].tsx` as a separate `Card` below the
  existing form; added `loadedEvent` state so the section gets `eventId` +
  `initialThemeOverrides` once the event loads. `buildUpdateEventPayload`
  untouched — main form still never sends `themeOverrides`.
- Confetti shape labels/icons reuse `CONFETTI_SHAPES`/`CONFETTI_SHAPE_ICON` from
  `src/features/party/*` (no React deps duplicated).
- Component tests (testing-library + jsdom, available in this repo) in
  `src/features/events/theme/__tests__/EventThemeSection.test.tsx`: renders
  current background/confetti/read-only state; removing background + save sends
  `images.background: null` while preserving `images.logo`, `decorations.sparkles`
  and the unknown `decorativeIcon` key; toggling a shape + save sends the merged
  shapes list; save failure shows the error toast. 4/4 passed:
  `npx vitest run src/features/events/theme/__tests__/EventThemeSection.test.tsx`.
- Commit: `f92245d` — `feat(events): add EventThemeSection UI to event edit page`

### Full verification (after T3)
- `npm test`: 367 passed / 1 pre-existing failure
  (`src/features/partners/repository/__tests__/partnersRepository.test.ts`).
  Proved pre-existing on base via `git stash -u` + rerun before any change in this
  feature — same failure, same assertion, unrelated to theme work.
- `npx tsc --noEmit`: no errors.

### Fix — confetti only written when touched (parent spot check)
- Bug: every save applied `setConfettiShapes`, so a background-only save wrote
  `decorations.confetti = { enabled: true, shapes: [] }`, overriding confetti inherited
  from the preset/brand kit (and force-enabling it).
- RED: new test "saving only a background change leaves inherited confetti untouched"
  failed (`decorations` was defined). GREEN after adding `confettiDirty` state in
  `EventThemeSection.tsx`: theme tests 20/20; `npm test` 368 passed / 1 pre-existing
  partners failure; `npx tsc --noEmit` exit 0.

## Next step
Feature complete (T1–T3 done). Optional follow-up out of scope: backend-side
validation of `decorations.confetti.shapes` against the frontend catalog (noted
as an open point in `confettiShapes.ts`, not part of this feature).
