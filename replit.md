# Staff Portal

A full-stack staff management application built as a pnpm TypeScript monorepo.

## Architecture

### Artifacts (runnable apps)
- **`artifacts/staff-portal`** — React + Vite frontend (Staff Portal web app)
- **`artifacts/api-server`** — Node.js/Express backend API
- **`artifacts/mockup-sandbox`** — Component design sandbox (dev only)

### Shared libraries (`lib/`)
- **`lib/db`** — Drizzle ORM schema + PostgreSQL client
- **`lib/api-spec`** — OpenAPI specification (source of truth for the API contract)
- **`lib/api-zod`** — Zod schemas generated from the OpenAPI spec
- **`lib/api-client-react`** — React Query hooks generated from the OpenAPI spec

## Tech Stack
- **Frontend:** React 19, Vite 7, Tailwind CSS v4, Wouter, TanStack Query, Radix UI
- **Backend:** Node.js, Express 5, TypeScript
- **Database:** PostgreSQL via Drizzle ORM
- **API codegen:** OpenAPI + Orval

## Running Locally

Both services start automatically via Replit workflows:

| Service      | Workflow     | Port  |
|--------------|--------------|-------|
| Staff Portal | Staff Portal | 24027 |
| API Server   | API Server   | 8080  |

## Database

Replit's built-in PostgreSQL is used. The `DATABASE_URL` environment variable is managed automatically.

To push schema changes to the database:
```bash
pnpm --filter @workspace/db run push
```

## API Codegen

After changing `lib/api-spec/openapi.yaml`, regenerate client code:
```bash
pnpm run --filter @workspace/api-spec codegen
```

## Environment Variables

| Variable        | Description                    | Source          |
|-----------------|--------------------------------|-----------------|
| `DATABASE_URL`  | PostgreSQL connection string   | Replit managed  |
| `SESSION_SECRET`| Express session secret         | Replit secret   |
| `PORT`          | Server port                    | Replit managed  |

## User Preferences
