# brand-manual-page

Objective: a private `/brand-manual` page that ports the Brillipoint Experience interactive brand manual (ManualVisual from the claude.ai Design System artifact) as React components, plus a menu option and a menu index fix.
Branch: `fear/desing-system` · Delivery: ask-on-risk (forecast ~2,000 authored lines, chain strategy asked before any PR) · Tests: Vitest (`npm test`).

## Specs

- **S1** — "Quiero crear una pestaña en este proyecto que sea una guia visual de nuestra guia de diseño y manual de marca para poder visualizarlo rapidamente". Port `project/components/ManualVisual/preview.html` (artifact https://claude.ai/artifact/WA2uqNpmGryrnqdKM6Qt6s) as components, not raw HTML. Route: `/brand-manual` (assumption), private Layout.
- **S2** — "pero el objetivo es que se agregara al proyecto y que se agregara una opcion en el menu". Menu entry in `src/Layouts/MenuData.tsx` (assumption: group "Marca" → "Manual de marca", last in the menu).
- **S3** — "aprovechando que vamos a tocar el menu ¿puedes revisar los indices? creo que estan mal". Verified: top-level ids are `0, 2, 2, 3…10` (1 missing, 2 duplicated by Contratos and Productos, so both toggle together in `Sidebar` and `NestedMenu`); submenu id `slots` is reused by Agenda and Contratos, and Agenda's `dataPage` is `contracts-list`. Fix: unique sequential ids.
- **S4** — Photobooth / Glitter Bar toggle switches the whole manual between the light and dark token sets (`tokens.json`).
- **S5** — The 9 sections keep the manual's content and interactions: La marca; Logotipo (version, background and size picker with a can/can't verdict, protection-area toggle); Color (swatches with HEX/RGB/CMYK and click-to-copy, the 60/30/10 bar, the "¿Encaja?" contrast checker with brand rules); Tipografía (specimens, "Pruébala" tester, type scale in px and pt); Piezas (buttons, chips, price seal, package card, spark-count slider); Aplicaciones (post, story, printed photo, keychain, card, signage mockups); Voz (copy checker that flags barato, promo, oferta, desde, ¡¡, emojis and CAPS); Prohibiciones; Antes de imprimir (checklist).
- **S6** — Assets: reuse `logo-experience-white.png` / `logo-experience-black.png` (byte-identical to the artifact's logo 3 and logo 4); add the two script signatures. Jost (OFL) is self-hosted for this page. Amsterdam One is NOT committed (font file says "All Rights Reserved" and the manual lists its commercial license as pending): the stack uses a locally installed Amsterdam One, then Dancing Script (already loaded globally). Assumption, pending user decision.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S2, S3 | inline | done | `f5f3c97`; RED 4/4 then GREEN, `MenuData.test.ts` + `ExpoNavigation.test.tsx` 6/6 |
| T2 | S4, S5 (pure logic: tokens, color math, verdicts, voice checker) | inline | done | `7b9b761`; RED (missing modules) then GREEN 29/29 |
| T3 | S1, S4, S6, S5 (shell, shared UI, La marca) | inline | done | RED (missing page) then GREEN 33/33; `tsc` 0 errors |
| T4 | S5 (Logotipo, Color) | inline | pending | |
| T5 | S5 (Tipografía, Piezas) | inline | pending | |
| T6 | S5 (Aplicaciones, Voz, Prohibiciones, Antes de imprimir) | inline | pending | |

Route evidence: no Writer trigger (units are sequential and share the shell), so the parent writes inline.

## Log

- **L1 (2026-10-16, user, verbatim)**: "Busca en engram el handoff "handoff/brand-manual-visual-page" y continúa ese trabajo."
- **L2 (handoff #2725, user quotes)**: S1–S3 quotes above. Inspiration: eich.branding reel of an interactive web brand manual ("ermi").
- **L3 (2026-10-16, discovery)**: Google Fonts returns 400 for `Amsterdam+One`; the family in `_document.tsx` never loads (silently dropped from the multi-family request), so `expo-bebe.module.css` already falls back. Out of scope here; noted.
- **L4 (2026-10-16, decision)**: RDD is off (clone-local), so no native review. User memory: they test UI themselves; verification is Vitest + typecheck.
