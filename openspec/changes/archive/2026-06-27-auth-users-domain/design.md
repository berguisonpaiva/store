## Context

The repo is a TurboRepo monorepo with a shared domain kernel in `packages/shared` (`Entity`, `Result`, `UseCase`, `CrudRepository`, pagination DTOs, and value objects such as `Email`, `PersonName`, `StrongPassword`, `HashPassword`, `Id`). Business modules live under `modules/<module>` and are scaffolded by the `module-aggregate` skill (`node .claude/skills/module-aggregate/scripts/create-aggregate.js`). The `modules/` directory does not exist yet — this change introduces the first two modules.

This change is **domain/business-rules only**: no NestJS backend, no web, no mobile, no persistence. It delivers the contracts (entities, VOs, use cases, ports, errors) that later changes will wire to infrastructure and presentation.

## Goals / Non-Goals

**Goals:**

- Create `modules/users` (aggregate `User`) and `modules/auth` as pure TypeScript domain modules using English naming (folders/files/classes/use cases), per the `module-aggregate` convention.
- Express every functional requirement (RF-USR-01..09, RF-AUTH-01..06) as use cases returning `Result<T>`, plus ports as interfaces and domain errors as stable error codes.
- **Enforce 100% of validations and invariants in the business rules** (value objects → entities → domain services/policies → use cases). The change MUST NOT rely on the database (unique indexes, check constraints, foreign keys, triggers) to enforce any rule — there is no persistence in this change, and the future data layer must treat DB constraints only as a redundant safety net, never as the source of truth.
- Reuse `packages/shared` primitives and VOs instead of re-implementing them.
- **Always build each artifact with its corresponding skill** (see "Skills to use" below).
- Provide in-memory repository/port fakes under each module's `test/**` and unit tests for every use case and invariant.

**Non-Goals:**

- No presentation guards (`JwtAuthGuard`, `RolesGuard`) or `@Papeis` decorator — these are a future backend change.
- No persistence/Prisma, no concrete `TokenService`/`HashComparer`/`HashGenerator` implementations, no HTTP controllers, no UI.
- No client identity (cliente) — MVP 1 covers staff only.
- No actual JWT/crypto libraries inside the domain modules.

## Decisions

### 1. Single `auth` module with two aggregates (`user` + `auth`) — UPDATED

**Decision (revised during apply):** a single `modules/auth` package (`@repo/auth`) holds both aggregates: `src/user/` (staff identity: entity, repository, policies, CRUD + change-password use cases, DTOs, errors) and `src/auth/` (authentication: login/refresh/validate-token use cases, `TokenService` port, `CredentialsPolicy`, DTOs, errors). The `auth` aggregate consumes a narrow read port (`UserReader.findByEmail`) and `HashComparer` from the `user` aggregate within the same module — keeping the dependency one-directional and `auth` ignorant of user persistence details.

This matches the `module-aggregate` skill's own example (`--module auth --aggregate user`) and the user's explicit preference, and avoids a cross-package dependency.

- Alternative considered: two separate packages (`@repo/users` + `@repo/auth`). Rejected in favor of one self-contained bounded context. **Note:** the `auth-users-backend` change still references `modules/users`/`modules/auth` and `@repo/users`/`@repo/auth`; those references must be updated to the single `@repo/auth` package (aggregates `user` + `auth`) before applying it.

### 2. Reuse shared value objects; accept their stricter rules over the lightweight form rules

Map domain fields to existing VOs: name → `PersonName`, email → `Email`, password hash → `HashPassword`, ids → `Id`. Validate the plain password at the use-case boundary with `StrongPassword`.

- **Divergence (intentional):** the form spec says name "min 2 chars" and password "min 8 chars", but `PersonName` requires first+last name (≥3 chars, 2 words) and `StrongPassword` requires upper/lower/digit/symbol. We adopt the stricter shared VOs for consistency and security. This is a deliberate decision, flagged in Open Questions in case the product wants the looser rules instead.
- Alternative considered: new bespoke `UserName`/`Password` VOs matching the exact form text. Rejected to avoid duplicating shared primitives; revisit only if the product rejects the stricter rules.

### 3. Password hash is a VO inside the aggregate; the "separate table" is a data-layer concern

The `User` aggregate holds `HashPassword`. The requirement "password stored in a separate table" is a persistence decision that lives in the future data/Prisma adapter, behind `UsersRepository`. The domain contract is unaffected: `UsersRepository` persists and reads the full aggregate (including its hash); how the adapter splits storage across tables is invisible to the domain.

### 4. Password hashing happens via the `HashGenerator` port, not in the entity

Use cases (`create-user`, `change-password`) take a plain password, validate it with `StrongPassword`, then call `HashGenerator.hash(plain)` to obtain the `HashPassword` before building/updating the aggregate. The entity never sees plain text. `change-password` verifies the current password via `HashComparer` (reused from auth's port concept) or a dedicated comparison on the port — see Open Questions.

### 5. Cross-entity invariants live in domain services/policies, not in the DB

Rules that span more than one record are encoded as pure domain services/policies (`module-domain-service`: `Policy`/`Specification`), fed with domain data the use case loads through a port. The repository only *reads* the facts; the *decision* is domain code. No DB constraint participates.

- **Email uniqueness** → `UniqueEmailSpecification` (or a `checkEmailInUse` step in the use case) decides based on `UsersRepository.findByEmail`. Returns `EmailAlreadyInUse`. We do **not** depend on a unique index.
- **Last active MASTER** → `LastMasterPolicy` decides whether a deactivation/role-change is allowed, given the count/list of active MASTERs supplied by the use case via `UsersRepository.countActiveByRole(MASTER)`. Returns `OperationNotAllowedForRole`.
- **Role authorization** (MASTER/ADMIN only) → a `RoleAuthorizationPolicy` evaluates the acting user's role purely in memory.
- **Credentials/inactive** (auth) → a `CredentialsPolicy` decides login outcome from the loaded `User` + `HashComparer` result.

`UsersRepository` therefore extends `CrudRepository<User>` with read helpers `findByEmail(email): Promise<User | null>` and `countActiveByRole(role): Promise<number>` — these are *queries that feed domain decisions*, not the rule itself.

### 6. Authorization is checked in use cases via the actor's role

Commands that require MASTER/ADMIN (create, edit, role change) accept the acting user's role (or id+role) in their input DTO and reject `OPERADOR` with `OperationNotAllowedForRole`. The domain enforces the rule; how the actor identity is supplied (token, guard) is the caller's concern (future presentation layer).

### 7. Domain errors as stable string codes

Errors are returned through `Result.fail(<CODE>)` using stable codes: `EMAIL_ALREADY_IN_USE`, `USER_NOT_FOUND`, `OPERATION_NOT_ALLOWED_FOR_ROLE`, `INVALID_CREDENTIALS`, `INVALID_TOKEN`, `USER_INACTIVE`. This matches the shared `Result` error-code convention and lets the future API map them to HTTP responses.

### 8. Tokens are opaque strings from `TokenService`

The domain treats access/refresh tokens as opaque strings produced and validated by `TokenService` (a port). The module does not encode JWT structure or expiry; "short access token + refresh token" is realized by the concrete implementation. Token validation returns the shared `AuthenticatedUser` DTO (`id`, `name`, `email`).

## Skills to use

Every artifact is created/reviewed through its skill (the user requires "use sempre as skills"):

- `module-aggregate` — scaffold each module/aggregate (`scripts/create-aggregate.js`).
- `module-value-object` — any module-specific VO (reuse shared VOs first).
- `module-entity` — the `User` entity and its invariants.
- `module-domain-service` — the cross-entity policies/specifications (`LastMasterPolicy`, `UniqueEmailSpecification`, `RoleAuthorizationPolicy`, `CredentialsPolicy`).
- `module-repository` — `UsersRepository` contract (+ in-memory fake for tests).
- `module-dto` — input/output DTOs.
- `module-query-cqrs` — read use cases (`list-users`, `find-user-by-id`, token validation projection).
- `module-use-case` — all command/auth use cases.

## Risks / Trade-offs

- [Stricter VO rules reject inputs the form text would accept] → Documented as Decision 2 + Open Question; cheap to swap VOs later since they are isolated at the use-case boundary.
- [Generic `InvalidCredentials` could leak existence through timing] → The domain returns the identical error code for unknown email and wrong password (rule enforced in `CredentialsPolicy`). The constant-time/dummy-compare hardening is an infra concern noted for the future `HashComparer` implementation; it does not move any rule into the DB.
- [`countActiveByRole` race under concurrent deactivations could drop the last MASTER] → The authoritative check is the domain `LastMasterPolicy`; since there is no DB constraint by design, the future data layer must run the read+decide+write inside a transaction (`TransactionManager` exists in shared) so the in-memory check stays correct under concurrency.
- [No DB-level uniqueness/constraints means a buggy adapter could bypass a rule] → Accepted: all rules are covered by domain unit tests; the future data layer keeps DB constraints only as a redundant safety net, and any constraint violation is mapped back to the same domain error code.
- [`auth` coupling to `users` read port] → Mitigated by exposing only a narrow `find-by-email` contract, not the full repository.

## Migration Plan

Greenfield modules — no data migration. Steps: scaffold `modules/users` then `modules/auth` with the `module-aggregate` script, fill in VOs/use cases/ports/errors, add in-memory fakes and unit tests under `test/**`, and wire `modules/*/src/index.ts` exports. Rollback is deletion of the two module directories; nothing else depends on them yet.

## Open Questions

- Should the product keep the stricter shared VOs (PersonName first+last, StrongPassword complexity) or relax to the literal form rules (name ≥2 chars, password ≥8 chars only)? Default chosen: keep stricter VOs.
- For `change-password`, verify the current password via a `HashComparer` port (shared with auth) or a method on `UsersRepository`/`HashGenerator`? Default chosen: a `HashComparer` port reused across modules.
- Confirm refresh-token rotation policy (issue a new refresh token on refresh, or only a new access token?). Default chosen: return only a new access token on refresh.
