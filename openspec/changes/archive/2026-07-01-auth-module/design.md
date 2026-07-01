## Context

The auth stack already exists end-to-end and is largely aligned with the layered architecture: pure domain in `modules/auth` (`@repo/auth`, aggregates `src/user` and `src/auth`), a NestJS shell in `apps/backend/src/modules/{auth,users}` with shared guards/decorators, a Next.js login on `apps/web`, and a Flutter login on `apps/mobile`. It was built from an earlier design (changes `auth-users-domain`, `auth-users-backend`, `web-auth`) that assumed a `MASTER` role, self-service `change-password`, hard `delete-user`, a last-active-`MASTER` deactivation guard, and a separate `UserPassword` table.

The current task narrows scope to **single-tenant, ADMIN/OPERADOR only**, where the only lockout guard is **cannot-deactivate-self**. This change is therefore a **reconciliation + gap-fill**, not a greenfield build. Two required capabilities were never delivered: `GET /auth/me` and the web users-management screen. Confirmed scope decisions (see proposal): remove `MASTER`; keep the refresh-token flow; remove `change-password` and `delete-user`; keep the current single `@repo/auth` package structure; keep the separate `UserPassword` table.

Constraints: code, folders, and error names in English; every folder exposes an `index.ts` barrel; domain stays pure (no HTTP/DB/framework); reuse `@repo/shared` VOs (`PersonName`, `Email`, `HashPassword`) and `Entity`/`Result`; reuse existing guards/decorators (`JwtGuard`, `RolesGuard`, `@Public`, `@CurrentUser`, `@Papeis`); package manager is `bun`; per-package gate is `turbo build --filter=<pkg>` + `bun test`.

## Goals / Non-Goals

**Goals:**
- Enforce every invariant RN01–RN08 with the ADMIN/OPERADOR model.
- Make the minimum coherent diff per layer against the existing code; never recreate modules in parallel.
- Deliver the missing `GET /auth/me` and web users-management screen.
- Keep the domain the source of truth; the backend guard is the authoritative authorization boundary (RN07); UI hiding is reinforcement only.
- Keep all tests green (jest for domain, backend e2e where applicable) and builds passing.

**Non-Goals:**
- Multi-tenant support (RN03 fixes single-tenant).
- Self-service password change or hard user deletion (removed).
- Reworking the refresh-token design (kept as-is).
- Collapsing `UserPassword` into a column, or changing the crypto/JWT adapters.
- Mobile user management (out of scope; mobile only removes `MASTER` from role handling).

## Decisions

**D1 — Remove `MASTER` by reducing the enum, not by remapping semantics.**
`UserRole` becomes `{ ADMIN, OPERADOR }` in `modules/auth/src/user/model/user-role.ts`, the Prisma `UserRole` enum, and the backend `@Papeis` usages. Alternative (keep `MASTER` as a hidden superuser) was rejected: it contradicts RN01 and leaves dead authorization branches. Data migration converts existing `MASTER` rows to `ADMIN`.

**D2 — Replace last-active-`MASTER` with cannot-deactivate-self at the domain.**
Delete `user/service/last-master.policy.ts` and drop the `countActiveByRole` read from `UsersRepository`. `deactivate-user.use-case` takes `{ userId, requesterId }` and returns `CannotDeactivateSelf` when they match (RN05). Rationale: with no `MASTER`, the meaningful lockout risk is an admin disabling themselves; keeping the rule in the domain honors "invariants in business rules, not the DB".

**D3 — Authorization is guard-first, policy-backed.**
The backend `RolesGuard` + `@Papeis(UserRole.ADMIN)` is the authoritative gate on every users route (RN04/RN07); `role-authorization.policy.ts` stays in the domain (ADMIN-only) as defense-in-depth and to keep use cases independently testable. `OperationNotAllowedForRole` remains the domain error for a non-ADMIN actor reaching a CRUD use case.

**D4 — `GET /auth/me` reuses existing reads.**
Add an authenticated `GET /api/auth/me` on `auth.controller.ts` that pulls the id from `@CurrentUser` and returns `{ id, name, email, role, status }` via a `GetCurrentUser` orchestration over the existing find-user-by-id read. No new domain aggregate; avoids duplicating the user projection. Login response is extended to include `user: { id, name, role }` so the web session (which currently derives identity from the token payload) has a stable contract.

**D5 — Removals are deletions, not deprecations.**
`change-password` and `delete-user` use cases, their tests/mocks, the `INVALID_CURRENT_PASSWORD` error, the `ChangePasswordInputDTO`, and `PATCH /users/:id/password` (+ its HTTP DTO) are deleted outright. The `delete-user` endpoint was never wired, so only the domain artifacts and tests are removed there. Rationale: leaving dead use cases invites accidental exposure and muddies the barrels.

**D6 — Error → HTTP mapping updated in one place.**
`shared/errors/domain-error.mapper.ts`: `USER_INACTIVE` moves 403 → **401** (per task); add `CANNOT_DEACTIVATE_SELF` → **422**; remove `INVALID_CURRENT_PASSWORD`. `INVALID_CREDENTIALS`/`INVALID_TOKEN` stay 401; `EMAIL_ALREADY_IN_USE` 409; `USER_NOT_FOUND` 404; `OPERATION_NOT_ALLOWED_FOR_ROLE` 403.

**D7 — Keep the separate `UserPassword` table.**
Although the task text describes a `passwordHash` field, the existing 1:1 `UserPassword` table already satisfies RN08 (hash-only, never returned) and is built/tested; collapsing it is destructive churn with no functional gain. The migration only touches the `UserRole` enum, not the password table. Flagged as an assumption for the user to veto.

**D8 — Web: role-filtered nav + on-load route guard.**
Sidebar items carry an optional required-role; the `(private)` shell filters by `session.user.role`. The users route additionally checks role on load and redirects non-ADMIN to `/dashboard` (RN07). Forms use React Hook Form + Zod (`*.schema.ts`) and the existing authenticated API client (Bearer from session).

**D9 — Layer ordering respects build dependencies.**
Domain first (blocking), then backend (schema/migration → adapters → controllers → module wiring), then web and mobile in parallel, then an end-to-end review pass. Each layer gates on `turbo build --filter` + `bun test` before handing off.

## Risks / Trade-offs

- **[Removing `MASTER` breaks existing sessions/rows]** → Ship a Prisma migration that alters the `UserRole` enum and updates `MASTER` rows to `ADMIN` in the same migration; update the seed to `ADMIN`; document that any issued tokens carrying `role: MASTER` become invalid on role check and require re-login.
- **[Deleting use cases breaks barrels/imports]** → Remove exports from every `index.ts` up the chain and run `turbo build --filter=@repo/auth` before backend work; the compiler surfaces stragglers.
- **[401 vs 403 for inactive users changes client behavior]** → The web NextAuth `authorize` already treats 401 as invalid credentials; verify the inactive path still shows a generic rejection and does not leak "inactive" specifically, keeping the generic-error guarantee.
- **[Keeping the refresh flow while narrowing everything else]** → Retain `JWT_REFRESH_TTL`, `/auth/refresh`, `refresh-token`/`validate-token` use cases and their tests untouched; scope the diff so reconciliation edits do not accidentally regress refresh.
- **[UI hiding mistaken for security]** → Specs and code comments state the backend guard is authoritative; the users route enforces an on-load redirect independent of the hidden menu item.
- **[Divergence between task text ("passwordHash") and kept `UserPassword` table]** → Documented as D7/assumption; reversible in a follow-up if the user prefers the column form.

## Migration Plan

1. **Domain** (`@repo/auth`): reduce `UserRole`; delete `last-master.policy.ts`, `change-password.use-case`, `delete-user.use-case` (+ tests/mocks); add `CannotDeactivateSelf`; thread `requesterId`; set ADMIN-only in `role-authorization.policy`; extend login result with user identity; add `GetCurrentUser` path. Gate: `turbo build --filter=@repo/auth` + `bun test`.
2. **Backend**: Prisma migration (enum + `MASTER`→`ADMIN` data) & ADMIN seed → adapters (drop `countActiveByRole`) → controllers (`@Papeis(ADMIN)` everywhere on users; add `GET /auth/me`; extend login response; remove password endpoint) → error mapper updates → module wiring. Gate: `turbo build --filter=backend` + backend tests.
3. **Web + Mobile** (parallel): web login stays; add role-filtered nav, ADMIN-guarded users route, list/create/edit/activate/deactivate with Zod schemas; mobile removes `MASTER` from role handling and re-verifies login/persist/logout.
4. **Review**: end-to-end login + users CRUD, backend role enforcement (RN04/RN07), password never returned (RN08); run monorepo build + tests + lint.

**Rollback**: revert per-layer commits (domain diff is self-contained); the Prisma migration is reversible by a down-migration restoring the three-value enum (existing rows remain `ADMIN`, which is still valid).

## Open Questions

- Confirm D7: keep the separate `UserPassword` table (recommended) or collapse to a `passwordHash` column to match the task text literally?
- Should any pre-existing `MASTER` account be preserved as a named `ADMIN`, or is the fresh ADMIN seed sufficient for environments being re-provisioned?
