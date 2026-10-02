# Party i18n (es/en)

## Objective
Show the public party area (`/fiesta`, `/mis-fotos`, inspiration, expired) in Spanish or English, and move the mis-fotos "Ver galería" action to where guests actually look.

## Problem and why
- No i18n: locale fixed by `DEFAULT_LOCALE = "es"`; ~150–250 hardcoded Spanish strings in `src/features/party`; dates hardcode Spanish months / `es-MX`. `{ key }` ThemeTexts resolve to null because no `ThemeI18nLookup` is injected.
- Mis-fotos "Ver galería" is a small link above the photo; guests scroll down to Guardar/Compartir and leave without seeing it.

## Scope and authorization
User approved (2026-10-02): "Vaaamos". Frontend only, no packages, no i18n routes (printed QR URLs must not change).
Excluded: admin i18n, backend changes, push, PR, merge.

## Decisions
- Own helper + dictionary in `src/features/party/i18n/`; `en` typed as `Dictionary` (`typeof es` shape) so missing keys fail typecheck. Keys grouped per screen.
- `t(locale, key, params)` reuses `theme/translate.ts` for `{{}}`; dates via `Intl.DateTimeFormat`; plurals via `Intl.PluralRules`.
- Locale resolution: `?lang` → stored choice (localStorage) → browser (`navigator.languages`) → `es`.
- `LanguageToggle` "ES · EN" text pill (no flags), always top-right: mis-fotos `CarouselHeader` next to the counter; floating top-right on fiesta hero, inspiration, expired.
- Dictionary doubles as `ThemeI18nLookup` so `{ key }` theme texts render.
- Gallery: full-width tertiary "Ver todas las fotos de la fiesta" only at the end of mis-fotos (below Guardar/Compartir); keep the top link; no floating button. (User 2026-10-02: "solo lo quisiera al final de mis-fotos, no lo quiero en los modales" → removed from SuccessCtaModal.)

## Tasks
- [x] T1 — Core: dictionaries (seed keys), `t`, `formatDate`, `plural`, `resolveLocale` with node:test tests. Route: inline (small new module, no research). Files: `i18n/{dictionaries/es.ts,dictionaries/en.ts,types.ts,translate.ts,resolveLocale.ts}` + `__tests__/i18n.test.ts`; registered in `scripts/run-party-tests.mjs`. API: `t`, `tPlural` (Intl.PluralRules), `formatDate` (es-MX/en-US), `createThemeI18nLookup`, `resolveLocale`, `isLocale`. RED: TS6053 missing modules. GREEN: party 143/143 (11 new); tsc 0; diff check clean.
- [x] T2 — `LocaleProvider` + `useT()`/`useLocale()`, `LanguageToggle`, persistence, `?lang`; replace `DEFAULT_LOCALE` callers; inject dictionary as `ThemeI18nLookup`. Route: delegated writer (multi-file).
  - `i18n/localeStorage.ts` (try/catch, key `party.locale`), `i18n/LocaleProvider.tsx` (`useLocale`, `useT`, `withLocaleProvider` HOC on feature page default exports — pages call theme hooks in their own body), `components/LanguageToggle.tsx` (inline in CarouselHeader next to counter; floating on fiesta Overview, inspiration, expired).
  - First render uses `DEFAULT_LOCALE` (no hydration mismatch), resolves after mount; `?lang` not persisted; `setLocale` persists + sets `<html lang>`.
  - Parent added locale to `Splash.tsx` `resolveImageAlt` calls (outside writer surface).
  - Toggle not shown on loading/empty/error/splash states (accepted).
  - Evidence: RED TS6053 localeStorage missing; GREEN party 149/149; vitest 469/470 (known partnersRepository); tsc 0; diff check clean.
- [x] T3 — Mis-fotos + carousel strings and dates; relocated gallery button + SuccessCtaModal action. Route: delegated writer.
  - `misFotos.*` / `carousel.*` keys; `formatSplashDate(locale, raw)` via Intl (es `05 · ENE · 2026`, en `30 · AUG · 2026`); `getRewardPromoCopy(locale)`; effect `labelKey`.
  - New `ViewAllPhotosButton` (ghost, dashed accent border, 46px, full width) below ActionBar and in SuccessCtaModal (only when gallery can open). Note: Compartir is the gradient primary, Guardar the outline.
  - Parent fixed Spanish accents (Exportación, botón, próximo).
  - Left for T4/T5: `components/PostActionConfirmation.tsx`, `components/SocialCta.tsx`; `generateStaticExportAsset.ts` has no production callers (left as is). Unused carousel UI (AssetPickerSheet, EffectsRail, RewardPromoBadge/Modal) translated anyway.
  - Evidence: RED TS2554/TS2307 on formatSplashDate test; GREEN party 153/153; vitest 469/470 (known); tsc 0; diff check clean.
- [x] T4 — Fiesta, lightbox, modals (Dedicate, Personalize, Share), dedication phrases. Route: delegated writer.
  - Groups `fiesta`, `overview`, `lightbox`, `postAction`, `socialCta`; `formatOverviewDate` (es DD.MM.YYYY, en MM.DD.YYYY); `sharePhoto(url, title, shareTitle?)`.
  - Scope note: Dedicate/Personalize modals, `dedicationPhrases.ts` and related editor components are only reachable from deprecated `/party` + `/part` (PartyPublicPage) → left untranslated by design.
  - Dead code found (not imported): components/PhotoGrid, components/Splash/, components/SessionsGrid/, components/SessionCarousel/, components/SessionCard/, utils/personalizePhrases.ts, sessionShare text builders.
  - SocialCta in the admin preview has no LocaleProvider → static labels fall back to es (fix in T5).
  - Evidence: RED TS6053 / TS2554; GREEN party 158/158; vitest 469/470 (known); tsc 0; diff check clean.
- [x] T5 — Inspiration, expired, `RecoverPhotosCTA`, carousel share title (`useFotoBoothCarousel.ts:139`), admin preview forced locale for SocialCta static labels; final grep sweep. Route: delegated writer.
  - Groups `inspiration.*`, `expired.*`; `buildRecoverPhotosUrl` (WhatsApp recovery message in guest locale, long date); `LocaleProvider locale` prop (pinned: no resolution/persistence/html lang) used by admin `ThemeSocialCtaPreview`; `localizeSessionItems` re-localizes photo alt on locale switch; internal download errors now English (never shown to guests).
  - Sweep: no leftover Spanish in live routes; remaining hits are language names, deprecated `/party`-only components, and dead code.
  - Evidence: RED vitest "Website" link / TS6053 / TS2305+TS2554; GREEN party 163/163, vitest 470/471 (known partnersRepository), tsc 0, diff check clean.

## Execution and delivery
Branch: feat/rt/party-i18n (from feat/rt/social-network-in-public-pages @ ba93898)
Initial boundary: ba93898
TDD: RED → GREEN → REFACTOR. Runners: `npm run test:party` (node:test; new files must be added to `scripts/run-party-tests.mjs`), `npx vitest run` for non-party.
RDD: disabled/unmanaged (clone-local OFF).
Delivery strategy: single-pr (same as previous feature, user preference: one PR, multiple commits). Forecast: ~900–1300 authored lines (dictionaries dominate).

## Verification
Per task: focused tests, `npx tsc --noEmit --incremental false`, `git diff --check`, work-unit commit.

## Progress
T1 commit b4c20f7. T2 commit 4771dec. T3 commit ffe9740. T4 commit 556fc52. T5 done (commit below). All tasks done (T5 commit bb82f44).
Browser check (by Claude at user's request, mobile 375px, event xv-rosita-2, nothing saved): fiesta ES/EN switch (page + theme texts + html lang + storage), mis-fotos inline toggle next to counter, translated carousel, "Ver todas las fotos de la fiesta" navigates to fiesta. Fixes from the check: (1) view-all button was too faint (dashed 32% border, 82% text) → solid tinted surface, full-opacity accent text; (2) `?lang` kept outranking the guest's toggle choice after reload → toggle now strips `lang` via shallow `router.replace`. Not checked in browser: SuccessCtaModal action (needs a real download), inspiration and expired pages.
Pre-existing, not ours: `POST /event-analytics/track` 400 when URL has no `?source` (backend rejects `direct`). Slow loads in the Browser pane were the hidden pane pausing dev hydration.
Gallery action removed from SuccessCtaModal per user (commit below). Next: PR on request. Dead-code cleanup offered as a separate task.
