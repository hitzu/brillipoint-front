# Events v2 migration

## Objective
Migrate the frontend from the legacy v1 event shape to the backend v2 events read model, so schedule/venue live exclusively in the contract's EVENT booking (bridge: booking → contract → event).

## Problem / Why
Backend (`bookandsign-api` commit e25c4a1) deprecated event-level schedule/location fields. v2 reads (`GET /v2/events`, `/v2/events/id/:id`, `/v2/events/:token`) resolve `venueName`, `mapsUrl`, `serviceStartsAt`, `serviceEndsAt`, `bookingId`, `status` from the EVENT booking (null / `finished` when none). The frontend still reads v1 and still sends deprecated fields on create/update.

## Scope
- Reads move to v2; writes stay on v1 (`POST /events`, `PATCH /events/:id`) without deprecated fields.
- Deprecated, removed from front: `serviceTypeId`, `serviceType`, `serviceLocationUrl`, `printTemplate`, `printTemplates`, `EventPrintTemplate`, and event-level writes of `venueName`, `serviceStartsAt`, `serviceEndsAt`.
- Decision (user, 2026-09-24): admin event forms drop schedule/venue entirely (option A); schedule/venue are edited only via bookings.

## Out of scope
- `/fiesta`, `/mis-fotos` session/gallery endpoints (`/sessions/*`): response shape unchanged, backend already sources status/date from booking.
- Booking agenda / contracts-add (already booking-based).

## Constraints
- TDD: strict (session config `Strict TDD Mode: enabled`), runner Vitest (`npm test` → `vitest run`). `src/features/party/**` excluded from Vitest; uses `npm run test:party` (node:test).
- Work-unit commits on `feat/rt/events-cleaned`, Conventional Commits.

## Tasks
- [x] T1 — Types + services: add `EventV2` type; slim `CreateEventPayload`/`UpdateEventPayload`; remove deprecated fields/types; `getEvents`/`getEventById` → v2; `getPublicEventByToken` → `/v2/events/:token`; `PublicEventResponse` no longer extends legacy `Event`. Tests for eventsService + partyPublicService URLs/payloads. Route: delegated (writer trigger: 2+ non-trivial files).
- [x] T2 — Admin pages: `event-add.tsx`, `event-edit/[id].tsx` drop deprecated form fields/validators/payload; `event-list.tsx` reads v2 (`venueName`, `serviceStartsAt`, `status`). Route: delegated (writer trigger: 2+ non-trivial files).
- [x] T3 — Closure: `tsc --noEmit`, `npm test`, `npm run test:party`, grep for residual deprecated fields.

## Acceptance criteria
- No references to `serviceLocationUrl`, `serviceTypeId`, `printTemplate(s)`, `EventPrintTemplate` in `src`.
- Event reads hit `/v2/events*`; create/update payloads never contain deprecated fields.
- Typecheck and all test suites pass.

## Progress / Evidence

### T1 — Types + services
- Commit: `d1bb22f` refactor(events): read events from v2 api
- RED: `npx vitest run src/api/services/__tests__/eventsService.test.ts src/api/services/__tests__/partyPublicService.test.ts` — 3 failed (v2 URL expectations against unmodified v1 service), 5 passed.
- GREEN: same command — 8 passed (2 files) after `EventV2` type + v2 URLs landed.
- Also fixed `src/api/services/photosService.ts`'s duplicate `normalizePublicEvent` (broken by the `Event` → `EventV2` field rename; not in the original file list but a direct consumer of `PublicEventResponse`).
- Files: `src/interfaces/events.ts`, `src/interfaces/partyPublic.ts`, `src/api/services/eventsService.ts`, `src/api/services/partyPublicService.ts`, `src/api/services/photosService.ts`, `src/api/services/__tests__/eventsService.test.ts` (new), `src/api/services/__tests__/partyPublicService.test.ts`.

### T2 — Admin pages
- Commit: `d35ba08` refactor(events): drop deprecated event fields from admin forms
- RED: `npx vitest run src/features/events/utils/__tests__/eventPayload.test.ts` with the implementation file removed — "Cannot find module '../eventPayload'", 0 passed.
- GREEN: same command after restoring `src/features/events/utils/eventPayload.ts` — 5 passed.
- Extracted `buildCreateEventPayload`/`buildUpdateEventPayload` to `src/features/events/utils/eventPayload.ts` for testability; wired into `event-add.tsx` and `event-edit/[id].tsx`.
- `event-list.tsx` reads `EventV2`; venue/date columns show `-` on null; added a "Estado" column driven by `status`.
- `event-edit/index.tsx` adapted to `EventV2` only (no behavior change).
- Files: `src/pages/event-add.tsx`, `src/pages/event-edit/[id].tsx`, `src/pages/event-edit/index.tsx`, `src/pages/event-list.tsx`, `src/features/events/utils/eventPayload.ts` (new), `src/features/events/utils/__tests__/eventPayload.test.ts` (new).

### Verification (after T1 + T2)
- `npx tsc --noEmit`: no errors.
- `npm test`: 343 passed / 1 failed — failure is `src/features/partners/repository/__tests__/partnersRepository.test.ts` ("resolves enabled occasions with organizer placeholders replaced"), pre-existing and unrelated (partners feature, not touched by this migration).
- `npm run test:party`: 31/31 passed.
- `grep -rn "serviceLocationUrl|serviceTypeId|printTemplate|EventPrintTemplate|decorativeIcon" src`: only matches are negative-assertion string literals inside the new test files (`eventPayload.test.ts`, `eventsService.test.ts`); no production code references remain.

### T3 — Closure (parent spot check)
- `npx tsc --noEmit`: no errors (re-run by parent).
- `npx vitest run src/features/partners`: 1 failed / 9 passed — no partners files in `git diff e3148c1..HEAD`; failure pre-existing.
- Behavior note: `getPublicEventByToken` no longer swallows 404 into a stub event. PartyPublicPage renders not-found; InspirationPublicPage's `Promise.all` catch now also drops phrases on an invalid token. Accepted.
- RDD: off (clone_local). Assess range e3148c1..HEAD: risk medium, not reviewed (RDD disabled/unmanaged).

## Next step
Done. Push / PR are the user's decision (branch ~1.1k changed lines; consider chained PRs if review size matters).
