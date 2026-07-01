## Why

The `store` repository is currently empty (no app code, no `package.json`, no monorepo tooling) and needs a standardized foundation before any feature work can begin. Bootstrapping a TurboRepo monorepo with a Next.js frontend and a NestJS (Fastify) backend in a single, idempotent, repeatable step removes per-project setup drift and lets every later change build on a known structure.

## What Changes

- Initialize a **TurboRepo** monorepo in the current directory (via `npx create-turbo@latest` when no base exists), reconciling an existing partial layout instead of overwriting it.
- Add a **Next.js** app at `apps/web` (with `src/`) and a **NestJS + Fastify** app at `apps/backend` (with no app-internal git).
- Detect the package manager from `packageManager`/lockfile and standardize on **Bun → pnpm → npm** (in that detection order), using the detected manager for all generated scripts.
- Add an **idempotent setup** driven by `skills.config.json` (with CLI override) so re-running the bootstrap reconciles rather than duplicates.
- Generate **per-app Docker** assets (Dockerfile per app, compose wiring) for frontend and backend.
- Generate **API documentation** for the backend using **Scalar/Swagger** (OpenAPI).
- Maintain a **base for evals** with the bootstrap standard (lives with the skill at `.claude/skills/config-project/evals/`; not scaffolded into the generated app workspace).
- Standardize the **`test` and `build` Turbo tasks** across the workspace (`turbo.json` pipeline + root scripts).

## Capabilities

### New Capabilities

- `monorepo-scaffold`: TurboRepo base structure with `apps/web` (Next.js) and `apps/backend` (NestJS Fastify), shared workspace config, and standardized `build`/`test` Turbo tasks.
- `setup-orchestration`: Idempotent, re-runnable bootstrap driven by `skills.config.json` with CLI override and package-manager detection (Bun/pnpm/npm).
- `app-containerization`: Per-app Docker assets (Dockerfile per app + compose wiring) for frontend and backend.
- `api-documentation`: Backend OpenAPI documentation served via Scalar/Swagger.
- `eval-foundation`: Evals base (prompts + objective checks) maintained with the standard at `.claude/skills/config-project/evals/`.

### Modified Capabilities

<!-- None — this is a greenfield bootstrap; no existing specs change. -->

## Impact

- **Files/dirs created**: `package.json`, `turbo.json`, `bun.lock`, `.prettierrc`, `.dockerignore`, `docker-compose.yml`, `apps/web/**`, `apps/backend/**`, per-app `Dockerfile`, backend OpenAPI/Scalar setup (`src/core/docs`, `src/core/config`), per-app `.env`/`.env.example`, `.log/skills.log`.
- **Tooling**: TurboRepo, Next.js, NestJS, Fastify, the detected package manager (Bun/pnpm/npm), Docker.
- **Constraints**: Reconcile, never clobber, existing files; no app-internal git repos; setup must be safe to re-run.
- **Downstream**: Establishes the foundation every subsequent module/feature change depends on.
