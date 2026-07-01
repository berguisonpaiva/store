## Why

The `auth-users-domain` change delivers pure business rules (entities, value objects, use cases, ports, domain errors) for staff users and authentication, but nothing is reachable over HTTP and nothing is persisted. This change wires that domain into the **NestJS + Fastify backend**: persistence (Prisma, with the password hash in a separate table), concrete implementations of the domain ports, the presentation guards, and the REST endpoints — so the staff identity/auth contract becomes a usable API. No web or mobile work is included.

## What Changes

- **Prisma infrastructure** (via `config-prisma`): `DbModule` + `PrismaService` (implementing `TransactionManager`/`runInTransaction`), `prisma.config.ts`, Docker Compose, and a `users.model.prisma` with **two tables** — `User` and a separate `UserPassword` (1:1) so the password hash lives in its own table.
- **Persistence adapters** (`backend-prisma-data`): `UserPrismaRepository` implementing the domain `UserRepository` (from `@repo/auth`, including `findByEmail`, `countActiveByRole`) with `toDomain`/`fromDomain` mapping across the `User` + `UserPassword` tables inside a transaction; a `UserPrismaQuery` adapter implementing the domain `UserQuery` for `list-users` (paginated, role/active filters); `find-user-by-id` via the repository.
- **Port implementations**: `BcryptHashGenerator` (`HashGenerator`), `BcryptHashComparer` (`HashComparer`), and `JwtTokenService` (`TokenService`) issuing a **short-lived access token + a refresh token** via `@nestjs/jwt`.
- **Presentation guards**: add `RolesGuard` + `@Papeis(...UserRole)` decorator to the backend shared layer (the `JwtGuard`/`JwtStrategy`/`@Public`/`@CurrentUser` already exist), so role-restricted routes are enforced.
- **Auth endpoints** (`backend-controller`): `POST /api/auth/login`, `POST /api/auth/refresh` (public), returning access + refresh tokens; orchestrate the `auth` use cases.
- **Users endpoints**: `POST /api/users`, `PATCH /api/users/:id`, `PATCH /api/users/:id/activate`, `PATCH /api/users/:id/deactivate`, `PATCH /api/users/:id/password`, `GET /api/users` (paginated/filtered), `GET /api/users/:id` — protected by `JwtGuard` + `RolesGuard`/`@Papeis` where MASTER/ADMIN is required.
- **NestJS wiring**: `AuthModule` and `UsersModule` that compose the domain use cases with the adapters via DI, registered in `app.module.ts`.
- **HTTP DTOs + Swagger/OpenAPI** docs for every endpoint (published at Scalar `/docs` and `/swagger`), with request validation (`class-validator`).
- **Domain-error → HTTP mapping**: `EMAIL_ALREADY_IN_USE`→409, `USER_NOT_FOUND`→404, `OPERATION_NOT_ALLOWED_FOR_ROLE`→403, `INVALID_CREDENTIALS`→401, `INVALID_TOKEN`→401, `USER_INACTIVE`→403.
- **Bootstrap seed**: a technical seed creating an initial active MASTER user so the system is usable on first run.
- **Out of scope**: web/mobile clients, and any change to the domain rules (this change only consumes the `@repo/auth` domain package — aggregates `user` + `auth`).

## Capabilities

### New Capabilities

- `user-management-api`: Prisma persistence (User + separate UserPassword table), repository/query adapters, the `UsersModule`, and the REST endpoints for creating, editing, activating/deactivating, changing password, listing, and fetching users — protected by role-based authorization.
- `staff-authentication-api`: `TokenService`/`HashComparer`/`HashGenerator` implementations, the `RolesGuard` + `@Papeis` decorator, the `AuthModule`, and the login/refresh endpoints with access + refresh tokens.

### Modified Capabilities

<!-- None — backend wiring of new domain modules; no existing spec requirements change. -->

## Impact

- **Depends on**: `auth-users-domain` being applied first (the `@repo/auth` package at `modules/auth`, with aggregates `user` + `auth`, must exist and be a backend dependency).
- **Dirs/files**: `apps/backend/prisma/**` (schema, models, migrations, seed), `apps/backend/src/db/**`, `apps/backend/src/modules/users/**`, `apps/backend/src/modules/auth/**`, additions to `apps/backend/src/shared/**` (`RolesGuard`, `@Papeis`), and `apps/backend/src/app.module.ts`.
- **New deps**: `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `tsx`, `bcrypt` (and `@types/bcrypt`). `@nestjs/jwt`/passport already present.
- **Config/env**: `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_TTL`.
- **Infra**: Postgres via the backend Docker Compose; migrations + seed run locally.
