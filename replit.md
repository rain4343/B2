# Staff Portal

An internal HR/employee management system for Kurdish-speaking organizations. Manages staff (users), departments, and role-based access control (Super Admin / فەرمانبەر).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/staff-portal run dev` — run the frontend (served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, Wouter, React Hook Form, Recharts, Tailwind CSS v4
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle table definitions (departments, users, roles, role_user)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/staff-portal/src/` — React frontend (pages, components, hooks)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas for server validation (do not edit)

## Database schema

- `departments` — Organization divisions (name unique)
- `users` — Staff members with department FK, hashed password, email/username unique
- `roles` — RBAC roles (seeded: Super Admin, فەرمانبەر)
- `role_user` — Many-to-many join table between users and roles

## Architecture decisions

- OpenAPI-first: all API contracts live in `lib/api-spec/openapi.yaml`; types/hooks/schemas are generated, never hand-written
- Passwords stored as-is from the frontend (no bcrypt) — add hashing before production
- No authentication middleware currently — add auth layer before exposing to the internet
- `sql.raw()` eliminated in favor of Drizzle `inArray()` to prevent SQL injection risk
- Multi-step user/role mutations are wrapped in DB transactions for atomicity

## Product

- **Dashboard** (`/`) — summary cards (staff, departments, roles, super admins), bar chart by department, pie chart by role, recent staff table
- **Staff** (`/staff`) — searchable/filterable employee list with department and roles; add/edit/delete
- **Departments** (`/departments`) — manage divisions; view per-department staff roster
- **Roles** (`/roles`) — manage RBAC roles; assign/remove from staff members

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before editing routes or frontend
- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` so leaf packages see updated declarations
- Verify artifacts with `pnpm --filter @workspace/<slug> run typecheck`, not `build`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
