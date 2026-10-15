# CineBook — Frontend

React 19 + TypeScript frontend for the **Movie Ticket Booking System** Spring Boot API.

> **Backend (Spring Boot 3 API):** [`sunil-gumatimath/movie-ticket-booking-system`](https://github.com/sunil-gumatimath/movie-ticket-booking-system) — Java 17, MySQL, JWT, Swagger UI (/v3/api-docs).

> **Workspace:** this repository is the frontend half of the CineBook monorepo. The
> [root README](../README.md) covers the full Docker stack (MySQL + API + SPA), environment
> variables, and service URLs.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript 6 (`strict`, `noUncheckedIndexedAccess`) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui (Radix primitives — components live in `src/components/ui`) |
| Server state | TanStack Query v5 |
| Tables | TanStack Table |
| Client state | Zustand (persisted to `localStorage`) |
| Routing | React Router v7 (`createBrowserRouter`) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Lint / typecheck | oxlint + `tsc -b` |
| CI | GitHub Actions — lint, typecheck, build, container smoke test |

## Related repositories

| Repo | Role | Link |
|------|------|------|
| `movie-ticket-booking-system` | Spring Boot 3 REST API (Java 17, MySQL, JWT, Swagger) | https://github.com/sunil-gumatimath/movie-ticket-booking-system |
| `cinebook-web` (this) | React 19 + TypeScript SPA (Vite, Tailwind, shadcn/ui) | https://github.com/sunil-gumatimath/cinebook-web |

## Getting started

### Option A — run the whole stack with Docker

From the parent directory that contains both repos (see the [root README](../README.md)):

```bash
cp .env.example .env    # then set JWT_SECRET
docker compose up --build
```

Serves the production build through nginx on http://localhost:5173, proxying `/api` to the
backend container.

### Option B — local development

```bash
npm install
npm run dev      # http://localhost:5173
```

The dev server proxies `/api/*` to `http://localhost:8080` (see `vite.config.ts`), so start the
Spring Boot backend before logging in. Clone + run the API from
[`movie-ticket-booking-system`](https://github.com/sunil-gumatimath/movie-ticket-booking-system)
first. Override with `VITE_API_BASE_URL` in `.env.local` if your backend runs elsewhere.

```bash
npm run build      # typecheck (tsc -b) + production build
npm run preview    # serve the production build
npm run lint       # oxlint
npm run typecheck  # tsc -b only
```

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request:

1. `npm ci` → `npm run lint` → `npm run typecheck` → `npm run build`
2. Builds the runtime container image and smoke-tests that nginx serves the SPA.

## Docker

`Dockerfile` is a multi-stage build: `node:24-alpine` runs `npm ci` and `vite build`, then the
output is copied into `nginxinc/nginx-unprivileged:1.27-alpine`. The unprivileged image runs as a
non-root user (uid 101) and listens on **8080**, so no privileged port or extra capability is
needed. nginx serves the SPA with a history-API fallback (required by React Router's
`BrowserRouter`) and proxies `/api`, `/swagger-ui` and `/v3/api-docs` to the backend, so the
browser stays on a single origin, and it applies security headers plus a strict Content-Security
Policy to the SPA routes (the Swagger proxy locations are exempt, since Swagger UI needs an inline
bootstrap script). Because that CSP forbids inline scripts, the persisted theme is applied before
paint by the same-origin `public/theme-init.js` instead of an inline `<script>`.

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build; `VITE_API_BASE_URL` is a build arg; runtime is non-root nginx on 8080 |
| `nginx.conf.template` | SPA fallback, `/api` rewrite, security headers/CSP, asset caching, gzip |
| `.dockerignore` | Keeps host `node_modules` and `dist` out of the build context |

```bash
docker build -t cinebook-web .
docker run -p 5173:8080 -e API_HOST=host.docker.internal -e API_PORT=8080 cinebook-web
```

## Project structure

```
public/
└── theme-init.js         # pre-paint theme bootstrap (CSP-safe — no inline script)
src/
├── api/                  # typed HTTP layer
│   ├── client.ts         # fetch wrapper: JWT header, ApiError, query params
│   ├── auth.api.ts       # /register, /login, /users/{userId}
│   ├── movies.api.ts     # /movies/**  (admin CRUD + lookup)
│   ├── theaters.api.ts   # /theater/**, /screen, /**/shows
│   ├── feedback.api.ts   # /movies/{id}/feedback
│   ├── token.storage.ts  # localStorage persistence
│   └── index.ts          # barrel export
├── types/
│   └── api.ts            # TS mirrors of the Java DTOs and enums
├── store/                # Zustand stores (persisted)
│   ├── auth.store.ts     # session + role helpers
│   ├── recent.store.ts   # recently created/opened entity IDs
│   └── network.store.ts  # online/offline status
├── hooks/                # shared hooks (e.g. the useLogin mutation)
├── lib/
│   ├── config.ts         # API base URL, app name
│   ├── lazy.ts           # lazyWithRetry() — reload once on a stale chunk
│   ├── query-keys.ts     # centralized query key factory
│   ├── queryClient.ts    # QueryClient with shared defaults
│   ├── date.ts           # date/time formatting
│   ├── duration.ts       # ISO-8601 duration parse/format
│   ├── labels.ts         # enum → display label maps
│   ├── navigation.ts     # navigateTo() bridge for the router (usable outside React)
│   ├── auth-routing.ts   # post-login redirect resolution by role
│   ├── title.ts          # document title helper
│   └── utils.ts          # cn()
├── components/
│   ├── ui/               # shadcn/ui components (owned code, edit freely)
│   ├── layout/           # AppLayout, ErrorBoundary, RouteErrorElement, CommandPalette, ...
│   └── features/         # feature components
│       ├── admin/        # Admin console panels (create/manage/table)
│       └── owner/        # Owner screens: add-screen form, scheduler, seat map
└── routes/               # router + role guards + feature pages
```

Route-level components are code-split with `lazyWithRetry` (see `src/lib/lazy.ts`), and a
`ErrorBoundary` wraps the outlet — plus a router-level `errorElement` — so a failed render or a
stale chunk surfaces a recovery UI instead of a blank page.

## Roles and route guards

The API has three roles: `ROLE_USER`, `ROLE_THEATER_OWNER`, and `ROLE_ADMIN`. The `role` JWT claim
and the `UserRole` type use these full `ROLE_`-prefixed names.

`RequireAuth` (`src/routes/RequireAuth.tsx`) protects routes and preserves the attempted path so
login can redirect back:

```tsx
// any authenticated user
{ element: <RequireAuth />, children: [...] }

// theater owners only
{ element: <RequireAuth roles={['ROLE_THEATER_OWNER']} />, children: [...] }

// admins only
{ element: <RequireAuth roles={['ROLE_ADMIN']} />, children: [...] }
```

## API notes

- `apiClient` attaches `Authorization: Bearer <token>` for every request except `/register` and
  `/login`.
- Any `401` clears the stored session automatically and redirects to `/login` once — the
  session-expired toast fires only on the authenticated → anonymous transition, so concurrent
  requests can't spam it.
- Errors are thrown as `ApiError` with helpers: `.isUnauthorized`, `.isForbidden`,
  `.isValidationError`, `.isConflict`, and a normalized `.message`.

## Current status

- ✅ Typed API client covering all 17 backend endpoints
- ✅ JWT auth store with persistence and role helpers
- ✅ Role-based routing and guards
- ✅ Registration and login (RHF + Zod), plus an app shell with command palette and theming
- ✅ Feature pages: movies catalog, movie detail + feedback, theater/screen detail, owner
      dashboard (theaters, screens, shows), admin movie management, and profile
- ✅ Route-level code splitting with stale-chunk recovery, plus an error boundary and router
      `errorElement` so failures render a recovery UI
- ⬜ Ticket booking and seat reservation await backend booking endpoints
- ⬜ Catalog/showtime/screen listing uses ID-based fallbacks where the API lacks list routes

## Optional: generate types from Swagger

The backend exposes `/v3/api-docs`. Once `openapi-typescript` supports TypeScript 6, you can
generate fully typed clients instead of maintaining `types/api.ts` by hand:

```bash
npx openapi-typescript http://localhost:8080/v3/api-docs -o src/types/schema.d.ts
```
