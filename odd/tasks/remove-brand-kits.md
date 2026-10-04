# remove-brand-kits (frontend)

## Objective

Remove every brand-kit reference from bookandsign-front so it matches the API contract after `/brand-kits` was dropped (bookandsign-api branch `refactor/remove-brand-kits`).

## Why

Kits were overengineering (user decision 2026-10-02). Theme layers are now: Brillipoint default (code-owned in the API) -> preset (`eventThemeId`) -> event `themeOverrides`. Company events use per-event `themeOverrides` plus the company name in `honoreesNames` (`{{honoreesName}}`).

## Scope

- `ThemeTemplateParams.brandName` and `SocialCta.brandKitKey` removed from the party theme contract.
- Editor copy that says "kit de marca" now refers to the inherited theme.
- Comments and test fixtures stop mentioning kits.
- Out of scope: `brandName` in `src/features/expo-bebe/**` — verified as the contract's brand (`lockedBrandName`), unrelated to theme kits.

## Constraints

- Branch `refactor/remove-brand-kits` stacks on `feat/event-brand-section` and merges after it.
- Conventional commits, no AI attribution. No push/PR without the user.

## Tasks

- [x] T1 — Contract types + party tests: drop `brandName` and `brandKitKey`; fixtures use `{{honoreesName}}` only. Route: inline (mechanical, understood). Test-first exception: type-only removal, no runtime behavior change (`translate` substitutes params generically).
- [x] T2 — Theme editor: inherited-CTA copy says "tema" instead of "kit de marca"; test fixtures drop `brandKitKey`/`brandName`; comments updated. Route: inline. RED: update copy assertions first.
- [x] T3 — Remaining comments (`confettiShapes`, `resolveThemeText`, `PhotoViewerLightbox`, `social-media-cta.module.css`). Route: inline.

## Acceptance criteria

- `grep -rnE "brandKit|BrandKit|brand_kit|brand-kit|brandName|BRAND_KIT" src` only returns expo-bebe hits.
- No "kit de marca" copy in the editor.

## Checks

- `npx vitest run` (touched areas + full), `npx tsc --noEmit`, `npm run lint`.

## Progress

Branch created from `feat/event-brand-section` @ `53d6ae9`.

- T1 done — `a9171e9`. `npm run test:party` 171/171, `npx tsc --noEmit` clean.
- T2 done — `6332056`. RED: 4 copy assertions failed after switching to "Heredado del tema"; GREEN: `src/features/events/theme` 157/157.
- T3 done — comments only (commit below).

## Verification

- Grep of acceptance criteria: only expo-bebe hits.
- `npx vitest run`: 509/510. The one failure (`partnersRepository.test.ts` > "resolves enabled occasions with organizer placeholders replaced") also fails on base `53d6ae9` — pre-existing, unrelated.
- `npx tsc --noEmit`: clean. `npm run test:party`: 171/171.
- `npm run lint`: unavailable — no ESLint config, `next lint` opens its interactive setup.

## Next step

User: review UI copy in the event theme editor, then push + PR after `feat/event-brand-section` merges. Remaining feature work: T4 (skill `bookandsign-theme-authoring` drops the company/kit path).
