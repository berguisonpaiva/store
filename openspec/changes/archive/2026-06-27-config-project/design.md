## Context

The `store` repository is empty apart from `.claude/` and `openspec/`. There is no `package.json`, lockfile, or app code. Before any feature module can be built, the repo needs a standardized monorepo foundation. The project standard (the `config-project` skill) defines this foundation as a TurboRepo monorepo with a Next.js frontend and a NestJS (Fastify) backend, bootstrapped idempotently and driven by `skills.config.json`. This design records the architectural decisions for that bootstrap so the `tasks.md` implementation is unambiguous.

## Goals / Non-Goals

**Goals:**

- A reproducible, idempotent bootstrap that turns an empty (or partial) repo into a working TurboRepo monorepo.
- A clean apps split: `apps/web` (Next.js) and `apps/backend` (NestJS + Fastify), with no app-internal git.
- Package-manager-agnostic generation (Bun → pnpm → npm) driven by detection.
- Per-app Docker, backend Scalar/Swagger API docs, and an evals base — all wired into the standardized `build`/`test` Turbo tasks.

**Non-Goals:**

- No business modules, domain logic, or feature screens (those are separate later changes).
- No CI/CD pipeline definition, deployment infra, or cloud provisioning.
- No database schema/Prisma setup (handled by the dedicated `config-prisma` change).
- No authentication or shared-backend layer (handled by `config-shared-backend`).

## Decisions

### Decision: Bootstrap via `npx create-turbo@latest`, then reconcile

Use the official TurboRepo generator for the base, then layer/reconcile our app conventions on top.

- **Why**: The generator stays current with Turbo best practices; reconciling avoids re-implementing scaffolding logic.
- **Alternative considered**: Hand-authoring `package.json`/`turbo.json` from scratch — rejected as brittle and drift-prone.
- **Constraint**: Never clobber existing files; if a partial layout exists, only fill gaps.

### Decision: Detect package manager, never hardcode

Resolve the manager from `packageManager`/lockfile with precedence Bun → pnpm → npm, and template every generated script with the resolved manager.

- **Why**: The repo may already commit to a manager; generated scripts must match it to avoid mixed lockfiles.
- **Alternative considered**: Default to npm always — rejected; loses Bun/pnpm performance and creates inconsistent commands.

### Decision: Idempotency anchored in `skills.config.json`

Persist applied setup state in `skills.config.json`; each step checks state and reconciles. Allow CLI flags to override config values per run.

- **Why**: The bootstrap must be safe to re-run as the project evolves; explicit state beats inferring from the filesystem alone.
- **Alternative considered**: Pure filesystem inference — rejected as ambiguous for partially-completed steps.

### Decision: NestJS with the Fastify adapter

Configure the backend on Fastify rather than the default Express adapter.

- **Why**: Higher throughput/lower overhead; matches the project standard and the Scalar/Swagger setup expected downstream.

### Decision: Per-app Docker + Compose

Each app owns its Dockerfile; a Compose file wires them for local orchestration.

- **Why**: Apps deploy independently; per-app Dockerfiles keep build contexts small and images decoupled.

### Decision: API docs via Scalar/Swagger from the NestJS OpenAPI document

Generate the OpenAPI document with `@nestjs/swagger` and render it through Scalar.

- **Why**: Single source of truth (decorators) drives an interactive UI; Scalar gives a modern docs experience over the same OpenAPI document.

## Risks / Trade-offs

- **Existing files could be overwritten by the generator** → Run reconciliation logic; back off / skip when target files already exist; treat re-runs as non-destructive.
- **Package-manager mismatch (e.g. Bun lockfile but npm scripts)** → Single detection step is the source of truth for all templated scripts; fail fast if detection is ambiguous.
- **Fastify adapter incompatibility with a NestJS/plugin version** → Pin compatible versions during scaffold and verify the backend boots before completing.
- **Idempotency drift if `skills.config.json` and filesystem disagree** → Each step validates both config state and actual files before acting.
- **Network dependency on `npx create-turbo@latest`** → Document the dependency; the step is the only one requiring network at scaffold time.

## Migration Plan

This is a greenfield bootstrap, so "migration" is the initial application:

1. Detect package manager (or read override).
2. Scaffold/reconcile the TurboRepo base.
3. Add/reconcile `apps/web` and `apps/backend`.
4. Standardize `turbo.json` `build`/`test` tasks and root scripts.
5. Add per-app Docker + Compose, backend Scalar/Swagger, and the evals base.
6. Record applied state in `skills.config.json`.

Rollback: because steps are reconcile-only and non-destructive, rollback is removing the generated files/dirs; the repo returns to its prior (empty) state.

## Open Questions (Resolved during apply)

- **Package manager** → Detection selected **Bun 1.3.14** (present in the environment); the root `package.json` pins `packageManager: "bun@1.3.14"` and all generated scripts/installs use Bun. No CLI override was needed.
- **Evals base** → The standard's evals base is the skill's own `evals/evals.json` (prompts + objective checks); no separate project-level evals directory is scaffolded into the generated app. Specs reconciled accordingly.

## Implementation Notes (discovered during apply)

- The frontend app path is **`apps/web`** (the skill's default), not `apps/frontend` as originally drafted; artifacts were reconciled to `apps/web`.
- **Missing dependency fix**: Scalar's Fastify integration (`apiReference({ withFastify: true })`) requires `@fastify/static`, which the bootstrap script does not install — the generated backend crashed on boot until it was added (`bun add @fastify/static`). A follow-up task was filed to add this to the `config-project` script.
