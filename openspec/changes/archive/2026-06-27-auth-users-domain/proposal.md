## Why

The store needs staff identity and access control (master / admin / operador) before any protected feature can be built, but there is no user or authentication logic yet. This change introduces the **business rules only** — domain modules under `modules/*` — for managing staff users and authenticating them, with no backend (NestJS), web, or mobile wiring. It establishes the contracts (entities, value objects, use cases, ports, domain errors) that the future API and clients will consume.

## What Changes

- Add a self-contained **`users`** domain module (aggregate `User`): name, email, password hash, role (`UserRole`), active flag.
- Add a **`UserRole`** enum: `MASTER`, `ADMIN`, `OPERADOR` (operates the cash register / sales).
- Add user **commands** as use cases: create-user, update-user, activate-user / deactivate-user, change-password.
- Add user **queries** as use cases: list-users (paginated, filter by role/active), find-user-by-id.
- Add user **ports**: `UsersRepository`, `HashGenerator`.
- Enforce user **invariants**: unique email, password always stored as a hash, only MASTER/ADMIN create users or change roles, cannot deactivate the last active MASTER.
- Add an **`auth`** domain module that authenticates and authorizes staff: login (email + password → access token + refresh token) and refresh-token use cases, plus token validation.
- Add auth **ports**: `TokenService` (generate/validate JWT), `HashComparer` (compare password vs. hash), and a read port over `User` (find by email) exposed by `users`.
- Enforce auth **invariants**: credentials validated against `User`; inactive users cannot authenticate; short access token + refresh token; invalid credentials return a generic error that does not reveal whether the email exists.
- Add domain **errors**: `EmailAlreadyInUse`, `UserNotFound`, `OperationNotAllowedForRole` (users); `InvalidCredentials`, `InvalidToken`, `UserInactive` (auth).
- **Out of scope** (future changes): presentation guards (`JwtAuthGuard`, `RolesGuard` + `@Papeis` decorator), persistence/Prisma (password stored in a separate DB table), HTTP controllers, and any UI.

## Capabilities

### New Capabilities

- `user-management`: The `users` domain module — `User` aggregate, `UserRole` enum, create/update/activate/deactivate/change-password commands, list/find queries, `UsersRepository` + `HashGenerator` ports, invariants, and domain errors. Self-contained; consumed by `auth`.
- `staff-authentication`: The `auth` domain module — login and refresh-token use cases plus token validation, `TokenService` + `HashComparer` ports and a user read port, invariants, and domain errors. Depends on `user-management`.

### Modified Capabilities

<!-- None — these are new domain modules; no existing spec requirements change. -->

## Impact

- **Dirs created**: `modules/users/**`, `modules/auth/**` (each with `src/<aggregate>/{model,provider,use-case,dto}`, `src/index.ts`, and `test/**`), following the `module-aggregate` scaffold convention.
- **Reused from `packages/shared`**: `Entity`, `Result`, `UseCase`, `CrudRepository`, `PaginatedInputDTO`/`PaginatedResultDTO`, and value objects `Email`, `PersonName`, `StrongPassword`, `HashPassword`, `Id`.
- **Dependencies**: `users` has none (autocontido). `auth` depends on `users` via a read port.
- **Downstream**: The future backend module will provide the persistence adapters (with the password hash in a separate table), the `TokenService`/`HashComparer`/`HashGenerator` infrastructure implementations, and the presentation guards that consume these contracts.
- **No runtime tech added**: pure TypeScript domain logic; no HTTP, DB, or framework code.
