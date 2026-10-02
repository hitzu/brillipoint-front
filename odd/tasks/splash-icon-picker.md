# Splash icon picker in event theme editor

## Objective
Let staff upload, replace, or remove (`null`) the event splash logo (`themeOverrides.images.splashIcon`) from the event edit theme section.

## Problem / Why
The API already accepts the `splashIcon` slot (theme-asset upload, svg allowed) and the public Splash renders `images.splashIcon.url`, but the editor (`EventThemeSection`) only edits `images.background` and confetti; `splashIcon` is shown read-only.

## Scope
- Front only (`src/features/events/theme/**`). No backend changes.
- Reuse the existing background upload flow (`createThemeAssetUploadUrl` + `uploadThemeAssetBlobToSignedUrl`, slot `splashIcon`).
- Accepted files: png/jpg/webp + svg.
- Removal writes `images.splashIcon: null` (explicit removal, valid per API).
- `readOnlyThemeEntries` stops listing `splashIcon` as read-only.

## Constraints
- PATCH replaces `themeOverrides`: merge must keep every other key untouched.
- Hint for staff: on a splash without photo the logo sits on `primary`; a monochrome version reads best.

## Tasks
- [x] T1 — Splash icon block (upload/replace/remove) wired into EventThemeSection save flow + merge + read-only exclusion, with tests. Route: delegated (writer trigger: 2+ non-trivial files).

- [x] T2 (API repo, branch feat/splash-icon-plate) — `images.splashIcon.plate` optional opaque `#RRGGBB`, only on splashIcon: types, DTO, validator, resolve passthrough, tests. Route: delegated (writer trigger).
- [x] T3 (front) — plate color picker in ThemeSplashIconBlock, saved with the slot; public Splash uses plate as ring color + contain/padding. Route: delegated (writer trigger).

Decision (user, 2026-10-01): plate belongs to the event's splashIcon slot, not a theme token. No image → no plate → theme default ring + Brillipoint logo. Image without plate → current behavior.

## Acceptance criteria
- Picking a file uploads to slot `splashIcon` and saves `images.splashIcon = { path, url }`.
- Removing saves `images.splashIcon: null`; background/confetti/other keys preserved.
- Untouched splash icon is not rewritten.
- `splashIcon` no longer appears in read-only entries.

## Checks
- Test-first (vitest): `npx vitest run src/features/events/theme`
- `npx tsc --noEmit -p .`

## Progress
- Branch: feat/splash-icon-picker
- T1 done. RED: 4 files / 7 tests failing before impl. GREEN: `npx vitest run src/features/events/theme` + themeAssetsService test → 6 files, 44 tests passed; `npx tsc --noEmit -p .` clean.
- Extra in-scope edit: `src/interfaces/themeAssets.ts` widened `ThemeAssetSlot` (+`splashIcon`) and `ThemeAssetMime` (+`image/svg+xml`) to match the API.
- UI copy chosen by writer (pending user OK): "Logo de la pantalla de bienvenida", "Quitar logo", "Sin logo", toast "Usa PNG, JPEG, WEBP o SVG".
- Next: user manual UI check; RDD assessment.
- T2 done: API commit 2109862 (feat/splash-icon-plate). RED 7 failing → jest src/events/theme src/events/dto 147 passed. tsc: 65 errors, identical count on base (pre-existing, unrelated specs). Preset DTOs needed ThemeSplashIconImageAssetDto (forbidNonWhitelisted); event overrides are raw objects.
- T3 done: RED 13 failing → vitest theme+party/utils 56 passed; tsx --test tokensToEventPageTheme 7/7 (node:test, not collected by vitest); tsc clean. Plate state carries over to a new upload unless cleared with "Sin color".
- Next: user manual UI check (editor + splash with/without photo); then Jardín elegante theme.
