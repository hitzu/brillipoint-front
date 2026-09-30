# Recognizable confetti

## Objective
Make the event editor's confetti options distinguishable in light/dark themes and make splash figures recognizable.

## Scope and authorization
User authorized the prior selector and SVG confetti proposal. Local frontend only. Preserve explicit backend colors, override merging, existing routes and carousel export colors.
Excluded: new Inspiration splash, arbitrary image uploads, backend changes, push, PR creation, merge.

## Findings and approach
- Bootstrap floated inputs with negative margins escape the chip padding.
- Existing 4–10 px particles obscure figure details; delays up to 4 s exceed the 3.2 s splash.
- Use contained native checkboxes, responsive cards, semantic theme colors and visible selection/focus.
- Render detailed figures at approximately 20–30 px, simpler pieces smaller; bounded drift/spin, prompt initial visibility, one-shot motion and reduced-motion support.
- Keep explicit confetti colors unchanged. Adapt only splash fallback colors for recognized solid backgrounds; use bright fallback colors and light/dark silhouette separation on photos without image sampling.
- Do not modify carousel export color behavior.

## Execution and delivery
Branch: feat/rt/conffeti-fixes
Initial boundary: 31829d47114f1a8730741ee51370148cce4206a0
Strict TDD: enabled by user AGENTS.md; observed RED → GREEN → REFACTOR required.
Runners: npm run test -- src/features/events/theme/__tests__; npm run test:party (node:test compiler list; Vitest excludes party).
RDD: disabled/unmanaged, clone-local OFF (global also OFF). No native review.
Delivery strategy: exception-ok. User explicitly approved exceeding the line budget: “podemos superar las lineas permitidas” (2026-09-30). Forecast: 450–640 authored additions/deletions, excluding this document. Running count after T2: 603 authored lines excluding task documents (T1 209 + T2 394).
Chain strategy: not required (size exception approved); local work-unit commits on the existing feature branch. No remote operation authorized.

## Tasks
- [x] T1 — Accessible selector layout and regression tests. Route: delegated; multiple non-trivial TSX/CSS/test files. Acceptance observed: contained inputs, distinct light/dark selection, keyboard focus, mobile single-column cards. TDD: 4 failing tests then 24/24 theme tests passing; 1 additional CSS regression failure then 4/4 selector tests passing. Independent verifier: 24/24 passed, compiled tokens verified. Parent spot check: 4/4 passed. Scoped lint unavailable: Next requests initial ESLint configuration (not created). Risk assessment unavailable due to untracked inventory; treated high with independent functional verifier; RDD remains disabled/unmanaged.
- [x] T2 — Detailed SVG catalog and bounded motion with tests. Route: delegated; multiple catalog/icon/builder/splash/CSS files. Added diamond, bow, butterfly, camera; rose/flower interior detail; detailed pieces 20–30px, basic pieces 10–16px; stagger 0–0.6s; duration 2.2–3s; bounded drift and rotation; one-shot CSS, decorative ARIA, reduced-motion hiding. Default amount28 and explicit colors preserved. RED: party3 failures/theme3 failures. GREEN: party129/129, theme27/27; parent spot27/27. Independent full-suite379/380; one unchanged partnersRepository copy expectation failure, baseline48d0eee blob hashes verified equal. Typecheck initially found test-only NodeList/empty-object typing errors, corrected; npx tsc --noEmit --incremental false exits0. Diff check passes. Native assessment medium; RDD disabled/unmanaged.
- [ ] T3 — Splash-only adaptive fallback palette with tests. Route: delegated; color policy and integration/tests. Estimate: 120–180 lines. Acceptance: explicit colors preserved, solid light/dark and photo behavior, safe unsupported CSS fallback, static exports unchanged.

## Verification
Each task: focused RED/GREEN evidence; relevant suites; diff check; work-unit commit and identity recorded only after checks.
Final: npm run test; npm run test:party; npx tsc --noEmit --incremental false; scoped next lint; git diff --check.
Browser: event-edit light/dark/mobile/keyboard; heart-only and new shapes, solid/photo splash, reduced motion. Never save event data for visual checks.
Rollback: each task's source/tests revert independently; T3 depends on splash integration from T2.

## Progress
T1 implemented and checked. Browser inspected localhost event-edit/23 in light/dark, keyboard focus, and 390px mobile. Desktop mid-word wrap found and corrected via 176px grid minimum. Event data not saved. T1 commit: 6c25769d0d2d4d49fc8fa6f1f256e36048847f7b.
T2 resumed after earlier capacity interruption and implemented. Browser verified all11 shapes in the real dark editor and actual SVGs at20/30px with actual animation CSS in a temporary localhost-only synthetic harness. Observed particles appear early and finish with opacity0/iteration1. Full public-route splash/photo-background and browser reduced-motion checks not executed; CSS reduced-motion behavior covered by automated assertions. No event data saved or production preview route added. T2 commit: aff0de2a4669bd1f4cc4e79749862cf3692d0fc8.
Next: T3 adaptive splash colors remains pending; current user continuation requested detailed figures. Mirror topic: odd/recognizable-confetti/tasks.
