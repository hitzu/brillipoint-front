# Social CTA editor

## Objective
Let staff edit the event's own social networks, copy and primary CTA from `/event-edit/[id]`, with a live preview of the public `SocialCta` block.

## Problem and why
`themeOverrides.socialCta` is only shown read-only in the editor. Events cannot set their own networks, website link, headline or CTA without backend authoring.

## Scope and authorization
User approved the plan (2026-10-01): "va me gusta". Local frontend only; no backend contract change (`socials.url` and `primaryAction.channel: "url"` already exist).
Excluded: i18n system, push, PR creation, merge.

## Decisions
- One switch per network (WhatsApp, Instagram, TikTok, Facebook, Website); the input appears when on. Disabled networks are omitted.
- Normalize input: `@user`/`user` → full profile URL; WhatsApp social → `https://wa.me/<digits>`; primary WhatsApp action stores digits in `phone`.
- CTA channel is chosen among active networks; its url/phone is derived from that network on save (data model keeps them independent).
- Texts use `{ text: { es, en } }`. A single ES/EN toggle switches which locale is edited and previewed; ES default, EN optional (resolver falls back to ES). Empty locales are omitted.
- Preview uses the real `<SocialCta variant="page">`.
- (T2) No hide switch: backend rejects `socialCta: null` and always falls back to a kit. Override replaces the inherited block whole.

## Tasks
- [x] T1 — Pure mapper `form ↔ SocialCta` with tests (normalization, derived CTA, localized texts). Route: inline (one module + test). RED: module missing. GREEN: 20/20; theme suite 76/76; tsc exit 0; diff check clean. Files: `src/features/events/theme/socialCtaForm.ts` + test.
- [x] T2 — Resolved theme (preset + brand kit) for placeholders/preview; verify how backend layers `socialCta`. Route: delegated explorer (two repos, >5 lookups). Findings (bookandsign-api):
  - `resolveSocialCta` (src/events/theme/resolve-social-cta.ts:79) picks the FIRST usable block in event override → client kit → business kit → Brillipoint safety net; never merges fields. Saving an override takes over the whole block.
  - `socialCta: null` is rejected (validate-theme-overrides.ts:526); hiding the block is impossible (safety net). Clearing = delete the key.
  - Validation: socials values non-empty https; whatsapp phone `^\d{8,15}$`; non-whatsapp CTA url https; ThemeText `{text:{es?,en?}}` with ≥1 locale; placeholders only `{{honoreesName}}`, `{{brandName}}`.
  - `GET /events/:token/theme` (public) returns resolved theme; strips `fallback`, adds `brandKitKey`, removes the CTA channel from socials. `EventV2` has `token`; `EventThemeSection` only receives `eventId` + `initialThemeOverrides`.
  - Front: `getEventTheme(token, fresh)` in partyPublicService.ts:140; tokens via `buildThemeVars(tokensToEventPageTheme(tokens, images))` on a wrapper; page bg `var(--ep-page-bg)` is not auto-applied.
- [x] T3 — `ThemeSocialCtaBlock` + `EventThemeSection` integration. Route: delegated writer (2+ non-trivial files). Revised by T2:
  - Form source: stored `themeOverrides.socialCta` when present; otherwise prefill from the resolved theme (`getEventTheme(token, true)`) so saving does not silently drop inherited networks.
  - No hide switch (backend forbids it). Add "Usar el heredado" → removes the `socialCta` key.
  - `setSocialCta`/`clearSocialCta` helpers replace the key wholesale (no deep merge, so disabled networks really disappear). Keep the existing `null` exception.
  - Mapper: upgrade `http://` to `https://`; form validation for whatsapp 8–15 digits and CTA label required when a channel is chosen.
  - Evidence: RED pure modules 18 failed / block+section 7 failed + missing module; GREEN theme suite 107/107 (writer + parent spot check); full suite 459/460 (pre-existing partnersRepository failure, untouched); tsc exit 0; diff check clean.
  - Known limitation: after "Usar el heredado" the form keeps the old values until save (public endpoint includes the override, so the kit block cannot be fetched beforehand).
  - Debt: EventThemeSection.tsx is 429 lines → extract `useSocialCtaEditor` hook in T4.
- [x] T4 — Extract `useSocialCtaEditor` hook; live preview `variant="page"` with toggle locale, `{{honoreesName}}`, theme CSS tokens + `var(--ep-page-bg)`. Route: delegated writer.
  - `hooks/useSocialCtaEditor.ts` extracted (section 429 → 365 lines); `ThemeSocialCtaPreview` renders real `<SocialCta variant="page">` with event `--ep-*` vars and page bg; side by side ≥992px (sticky), stacked on mobile.
  - Resolved theme always fetched once per event (preview colors); prefill only when no stored override. Params = resolved `params` + editor `honoreesName` (so `{{brandName}}` resolves).
  - Preview links stay clickable: public components already use `target="_blank" rel="noopener noreferrer"`.
  - Evidence: RED missing module + 2 section tests, then 2 more after follow-up; GREEN theme 117/117 (parent spot check), full 469/470 (known partnersRepository), test:party 132/132, tsc 0, diff check clean.

## Execution and delivery
Branch: feat/rt/social-network-in-public-pages
Initial boundary: 227476ca2d7800d90c262dae9b42be22ad2b4839
TDD: RED → GREEN → REFACTOR. Runner: `npm run test -- src/features/events/theme/__tests__`.
RDD: disabled/unmanaged (clone-local OFF, global OFF).
Delivery strategy: single-pr (user, 2026-10-01: "Un solo pr con múltiples commits"). Forecast: ~500–700 authored lines. Running count after T1: ~380 (incl. task doc).

## Verification
Per task: focused tests, `npx tsc --noEmit --incremental false`, `git diff --check`, work-unit commit.
Browser checks are done by the user.

## Progress
T1 commit 13ea370. T2 done (read-only, no code). T3 commit 952fc45. T4 done (commit below). Browser check (by Claude at user's request, event 23 xv-rosita-2, nothing saved): inherited prefill, themed preview, live {{honoreesName}}, network toggles, CTA switch to Sitio web, EN toggle, mobile 375px stacked with no horizontal scroll all OK. Bug found and fixed: normalized-link hint was dark-on-dark (template dark mode does not override --bs-secondary-color) → uses --bs-body-color at 0.75 opacity. Save validated (user authorized, event 23): PATCH /events/23 200 with whole socialCta (Instagram omitted, url added, CTA url "Visítanos"); public theme returns the override and keeps honoreesName/theme intact; reload loads stored override without inherited note and shows "Usar el heredado". Event 23 left with the saved override. Observed: editing only ES leaves the inherited EN text unchanged (expected, stale EN copy). Next: PR when the user asks.
