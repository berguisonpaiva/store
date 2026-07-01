## Context

The backend is NestJS on Fastify (`/api` prefix, Scalar `/docs`, Swagger `/swagger`) with a shared layer already produced by `config-shared-backend`: `JwtGuard`, `JwtStrategy`, `@Public`, `@CurrentUser`, `JwtPayload`, `AuthenticatedRequest`, `ApiExceptionFilter`, and `AuthenticatedUser` in `packages/shared`. There is **no Prisma** yet and **no role-based guard**. The single domain package **`@repo/auth`** at `modules/auth` (from `auth-users-domain`, with aggregates `user` + `auth`) defines the use cases, ports (`UserRepository`, `UserReader`, `UserQuery`, `HashGenerator`, `HashComparer`, `TokenService`), domain errors (stable string codes via `UserError`/`AuthError`), and treats tokens as opaque strings and the password hash as a VO.

This change is **backend only**: it makes the domain reachable and persistent. All business rules stay in the domain; the backend only adapts infrastructure and presentation.

## Goals / Non-Goals

**Goals:**

- Stand up Prisma (`config-prisma`) with the password hash in a **separate `UserPassword` table** (1:1 with `User`).
- Implement the domain ports: `UsersPrismaRepository`, `BcryptHashGenerator`, `BcryptHashComparer`, `JwtTokenService` (access + refresh).
- Add `RolesGuard` + `@Papeis(...UserRole)` to the shared layer.
- Expose auth and users REST endpoints, documented with OpenAPI, mapping domain error codes to HTTP status.
- Wire `AuthModule` + `UsersModule` via DI, composing domain use cases with adapters.
- **Build every artifact with its skill** (see "Skills to use").
- Keep zero business rules in controllers/adapters; DB constraints are only a redundant safety net.

**Non-Goals:**

- No web/mobile. No changes to domain rules (only consume the `@repo/auth` package).
- No permission/ACL system beyond role checks (MASTER/ADMIN/OPERADOR).
- No client (customer) identity — staff only, MVP 1.

## Decisions

### 1. Prerequisite: domain change applied first

This change consumes the `@repo/auth` package (aggregates `user` + `auth`). It must be implemented and added to `apps/backend/package.json` dependencies before wiring. If absent, apply `auth-users-domain` first.

### 2. Password in a separate table (`UserPassword`)

`users.model.prisma` defines `User` (id, name, email unique-index-as-safety-net, role, active, timestamps) and `UserPassword` (userId 1:1, hash, timestamps). `UsersPrismaRepository.fromDomain` splits the aggregate across both tables; `toDomain` rejoins them into a `User` with its `HashPassword`. Writes happen inside `PrismaService.runInTransaction` so the two rows never diverge.

- Rationale: explicit product requirement ("password stored in a separate table"); also keeps the hash out of every `User` read that does not need it.

### 3. Domain decides, DB is a safety net

Per the domain design, uniqueness and the last-MASTER rule are enforced in domain policies, not SQL. The Prisma adapter exposes `findByEmail` and `countActiveByRole` as plain reads. A unique index on `email` exists only as a redundant guard; if it ever fires, the adapter maps it back to `EMAIL_ALREADY_IN_USE` rather than surfacing a Prisma error.

### 4. Token strategy: short access + refresh, two secrets

`JwtTokenService` uses `@nestjs/jwt`: access token signed with `JWT_SECRET` / `JWT_ACCESS_TTL` (short, e.g. 15m); refresh token signed with `JWT_REFRESH_SECRET` / `JWT_REFRESH_TTL` (long, e.g. 7d). The existing `JwtStrategy` validates access tokens (it already reads `JWT_SECRET`); its `expiresIn` in `SharedModule` is tightened to the access TTL. Refresh validation lives in `JwtTokenService`. The JWT payload stays `{ sub, name, email }` (+ `iat/exp`); role is not embedded — `RolesGuard` reads it... see Decision 6.

- Alternative considered: single token / single secret. Rejected — the domain requires a distinct refresh token, and separate secrets limit blast radius if one leaks.

### 5. Authorization: `RolesGuard` + `@Papeis`, honoring the domain spec

The domain spec explicitly names `RolesGuard` + `@Papeis(...PapelUsuario)`. We implement exactly that against the `UserRole` enum from `@repo/auth`. The `backend-controller` skill's generic `RequirePermission` pattern is a superset for future ACLs; for this MVP, role-based `@Papeis` is sufficient and matches the spec. Guards compose as `@UseGuards(JwtGuard, RolesGuard)` with `@Papeis(MASTER, ADMIN)` on restricted routes.

### 6. Where the role comes from for `RolesGuard`

The current JWT payload has no role. Two options: (a) embed `role` in the access token payload (fast, stateless) or (b) load the user by id in `RolesGuard` on each protected call. Default chosen: **embed `role` in the access-token payload** and extend `JwtPayload`/`AuthenticatedUser`-adjacent typing so `RolesGuard` reads it without a DB hit. Trade-off: a role change only takes effect on the next token; acceptable for MVP (access TTL is short). Flagged in Open Questions.

### 7. Error mapping in one place

A small mapper (or extension of `ApiExceptionFilter`) translates domain `Result` failure codes to HTTP: `EMAIL_ALREADY_IN_USE`→409, `USER_NOT_FOUND`→404, `OPERATION_NOT_ALLOWED_FOR_ROLE`→403, `INVALID_CREDENTIALS`→401, `INVALID_TOKEN`→401, `USER_INACTIVE`→403, validation errors→400. Controllers translate `result.isFailure` to the matching Nest `HttpException` via this mapper so behavior is consistent.

### 8. Module layout follows the project convention

Backend modules live at `apps/backend/src/modules/<module>` (`config-new-module` convention): `*.module.ts`, `*.controller.ts`, `*.prisma.ts` (adapters), plus DTOs and a provider wiring file binding domain use cases to adapters. Domain use cases are instantiated with injected adapters; no rule logic is added here.

## Skills to use

- `config-prisma` — Prisma infra (DbModule, PrismaService/transaction, prisma.config, compose) and per-module model onboarding (`--module users`).
- `backend-prisma-data` — `users.model.prisma` (User + UserPassword), migrations, seed, and `*.prisma.ts` repository/query adapters with `toDomain`/`fromDomain`.
- `config-shared-backend` — extend the shared layer (add `RolesGuard` + `@Papeis`); keep parity with existing JWT assets.
- `backend-controller` — auth and users controllers, Swagger docs, guard usage, `Result`→HTTP mapping.
- `config-new-module` — backend module scaffolding under `apps/backend/src/modules/*` if creating from scratch.

## Risks / Trade-offs

- [Embedding role in the token delays role-change effect until next login/refresh] → Mitigated by short access TTL; can switch `RolesGuard` to a per-request DB lookup later (Decision 6 / Open Question).
- [Two-table password write could half-commit] → Mitigated by `runInTransaction`; both rows commit or neither.
- [bcrypt cost on the request thread] → Use a sane cost factor; bcrypt is async; acceptable for staff-scale traffic.
- [Domain not yet applied] → Decision 1 makes it an explicit prerequisite; tasks start by verifying the modules/deps exist.
- [`ApiExceptionFilter` currently imports express types while bootstrap is Fastify] → Pre-existing; the error mapper avoids depending on the framework request/response shape where possible.

## Migration Plan

1. Ensure `auth-users-domain` is applied and `@repo/auth` is a backend dep.
2. Run `config-prisma` (init + `--module users`), define `User`/`UserPassword` models, generate client, create migration.
3. Implement adapters + port implementations; add `RolesGuard`/`@Papeis` to shared.
4. Build `UsersModule`/`AuthModule`, controllers, DTOs, error mapping; register in `app.module.ts`.
5. Add the MASTER seed; run migrate + seed locally; verify endpoints via `/docs`.

Rollback: drop the new modules/migration, remove the two Nest modules and shared additions; the domain modules are untouched.

## Open Questions

- Embed `role` in the access token (default) vs. per-request DB lookup in `RolesGuard`?
- Refresh rotation: issue a new refresh token on refresh, or only a new access token? Domain default is access-only — keep that here.
- Seed MASTER credentials: from env vars (`SEED_MASTER_EMAIL`/`SEED_MASTER_PASSWORD`) or fixed defaults? Default chosen: env vars with safe fallbacks for local dev.
