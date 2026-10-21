## Description

Esta aplicacion es un saas para la gestion de eventos

## Architecture Overview

**Next.js 14 (Pages Router)** with TypeScript. The codebase is in the middle of a planned migration from a UI template foundation toward a feature-driven architecture. See `tech.md` for the full migration plan.

### Routing

Uses the **Pages Router** (`src/pages/`). The router is intentionally "closed" — only routes in the whitelist below should exist in `src/pages/`. Anything else should return 404.

**Whitelisted routes:**

- Public: `/login`, `/reserva/[token]`, `/sales`, `/story`
- Private: `/` (redirects to `/contracts`), `/contracts`, `/contracts/new`, `/contracts/[sku]`, `/products`, `/packages`, `/terms`, `/promotions`, `/providers` (with `new`/`[id]` sub-routes), `/brand-manual`

Legacy URL prefixes (`/pages/*`, `/application/*`) are maintained via redirects in `next.config.js` for backwards compatibility.

### State Management (hybrid)

- **Redux Toolkit** (`src/toolkit/`) — legacy; handles theme/layout, auth user info, calendar, chat, e-commerce slices. Configured with `next-redux-wrapper` for SSR.
- **Zustand** (`src/stores/`) — modern replacement; currently `authStore.ts` with localStorage persistence. Prefer Zustand for new state.

### API Layer

Two Axios instances in `src/api/axiosConfig.ts`:

- `axiosInstanceWithToken` — auto-injects `Authorization: Bearer <token>` from localStorage; on 401 clears auth and redirects to `/login`.
- `axiosInstanceWithoutToken` — for public endpoints.

Base URL: `process.env.NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000`).

Service files live in `src/api/services/` (one per domain). There is also a Fetch-based wrapper at `src/lib/api.ts` used by the booking feature.

### Code Organization (target structure per `tech.md`)

- `src/pages/` — thin route entrypoints only; import from `features/`
- `src/features/<domain>/` — domain logic: `pages/`, `components/`, `services/`, `types.ts`
- `src/shared/` — cross-feature utilities: layouts, forms, UI components, hooks, utils
- `src/views/` — legacy implementations being migrated to `features/`
- `src/Common/` — common components and static data from the template

When adding new code: prefer `src/features/<domain>/` for domain-specific code and `src/shared/` for reusable pieces. Avoid adding to `src/views/` (it is being phased out).

### Styling

Global SCSS entry point: `src/assets/scss/custom.scss` (imported in `_app.tsx`). Bootstrap 5.3 variables are customized via `src/assets/scss/settings/_bootstrap-variables.scss`. Component-scoped styles use CSS Modules (`*.module.css`).

### TypeScript Path Aliases

Defined in `tsconfig.json`:

- `@pages/*` → `src/pages/`
- `@assets/*` → `src/assets/`
- `@layout/*` → `src/Layouts/`
- `@common/*` → `src/Common/`
- `@shared/*` → `src/shared/`
- `@slices/*` → `src/slices/`
- `@views/*` → `src/views/`
- `@helpers/*` → `src/helpers/`

### Environment Variables

- `NEXT_PUBLIC_API_URL` — backend API base URL
- Image optimization is configured for Supabase Storage domains in `next.config.js`

Copy `.env.local.example` to `.env.local` for local development.
