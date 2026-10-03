# reward-promo-theme-block

## Objective
Make the gift / reward promo (🎁 button + `GiftModal` in `/mis-fotos`, share-confirm tag copy in the `/fiesta` lightbox) a layered theme block, `rewardPromo`, so it only shows Brillipoint's promo on Brillipoint events and is hidden on brand-kit events.

## Problem
`GiftModal` hardcodes `@brillipoint` and is always rendered; the lightbox share-confirm hardcodes "tag @brillipoint for a discount". Brand events show a Brillipoint promo inside the client's experience.

## Why
Brands may want their own reward later (ask them first; build the editor when one says yes). Today the response contract must be ready and fall back correctly.

## Decisions
- Option A (user, 2026-10-02): the promo lives in the **Brillipoint brand kit** overrides, not in the system default. System default carries `rewardPromo: null` (keeps "no Brillipoint branding" intent). Client/business kits inherit `null` automatically → hidden. Only one kit reaches `resolveTheme` (`clientKit ?? businessKit ?? brillipointKit`).
- Merge semantics: plain `resolveTheme` atomic block (`undefined` inherit, `null` remove, object replaces) — NOT the never-hide `resolveSocialCta` chain.
- One data migration (`jsonb_set`) adds `rewardPromo` to the existing `brillipoint` kit row. No creation default for other kits.
- No admin editor for now.

## Contract
```ts
interface RewardPromo {
  handle: string;          // e.g. "@brillipoint"
  title?: ThemeText;       // modal headline; absent → i18n default
  disclaimer?: ThemeText;  // absent → no disclaimer
}
// ThemeOverrides.rewardPromo?: RewardPromo | null
// ResolvedTheme / EventTheme.rewardPromo: RewardPromo | null
```

## Scope
- bookandsign-api (branch `feat/reward-promo-theme-block`): types, validation, resolve, system default, public DTO/service, Brillipoint seed + migration, specs.
- bookandsign-front (branch `feat/reward-promo-theme-block`): contract types, system default sync, gift button/modal + lightbox share-confirm driven by `rewardPromo`, tests.

## Tasks
- [x] T1 (api) Contract + validation + resolve + system default + public DTO. Route: delegated (writer trigger, 2+ non-trivial files). Commit `b2c69fa`. RED 14 failing → GREEN; `npm test -- src/events/theme` 121/121 (parent re-ran); service+brand-kits 104/104; tsc: 65 pre-existing base errors, none new. RDD off (clone-local) → no review.
- [x] T2 (api) Brillipoint kit seed + data migration `1790984577000` (jsonb_set up / `- 'rewardPromo'` down, SQL tried in a rolled-back tx on test DB, not run on any real DB). Commit `baf0109`.
  - Finding: the seed migrations named in `brillipoint-kit.seed.ts` were never committed and local dev DB has no `brillipoint` row. socialCta survives that via the in-code `BRILLIPOINT_SOCIAL_CTA_SAFETY_NET`; the visual layer (and so `rewardPromo`) has no safety net → promo would be hidden on Brillipoint events where the row is missing. Pending user decision.
- [x] T2b (api) In-code safety net: when no client/business kit and the Brillipoint row is missing (or lacks `rewardPromo`), use the seed `rewardPromo` (mirror `BRILLIPOINT_SOCIAL_CTA_SAFETY_NET`). User decision 2026-10-02. Commit `e1c7059` (helper `toVisualKitLayer` in `src/events/theme/visual-kit-layer.ts`; preview unchanged — never used the Brillipoint kit). RED: cases a/b + helper spec failed; GREEN.
- [x] T2c (api) Seed migration with every global row `/fiesta`, `/mis-fotos`, `/inspiracion` need (Brillipoint kit at least). Non-destructive: insert when missing, never overwrite existing prod data. Supersedes the jsonb-only migration `1790984577000` (unpushed branch). User decision 2026-10-02. Mapping: the only global row the 3 pages need is `brand_kits.key='brillipoint'` (`/inspiracion` reads `event_phrases` by event_type id = staff data, out of scope). Commit `f929936`: migration `1790985211804` (advisory lock, INSERT ON CONFLICT DO NOTHING with frozen literal, add rewardPromo only if absent; down removes only the key), deleted `1790984577000`, `brand_kits` added to production-seed INCLUDED before `brands`. SQL validated on test DB in rolled-back tx (idempotent). Theme specs 127/127 (parent re-ran); service+brand-kits+seeds 124/124; tsc 66 pre-existing, none new.
  - Open: production-seed copies kit `overrides.images` URLs as-is (presets strip them).
- [x] T3 (front) Contract + render: hide gift/lightbox tag when `rewardPromo` is null, read handle/title/disclaimer from theme. Route: delegated (writer trigger). Commit `e4bec70`. RED TS6053 (builder missing) → GREEN; `npm run test:party` 171/171 (parent re-ran); `npm test` 470/471 (pre-existing partnersRepository failure, same on base); tsc clean. system-default.json synced with API (2026-10-02). UI not browser-verified (user tests UI).

## Acceptance criteria
- Event without client/business kit → `rewardPromo` with `@brillipoint`; gift button + modal + lightbox tag copy show.
- Event with client/business kit → `rewardPromo: null`; no gift button, no modal, lightbox share-confirm without the @brillipoint tag/discount copy.
- Overrides with unknown `rewardPromo` keys or invalid handle are rejected; `null` accepted.

## Checks
- api: `npm test` (focused theme + brand-kit specs), `npx tsc --noEmit`.
- front: `npm run test:party`, `npm test`, `npx tsc --noEmit`.

## Delivery
Strategy: ask-on-risk. Forecast ~400-500 authored lines across both repos (separate PRs per repo).

## Progress
- 2026-10-02: exploration done, branches created. All tasks T1–T3 done (api: b2c69fa, baf0109, e1c7059, f929936; front: e4bec70).

## Next step
User: verify UI (/mis-fotos gift + /fiesta lightbox share-confirm on a Brillipoint event and a brand-kit event, `?cache=` off), then push + PRs (api and front, separate). Follow-ups: delete dead RewardPromoBadge/RewardPromoModal/rewardPromoCopy + `carousel.rewardPromo` dict keys; decide whether production-seed strips kit image URLs; admin editor for rewardPromo when a brand asks.
