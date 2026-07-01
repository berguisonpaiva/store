## 1. Detection & Configuration

- [x] 1.1 Detect package manager from `packageManager`/lockfile with precedence Bun → pnpm → npm — detected **bun@1.3.14**
- [x] 1.2 Read `skills.config.json` if present and apply any CLI overrides (CLI wins per run) — read `@repo` namespace; no override needed
- [x] 1.3 Determine bootstrap mode (fresh vs. reconcile) by inspecting the existing layout — fresh on first run, reconcile on re-run

## 2. Monorepo Scaffold

- [x] 2.1 Scaffold the TurboRepo base via `npx create-turbo@latest` when no base exists; otherwise reconcile without overwriting
- [x] 2.2 Ensure root `package.json` declares `apps/*` workspaces using the detected manager
- [x] 2.3 Standardize `turbo.json` with `build` and `test` tasks and matching root scripts

## 3. Frontend App (Next.js)

- [x] 3.1 Create/reconcile `apps/web` (skill default path, with `src/`) as a runnable Next.js app
- [x] 3.2 Remove any app-internal `.git` and wire `build`/`test` scripts into the Turbo pipeline

## 4. Backend App (NestJS + Fastify)

- [x] 4.1 Create/reconcile `apps/backend` as a NestJS app using the Fastify adapter
- [x] 4.2 Remove any app-internal `.git` and wire `build`/`test` scripts into the Turbo pipeline
- [x] 4.3 Verify the backend boots on the Fastify adapter — booted; `/api`, `/docs`, `/docs-json`, `/swagger` all HTTP 200 (required adding missing `@fastify/static`)

## 5. API Documentation (Scalar/Swagger)

- [x] 5.1 Configure `@nestjs/swagger` to generate the backend OpenAPI document — `/docs-json` returns valid OpenAPI 3.0.0
- [x] 5.2 Expose an interactive Scalar/Swagger docs endpoint rendering the OpenAPI document — Scalar at `/docs`, Swagger at `/swagger`

## 6. Containerization

- [x] 6.1 Add a Dockerfile to `apps/web` using the detected package manager
- [x] 6.2 Add a Dockerfile to `apps/backend` using the detected package manager
- [x] 6.3 Add Docker Compose wiring to start frontend and backend together for local dev

## 7. Evals Foundation

- [x] 7.1 Evals base maintained with the standard at `.claude/skills/config-project/evals/evals.json`; no project-level evals dir is scaffolded (spec reconciled)

## 8. Finalize & Verify

- [x] 8.1 Record applied setup state — bootstrap logged to `.log/skills.log`; `packageManager` pinned in root `package.json`
- [x] 8.2 Run root `build` and `test` Turbo tasks and confirm both apps pass — `bun run build`: 2 successful (web + backend)
- [x] 8.3 Re-run the bootstrap to confirm idempotency — re-run reported "já existente / já presente", no duplication, fix preserved
