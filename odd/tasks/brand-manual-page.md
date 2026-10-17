# brand-manual-page

Objective: a private `/brand-manual` page that ports the Brillipoint Experience interactive brand manual (ManualVisual from the claude.ai Design System artifact) as React components, plus a menu option and a menu index fix.
Branch: `fear/desing-system` · Delivery: ask-on-risk (forecast ~2,000 authored lines, chain strategy asked before any PR) · Tests: Vitest (`npm test`).

## Specs

- **S1** — "Quiero crear una pestaña en este proyecto que sea una guia visual de nuestra guia de diseño y manual de marca para poder visualizarlo rapidamente". Port `project/components/ManualVisual/preview.html` (artifact https://claude.ai/artifact/WA2uqNpmGryrnqdKM6Qt6s) as components, not raw HTML. Route: `/brand-manual` (assumption), private Layout.
- **S2** — "pero el objetivo es que se agregara al proyecto y que se agregara una opcion en el menu". Menu entry in `src/Layouts/MenuData.tsx` (assumption: group "Marca" → "Manual de marca", last in the menu).
- **S3** — "aprovechando que vamos a tocar el menu ¿puedes revisar los indices? creo que estan mal". Verified: top-level ids are `0, 2, 2, 3…10` (1 missing, 2 duplicated by Contratos and Productos, so both toggle together in `Sidebar` and `NestedMenu`); submenu id `slots` is reused by Agenda and Contratos, and Agenda's `dataPage` is `contracts-list`. Fix: unique sequential ids.
- **S4** — Photobooth / Glitter Bar toggle switches the whole manual between the light and dark token sets (`tokens.json`).
- **S5** — The 9 sections keep the manual's content and interactions: La marca; Logotipo (version, background and size picker with a can/can't verdict, protection-area toggle); Color (swatches with HEX/RGB/CMYK and click-to-copy, the 60/30/10 bar, the "¿Encaja?" contrast checker with brand rules); Tipografía (specimens, "Pruébala" tester, type scale in px and pt); Piezas (buttons, chips, price seal, package card, spark-count slider); Aplicaciones (post, story, printed photo, keychain, card, signage mockups); Voz (copy checker that flags barato, promo, oferta, desde, ¡¡, emojis and CAPS); Prohibiciones; Antes de imprimir (checklist).
- **S6** — Assets: reuse `logo-experience-white.png` / `logo-experience-black.png` (byte-identical to the artifact's logo 3 and logo 4); add the two script signatures. Jost (OFL) and Amsterdam One are self-hosted for this page only ("BP Jost", "BP Amsterdam One"). User confirmed the web license (L8): "Sí, tenemos licencia web de Amsterdam One: súbela al repo y agrégala al manual." The manual no longer lists the license as pending.
- **S7** — "manual de marca deberia de ser una pagina sin layer (osea pantalla completa) para poderlo revisar bien :D". `/brand-manual` renders without the admin layout and fills the viewport, but keeps the session guard (`withAuth`) the admin layout provided.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S2, S3 | inline | done | `f5f3c97`; RED 4/4 then GREEN, `MenuData.test.ts` + `ExpoNavigation.test.tsx` 6/6 |
| T2 | S4, S5 (pure logic: tokens, color math, verdicts, voice checker) | inline | done | `7b9b761`; RED (missing modules) then GREEN 29/29 |
| T3 | S1, S4, S6, S5 (shell, shared UI, La marca) | inline | done | `62ec9ee`; RED (missing page) then GREEN 33/33; `tsc` 0 errors. Reopened by L8: RED (license still listed) then GREEN 54/54; `tsc` 0 errors; dev chunk carries `AmsterdamOne.f418c404.ttf` |
| T4 | S5 (Logotipo, Color) | inline | done | `1b1ebd5`; RED (missing sections) then GREEN 40/40; `tsc` 0 errors |
| T5 | S5 (Tipografía, Piezas) | inline | done | `e68d63f`; RED (missing sections) then GREEN 46/46; `tsc` 0 errors |
| T6 | S5 (Aplicaciones, Voz, Prohibiciones, Antes de imprimir) | inline | done | `145fdc0`; RED (page test failed at Aplicaciones) then GREEN 53/53; full suite 591/592 (1 baseline failure, L5); `tsc` 0 errors; dev-server GET 200 (L6) |
| T7 | S7 | inline | done | RED (route still in admin layout) then GREEN 59/59 (brand-manual + menu); `tsc` 0 errors; dev-server GET 200 without admin chrome |

Route evidence: no Writer trigger (units are sequential and share the shell), so the parent writes inline.

## Log

- **L1 (2026-10-16, user, verbatim)**: "Busca en engram el handoff "handoff/brand-manual-visual-page" y continúa ese trabajo."
- **L2 (handoff #2725, user quotes)**: S1–S3 quotes above. Inspiration: eich.branding reel of an interactive web brand manual ("ermi").
- **L3 (2026-10-16, discovery)**: Google Fonts returns 400 for `Amsterdam+One`; the family in `_document.tsx` never loads (silently dropped from the multi-family request), so `expo-bebe.module.css` already falls back. Out of scope here; noted.
- **L4 (2026-10-16, decision)**: RDD is off (clone-local), so no native review. User memory: they test UI themselves; verification is Vitest + typecheck.
- **L5 (2026-10-16, evidence)**: Known baseline failure, not caused by this feature (no file under `src/features/partners` changed): `partnersRepository.test.ts > resolvePartnerLandingRoute > resolves enabled occasions with organizer placeholders replaced` expects "coordinada por Partner Demo" in the hero copy.
- **L6 (2026-10-16, evidence)**: No `next build` because the user's `next dev -p 4000` was running (a build would overwrite `.next`). Instead, GET `/brand-manual` on that server returned 200 with the SSR markup, and the page chunk carries the "BP Jost" `@font-face` resolved to `Jost-VariableFont_wght.3d252ad3.ttf`. ESLint is not configured in the repo (`next lint` opens its setup wizard).
- **L7 (2026-10-16, open decision)**: Amsterdam One stays unshipped until the user confirms the commercial/web license (S6). If confirmed, add the TTF next to Jost and a second `@font-face` in `BrandManualPage.module.css`.
- **L8 (2026-10-16, user, verbatim)**: "Sí, tenemos licencia web de Amsterdam One: súbela al repo y agrégala al manual." Resolves L7: `src/assets/fonts/brillipoint/AmsterdamOne.ttf` + "BP Amsterdam One" `@font-face`; pending-license copy removed from La marca and Tipografía.
- **L9 (2026-10-17, user, verbatim)**: "manual de marca deberia de ser una pagina sin layer (osea pantalla completa) para poderlo revisar bien :D". Route now uses `withAuth(NonLayout)`; `.app` is `100dvh` with no outer radius. The route test mocks `authGuard.js` because Vite does not parse JSX in `.js` files.
- **Next step**: user reviews `/brand-manual` in the browser; decide the chain strategy before opening a PR. Separate follow-up: `_document.tsx` still requests Amsterdam One from Google Fonts (never loads), so Expo pages keep falling back.
