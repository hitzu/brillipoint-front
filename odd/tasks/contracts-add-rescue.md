# contracts-add-rescue

## Objective
Repurpose `/contracts-add` (and its "Agregar contrato" menu entry) as the in-app page for creating contracts that come from social media or other non-expo channels.

## Problem
`src/pages/contracts-add.tsx` was built for expos. It is a ~1080-line monolith rendered with `NonLayout`, styled by `contract-creation.module.css` (863 lines), hardcoded colors, a white logo, and a QR success state. Its time selection uses `holdSlot`/`slotId` am/pm blocks. Expo now has its own page (`/expo-bebe`), so this page is dead and off-theme.

## Why
Sales from social media need a contract form inside the normal app shell, with an exact start/end time instead of expo range blocks.

## Scope
- Rebuild the page from scratch under `src/features/contracts-add/` using the app `Layout` and Bootstrap.
- One submit creates the contract and a booking with exact start/end times.
- Keep: vendor (user), brand, client name/phone/email, package cart with quantities, deposit + payment method, public contract note, SKU generation.
- Do NOT filter packages by availability. ~~Photobooth and glitter bar packages can be mixed.~~ Superseded 2026-09-22: packages and extras are filtered by the selected brand (see T6).
- Remove the legacy monolith, its dead code, and its CSS module when nothing else uses it.

## Constraints
- `src/pages/contracts-add.tsx` stays a thin entry point that imports from `features/`.
- `POST /contracts` accepts a payload without `slotId`: `slotId?` is optional in `src/interfaces/contracts.ts:95`, and expo-bebe already omits it.
- Submit order follows expo-bebe (`useContractForm.ts:464`): `generateContract` → `createPayment` + optional `createNote` → `createBooking` (`ExactBookingPayload`, exact times). A booking failure is non-fatal: the contract and its deposit already exist, so show a warning instead of an error.
- Generated artifacts (code, UI copy aside from existing Spanish labels, comments) in English.

## TDD
- Mode: strict, on (source: user global CLAUDE.md "Strict TDD Mode: enabled").
- Runner: `npm test` (`vitest run`); focused runs with `npx vitest run <path>`.

## Delivery
- Forecast: well over ~400 authored changed lines, mostly from deleting the legacy page and CSS.
- Strategy: `single-pr` (user choice 2026-09-22). One PR from `feat/contract-add-page` with one work-unit commit per task.
- RDD: off (clone-local). No native review runs.

## Tasks
- [x] T1 — `useCreateContractForm` hook: form state, validation (client name, vendor, brand, ≥1 package, date, start < end, deposit), submit flow as described in Constraints, non-fatal booking failure. Tests first. Route: delegated writer.
- [x] T2 — Section components: `ClientSection`, `ScheduleSection` (date + start/end `type="time"` + optional "Todo el día" preset), `PackagesSection` (cart, no availability filter), `PaymentSection` (subtotal/deposit/balance/method), `NotesSection`. Tests first. Route: delegated writer.
- [x] T3 — `CreateContractPage` composing the sections inside `Layout` with the "Contratos › Agregar contrato" breadcrumb; thin `src/pages/contracts-add.tsx`; redirect to `/contracts/[sku]` on success. Route: delegated writer.
  - DEVIATION (recorded, not blocking): `src/pages/contracts/[sku].tsx` does not exist anywhere in this codebase (confirmed by search) — there is no single-contract detail route yet, only the `/contracts` list and a legacy, unwired `template-examples/application/contract-edit/[sku].tsx`. Redirects to `/contracts` (the real, existing list route) instead. Revisit once a detail page exists.
- [x] T4 — Remove legacy: old page body (done in T3), `contract-creation.module.css`, and `src/template-examples/pages/contracts-add.tsx` (user decision 2026-09-22: delete, no value). `slotsService`/`holdSlot` kept: still used by `src/pages/calendar.tsx` and `src/views/Sales/Calendar.tsx`. Route: inline (mechanical deletes).
- [x] T5 — Verify the menu entry (`src/Layouts/MenuData.tsx:50-55`) still points at the page; run full checks: `npm test`, `npx tsc --noEmit`, lint. Route: inline.

- [x] T6 — Brand drives the catalog (user decision 2026-09-22): brand stays required in the form and filters BOTH packages and extras. Cross-selling (e.g. glitter bar for a photobooth client) is done by creating an extra under the selected brand. Changing the brand clears the cart/extras that no longer match. The packages section/picker uses the full grid width (it was ~9/12). Route: delegated writer.
- [x] T7 — Extras in contract creation: pick extras of the selected brand with quantities, optionally linked to a cart package (`packageClientRef`), included in subtotal and sent as `extras` in `GenerateContractPayload`. Backend constraint (bookandsign-api `contracts.service.ts:871,890`): extras require `brandId` and every extra must belong to that brand. Reference: expo-bebe `ExtrasSection` + `useContractForm`. Route: delegated writer.
- [x] T8 — Success state with the reservation link (user decision 2026-09-23, like expo-bebe): stop auto-redirecting on success; show a success view (client name, `contractLink` as text + QR, "Copiar link" with ~1.5s feedback, "Nuevo contrato" resets the form, "Ir a contratos" navigates). `bookingWarning` renders inside this view instead of a separate holding state. Route: delegated writer.

- [x] T9 — Contact validation (user request 2026-09-23): phone must have exactly 10 digits and email a valid format when provided (reusing expo-bebe `contactValidation`); phone input keeps digits only, capped at 10. Route: inline (small, understood).
- [x] T10 — End date, events crossing midnight (user request 2026-09-23): add `endDate` to the hook, following `eventDate` automatically until picked separately, clamped so it never precedes the start date; "Todo el día" sets `endDate = eventDate`; validation compares full `eventDate+startTime` vs `endDate+endTime` datetimes instead of same-day times; `buildExactBookingPayload` builds `serviceEndsAt` from `endDate`+`endTime`. Route: delegated writer.
- [x] T11 — Optional Google Maps URL (user request 2026-09-23): add `mapsUrl` to the hook and a "URL de Google Maps" input in `ScheduleSection`; validated only when non-empty by reusing the agenda's `validMapsUrl` rule (extracted to `src/shared/scheduling/mapsUrl.ts`); sent trimmed in `ExactBookingPayload` only when non-empty, like `venueName`; cleared by `resetForm`. Route: delegated writer.

## Acceptance criteria
- `/contracts-add` renders inside the app layout (sidebar, header, breadcrumb) with the app theme.
- A single submit creates the contract, the initial deposit payment, the optional public note, and a booking with the exact chosen start/end times.
- Packages and extras are filtered by the selected brand; no availability filtering.
- No references remain to the legacy CSS module, `holdSlot`, or the QR success state in this flow.

## Progress
- Exploration done; this document created 2026-09-22.
- T1 done 2026-09-22 (delegated writer). Files:
  - `src/features/contracts-add/hooks/useCreateContractForm.ts`
  - `src/features/contracts-add/utils/validation.ts`
  - `src/features/contracts-add/utils/booking.ts`
  - `src/features/contracts-add/hooks/__tests__/useCreateContractForm.test.ts`
  - RED: `Failed to resolve import "../useCreateContractForm"` before the hook file existed.
  - GREEN: `npx vitest run src/features/contracts-add` → 1 file, 8 tests passed.
  - `npx tsc --noEmit -p .` → exit 0, no errors in touched files.
  - Commit: `ecc18bf` (feat(contracts-add): add create contract form hook).

- T2 done 2026-09-22 (delegated writer). Files:
  - `src/features/contracts-add/components/{ClientSection,ScheduleSection,PackagesSection,PaymentSection,NotesSection}.tsx`
  - `src/features/contracts-add/components/__tests__/*.test.tsx` (one per section)
  - Presentational only (props from the hook, no service calls); react-bootstrap Card/Form/Table/Button, no CSS module, no custom colors. Package picker lists every package labeled with its brand name so lines from different product lines can be mixed. Quantity control is a plain Bootstrap button pair (theme-neutral), not expo-bebe's `QuantityStepper` (that one pulls `expo-bebe.module.css` classes).
  - RED: all 5 new test files failed with `Failed to resolve import "../<Section>"` before the components existed.
  - GREEN: `npx vitest run src/features/contracts-add` → 6 files, 17 tests passed.
  - `npx tsc --noEmit -p .` → exit 0, no errors.
  - Commit: `5c2bf79` (feat(contracts-add): add presentational section components).

- T3 done 2026-09-22 (delegated writer). Files:
  - `src/features/contracts-add/pages/CreateContractPage.tsx`
  - `src/features/contracts-add/pages/__tests__/CreateContractPage.test.tsx`
  - `src/pages/contracts-add.tsx` rewritten as a thin entry (`getLayout` uses the same app `Layout` as `src/pages/contracts/index.tsx`); all legacy imports (NonLayout, QR, Flatpickr, holdSlot, contract-creation.module.css) removed from this file.
  - Breadcrumb: `<BreadcrumbItem mainTitle="Contratos" subTitle="Agregar contrato" />`.
  - bookingWarning handling: on a clean success (contract created, no bookingWarning) the page auto-navigates to `/contracts`. When a bookingWarning is present, navigation is held — the warning renders inline in a `role="alert"` `Alert` with an "Ir a contratos" button the user clicks to continue. Chosen because the app has no toast library or post-redirect query-flag pattern (confirmed by search) and inventing one was out of this task's scope; this keeps the warning from being silently lost without new infra.
  - RED: new page test file failed with `Failed to resolve import "../CreateContractPage"` before the file existed.
  - GREEN: `npx vitest run src/features/contracts-add` → 7 files, 23 tests passed.
  - `npx tsc --noEmit -p .` → exit 0, no errors.
  - `npm run lint` → not usable: no ESLint config exists in the repo yet (`next lint` opens its interactive "configure ESLint" wizard); pre-existing, not introduced by this change.
  - Commit: `c27f529` (feat(contracts-add): compose CreateContractPage and rewire the route).

- T6 done 2026-09-22 (delegated writer). Files:
  - `src/features/contracts-add/hooks/useCreateContractForm.ts`: packages effect now depends on `selectedBrandId` and calls `getPackages({ brandId })`, empty array with no brand selected; a second effect clears `cart` lines whose `pkg.brandId` doesn't match the new brand on every brand change; cart items now carry a stable `clientRef` (`pkg-${id}`, mirrors expo-bebe) sent in the `packages` payload for T7's extras linking.
  - `src/features/contracts-add/utils/validation.ts`: `CartItem` gained `clientRef`; added `ExtraCartItem` type for T7.
  - `src/features/contracts-add/components/PackagesSection.tsx`: added required `brandSelected` prop — shows a "Selecciona una marca…" hint and hides the picker/cart until a brand is chosen; picker layout fixed (`Col xs={12}` for both the select and the Add button, was `md={8}`/`md={4}`) so the picker itself spans the full row instead of sharing it.
  - `src/features/contracts-add/pages/CreateContractPage.tsx`: passes `brandSelected={!!vm.selectedBrandId}` to `PackagesSection`.
  - `src/features/contracts-add/hooks/__tests__/useCreateContractForm.test.ts`: replaced the T1 mixed-brand-cart test with brand-filtered-loading and cart-clears-on-brand-change tests; `getPackages` mock now filters by `brandId` like the real endpoint.
  - `src/features/contracts-add/components/__tests__/PackagesSection.test.tsx`: replaced the mixed-brand listing test with a no-brand hint test and a full-width-picker DOM assertion (`.col-12` present, `.col-md-8` absent).
  - RED: new hook tests failed (`getPackages` called before a brand was selected / packages length stayed 0) and new PackagesSection tests failed (hint text missing, `.col-12` absent) against the pre-T6 code.
  - GREEN: `npx vitest run src/features/contracts-add` → 7 files, 27 tests passed.
  - `npx tsc --noEmit -p .` → exit 0, no errors.
  - Commit: `f66aecd` (feat(contracts-add): filter packages by brand and fix picker layout).

- T7 done 2026-09-22 (delegated writer). Files:
  - `src/features/contracts-add/hooks/useCreateContractForm.ts`: added `extrasCatalog` (loaded via `getExtras({ brandId })`, filtered to `status === "active"`, empty with no brand), `extraCart` state with `addExtraToCart(extraId, packageClientRef?)` / `removeExtraFromCart` / `setExtraCartItemQuantity`, a brand-change effect that clears `extraCart` lines whose `extra.brandId` doesn't match (mirrors the T6 cart-clearing effect), `subtotal` now sums packages + extras, and the submit payload always sends `extras: extraCart.map(...)` (mirrors expo-bebe sending the array unconditionally) linked via each cart line's `clientRef`.
  - `src/features/contracts-add/components/ExtrasSection.tsx` (+ test): react-bootstrap, theme-neutral; shows a "linked package" picker only when the cart has more than one line (same UX rule as expo-bebe's `ExtrasSection`), otherwise extras default to unlinked (`packageClientRef: null`).
  - `src/features/contracts-add/pages/CreateContractPage.tsx` (+ test updated): renders `ExtrasSection` between Packages and Payment.
  - `src/features/contracts-add/hooks/__tests__/useCreateContractForm.test.ts`: added `getExtras` mock and a new "extras" describe block (no-brand no-load, active+brand filtering, cleared on brand change, subtotal, payload `extras` linked by `clientRef`); added `extras: []` to the existing full-submit assertion.
  - RED: all 6 new/updated hook assertions failed against pre-T7 code (`extrasCatalog`/`extraCart`/`addExtraToCart` undefined, missing `extras` key in payload); new `ExtrasSection` test failed on missing import; page test failed on missing "Extras" header.
  - GREEN: `npx vitest run src/features/contracts-add` → 8 files, 35 tests passed.
  - `npx tsc --noEmit -p .` → exit 0, no errors.
  - Commit: `9484f61` (feat(contracts-add): add extras scoped to the selected brand).

- T4 + T5 done 2026-09-22 (inline):
  - Deleted `src/template-examples/pages/contracts-add.tsx` and `src/assets/css/contract-creation.module.css`; no remaining references (grep).
  - Menu entry `src/Layouts/MenuData.tsx:50-55` still links `/contracts-add` ("Agregar contrato").
  - `npm test` → 44/45 files, 179/180 tests pass. The one failure (`partnersRepository.test.ts` copy assertion "coordinada por Partner Demo") is pre-existing and unrelated: this branch does not touch `src/features/partners`.
  - `npx tsc --noEmit -p .` → exit 0.
  - Lint: not runnable (no ESLint config in repo; `next lint` opens its setup wizard). Pre-existing.

- T8 done 2026-09-23 (delegated writer). Files:
  - `src/features/contracts-add/hooks/useCreateContractForm.ts`: added `contractLink` (SSR-safe `window.location.origin` guard; `${origin}/reserva/${contract.token}?brandId=${Number(selectedBrandId)}`, empty string with no token) and `resetForm` (clears contract, bookingWarning, errorMsg, and every form field back to its initial value), both exposed from the hook.
  - `src/features/contracts-add/components/SuccessSection.tsx` (+ test): react-bootstrap Card/Alert/Button, theme-neutral, no expo CSS module; shows client name, the link as visible text plus a `react-qr-code` QR, a "Copiar link" button (`navigator.clipboard.writeText`, "✓ Copiado" for ~1.5s, swallows clipboard errors), "Nuevo contrato" and "Ir a contratos" buttons; `bookingWarning` renders as an inline warning `Alert`.
  - `src/features/contracts-add/pages/CreateContractPage.tsx`: removed the auto-redirect `useEffect`; the component now renders `SuccessSection` instead of the form whenever `vm.contract` is set, and dropped the now-unreachable inline booking-warning Alert from the form branch.
  - `src/features/contracts-add/hooks/__tests__/useCreateContractForm.test.ts`: new "success state" describe block (no link before a contract, link built from token + brand, `resetForm` clears every field).
  - `src/features/contracts-add/pages/__tests__/CreateContractPage.test.tsx`: replaced the two auto-redirect/holding-warning tests with success-view tests (no auto-navigate, link/QR shown, "Nuevo contrato" calls `resetForm`, "Ir a contratos" navigates, warning visible inside the success view).
  - RED: 3 new hook assertions failed (`contractLink`/`resetForm` undefined) against pre-T8 code; new `SuccessSection` test failed on missing import; updated page test failed because the old code still auto-pushed to `/contracts`.
  - GREEN: `npx vitest run src/features/contracts-add` → 9 files, 42 tests passed.
  - `npx tsc --noEmit -p .` → exit 0, no errors.
  - Commit: `0682b9f` (feat(contracts-add): show a success view with the reservation link).

- T9 done 2026-09-23 (inline): RED 3 hook tests (phone sanitization, 10-digit phone, malformed email) → GREEN `npx vitest run src/features/contracts-add` 9 files / 45 tests; `tsc` exit 0.

- T10 done 2026-09-23 (delegated writer). Files:
  - `src/features/contracts-add/hooks/useCreateContractForm.ts`: new `endDate` state; an effect (keyed on `eventDate`, using a `previousEventDateRef` to tell "still following the start date" apart from "user picked their own") sets `endDate = eventDate` when it was following or would now precede the start date, otherwise keeps the user's choice; `applyAllDay` also sets `endDate = eventDate`; `resetForm` clears `endDate` and the ref; `handleSubmit` passes `endDate` to both `validateCreateContractForm` and `buildExactBookingPayload`; `endDate`/`setEndDate` exposed.
  - `src/features/contracts-add/utils/validation.ts`: `endDate` added to the input type and required; the start/end comparison now compares full `eventDate+startTime` vs `endDate+endTime` strings instead of same-day `startTime >= endTime`. Kept the existing message ("La hora de inicio debe ser anterior a la hora de fin.") — least churn, no behavior-visible reason to change wording.
  - `src/features/contracts-add/utils/booking.ts`: `buildExactBookingPayload` takes `endDate`; `serviceEndsAt` now builds from `${endDate}T${endTime}` (was `${eventDate}T${endTime}`); `eventDate` stays the start date; updated the doc comment that claimed no next-day rollover was needed.
  - `src/features/contracts-add/components/ScheduleSection.tsx`: added "Fecha fin" date input (`min` = start date) next to "Fin"; start date label renamed "Fecha" → "Fecha inicio" for clarity now that there are two dates.
  - `src/features/contracts-add/pages/CreateContractPage.tsx`: passes `endDate`/`onEndDateChange` to `ScheduleSection`.
  - Tests: hook gained an "end date" describe block (follows start, keeps a manual pick as start moves earlier, clamps when start moves past it, all-day sets `endDate = eventDate`), an overnight-booking submit test (24th 23:00 → 25th 03:00 Mexico City ⇒ `serviceStartsAt` `2026-09-25T05:00:00.000Z`, `serviceEndsAt` `2026-09-25T09:00:00.000Z`), and an end-before-start-across-dates validation test; `ScheduleSection` test updated with `endDate`/`onEndDateChange` props plus a new "Fecha fin" min/change test; `CreateContractPage` test's mocked hook state gained `endDate`/`setEndDate`.
  - RED: 6 new/changed hook assertions failed (`setEndDate is not a function`, `endDate` undefined) and 1 new `ScheduleSection` assertion failed (`getByLabelText("Fecha fin")` not found) against pre-T10 code.
  - GREEN: `npx vitest run src/features/contracts-add` → 9 files, 52 tests passed.
  - `npx tsc --noEmit -p .` → exit 0, no errors.
  - Commit: `dc7f6ee` (feat(contracts-add): support events that cross midnight).

- T11 done 2026-09-23 (delegated writer). Files:
  - `src/shared/scheduling/mapsUrl.ts` (new): extracted `validMapsUrl` (http/https URL with a hostname; empty string is valid — the field is optional) out of `src/features/booking-agenda/components/hooks/useBookingForm.ts`, which had it as an unexported local function with no test coverage of its own. `useBookingForm.ts` now imports it from the shared location instead of defining it locally — behavior unchanged, confirmed by `npx vitest run src/features/booking-agenda` (17 files / 53 tests, all passing).
  - `src/features/contracts-add/utils/validation.ts`: `mapsUrl` added to the input type; `if (!validMapsUrl(mapsUrl)) return "Ingresa una URL de Maps válida.";` added after the start/end time check.
  - `src/features/contracts-add/utils/booking.ts`: `buildExactBookingPayload` takes an optional `mapsUrl` and includes it in the payload only when truthy, same pattern as `venueName`.
  - `src/features/contracts-add/hooks/useCreateContractForm.ts`: new `mapsUrl` state (`setMapsUrl` exposed), passed to validation and to `buildExactBookingPayload` as `mapsUrl.trim() || undefined`; cleared by `resetForm`.
  - `src/features/contracts-add/components/ScheduleSection.tsx`: new "URL de Google Maps (opcional)" `type="url"` input next to "Lugar", placeholder `https://maps.google.com/...`.
  - `src/features/contracts-add/pages/CreateContractPage.tsx`: passes `mapsUrl`/`onMapsUrlChange` to `ScheduleSection`.
  - Tests: hook gained 3 submit-flow tests (valid trimmed URL sent, empty omitted, invalid rejected before `generateContract`); `ScheduleSection` test gained a Maps URL input-change test (all 3 existing renders updated with the new required props); `CreateContractPage` test's mocked hook state gained `mapsUrl`/`setMapsUrl`.
  - RED: 2 of the 3 new hook assertions failed (`setMapsUrl is not a function`; the "empty omitted" case already passed coincidentally, since the field didn't exist yet) and 1 new `ScheduleSection` assertion failed (`getByLabelText("URL de Google Maps")` not found) against pre-T11 code.
  - GREEN: `npx vitest run src/features/contracts-add` → 9 files, 56 tests passed.
  - `npx tsc --noEmit -p .` → exit 0, no errors.
  - Commit: `1fe4cba` (feat(contracts-add): add optional Google Maps URL to the booking).

## Next step
All tasks done. User tests the page in the browser; then open the single PR from `feat/contract-add-page` (user decision).
