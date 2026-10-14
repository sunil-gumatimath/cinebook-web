# CineBook — Frontend

React 19 + TypeScript frontend for the **Movie Ticket Booking System** Spring Boot API.

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

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

The dev server proxies `/api/*` to `http://localhost:8080` (see `vite.config.ts`), so start the
Spring Boot backend before logging in. Override with `VITE_API_BASE_URL` in `.env.local` if your
backend runs elsewhere.

```bash
npm run build    # typecheck (tsc -b) + production build
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Project structure

```
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
├── store/
│   └── auth.store.ts     # Zustand session + role helpers
├── hooks/                # TanStack Query hooks (one per feature)
├── lib/
│   ├── config.ts         # API base URL, app name
│   ├── query-keys.ts     # centralized query key factory
│   └── utils.ts          # cn()
├── components/
│   ├── ui/               # shadcn/ui components (owned code, edit freely)
│   ├── layout/           # AppShell / nav
│   └── features/         # feature components (movies, booking, admin)
└── routes/               # router + role guards + pages
```

## Roles and route guards

The API has three roles: `USER`, `THEATER_OWNER`, `ADMIN`.

`RequireAuth` (`src/routes/RequireAuth.tsx`) protects routes and preserves the attempted path so
login can redirect back:

```tsx
// any authenticated user
{ element: <RequireAuth />, children: [...] }

// theater owners only
{ element: <RequireAuth roles={['THEATER_OWNER']} />, children: [...] }

// admins only
{ element: <RequireAuth roles={['ADMIN']} />, children: [...] }
```

## API notes

- `apiClient` attaches `Authorization: Bearer <token>` for every request except `/register` and
  `/login`.
- Any `401` clears the stored session automatically.
- Errors are thrown as `ApiError` with helpers: `.isUnauthorized`, `.isForbidden`,
  `.isValidationError`, `.isConflict`, and a normalized `.message`.

## Current status

- ✅ Typed API client covering all 17 backend endpoints
- ✅ JWT auth store with persistence and role helpers
- ✅ Role-based routing and guards
- ✅ Login page (RHF + Zod) and app shell
- ⬜ Feature screens (movies catalog, seat-selection grid, admin tables) are still stubs —
      placeholder components live in `src/routes/PlaceholderPage.tsx`

## Optional: generate types from Swagger

The backend exposes `/v3/api-docs`. Once `openapi-typescript` supports TypeScript 6, you can
generate fully typed clients instead of maintaining `types/api.ts` by hand:

```bash
npx openapi-typescript http://localhost:8080/v3/api-docs -o src/types/schema.d.ts
```
