# Event brand section + themeOverrides JSON import

## Objective

Keep the event edit page tidy: core event fields (honorees, base theme, photos, key…) stay in the main form; everything only branded events need (companies, couples with a branded wedding) lives in one collapsible "Marca del evento" section. Staff can paste the `themeOverrides` JSON produced by the `bookandsign-theme-authoring` skill.

## Problem / Why

`EventThemeSection` renders background, splash/logo + plate, confetti, social CTA and read-only values all at once for every event, even non-branded ones. The skill already emits validated `themeOverrides`, but staff must re-enter it by hand.

## Scope

- Collapsible brand section wrapping the existing `EventThemeSection` content.
  - Opens automatically when the loaded `themeOverrides` already carries brand content; closed otherwise.
  - Pure UI state: collapsing never mutates or clears overrides (no checkbox semantics).
  - Splash block relabelled as logo + logo background (it already is: `ThemeSplashIconBlock` + `plate`).
- "Import JSON" textarea that accepts **only `themeOverrides`**.
  - Parse + validate; invalid JSON / non-object shows an error and changes nothing.
  - Loads into editor state (confetti, plate, social CTA, other values) for preview; does NOT save. Saving stays on "Guardar tema".
  - Image URLs (`images.background`, `images.splashIcon.url`, other image slot URLs) are ignored from the JSON; images keep being uploaded separately. `images.splashIcon.plate` is accepted.

## Out of scope

- "Quitar personalización" (clear overrides) button — proposed, not confirmed by user.
- Full skill payload (base theme, company).

## Constraints

- English artifacts/code; Spanish UI copy consistent with existing page.
- Tests with vitest (`npm test`), test-first for the parser.

## Tasks

- [x] T1 — Pure `parseThemeOverridesJson` (validate, strip image URLs, keep plate) + tests (RED→GREEN). Route: delegated (writer trigger: 2+ non-trivial files with T2/T3).
- [x] T2 — Import JSON UI in `EventThemeSection`: apply parsed overrides to editor state (shapes, plate, social CTA, read-only/rest), preserve current images, no auto-save + tests.
- [x] T3 — Collapsible "Marca del evento" section, auto-open when overrides have brand content, splash relabel + tests.

## Acceptance criteria

- Non-branded event: section collapsed; branded event: expanded on load.
- Collapsing/expanding never changes what gets saved.
- Pasting valid skill `themeOverrides` updates the preview; "Guardar tema" persists it with existing uploaded images intact.
- Invalid JSON shows an error and leaves the form untouched.

## Checks

- `npm test -- src/features/events/theme`
- `npx tsc --noEmit` (scoped to touched files if repo has pre-existing errors)

## Progress

- Branch: `feat/event-brand-section`
- T1 done — route: delegated (writer). Commit `f3d74a7`. RED: `npx vitest run .../parseThemeOverridesJson.test.ts` failed (module missing); GREEN: 13/13 passed.
- T2 done — route: delegated (writer). Commit `cc45770`. RED: 5 new UI tests in `EventThemeSectionImport.test.tsx` failed (no import UI); GREEN: `npx vitest run src/features/events/theme` 139/139 passed; `tsc --noEmit` clean for `src/features/events/theme`. `applyImportedThemeOverrides` unit tests were written alongside the helper (not observed RED).
  - Save semantics: imported top-level keys replace the refetched stored blocks wholesale (`applyImportedThemeOverrides`, applied before image/plate/confetti/socialCta edits); keys absent from the import are kept; `images` is never written by the import (plate goes through the plate editor, `plateDirty`). Imported socialCta is saved as-is (lossless); later form edits replace it.
- T3 done — route: delegated (writer). Commit `2761283`. RED: 7 new tests (`hasBrandContent.test.ts`, `EventThemeSectionBrandCollapse.test.tsx`) failed; GREEN: `npx vitest run src/features/events/theme` 157/157 passed; `tsc --noEmit` clean for `src/features/events/theme`.
  - Collapse uses react-bootstrap `Collapse` (content stays mounted, so unsaved edits survive toggling); default open = `hasBrandContent(initialThemeOverrides)` (any non-empty value; `null`/empty objects do not count). The toast moved outside the panel so it stays visible when collapsed.
- Follow-up (not done): `EventThemeSection.tsx` is ~404 lines (was 365); a react-modular split (logic hook + save-payload builder) is a candidate refactor.
- Next: user review; push/PR are the user's decision.
