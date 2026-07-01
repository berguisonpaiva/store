## Why

The auth stack (domain `@repo/auth`, backend `auth`/`users` modules, web login, mobile login) was built from an earlier design that assumed **three roles including `MASTER`**, a **self-service change-password**, a **hard delete-user**, and a **last-active-MASTER** deactivation guard. The product scope is now single-tenant with **only `ADMIN` and `OPERADOR`** (RN01), where the only protection against lockout is "you cannot deactivate yourself" (RN05). This change reconciles the existing implementation with that scope and closes two gaps the scope requires but the code never delivered: a `GET /auth/me` endpoint and the web users-management screen.

## What Changes

- **BREAKING** — Remove the `MASTER` role everywhere (`UserRole` becomes `ADMIN | OPERADOR`): domain enum, backend `@Papeis`/guard usage, Prisma `UserRole` enum + migration, and the seed (initial user becomes `ADMIN`). Existing `MASTER` rows must be migrated to `ADMIN`.
- **BREAKING** — Replace the "cannot deactivate the last active `MASTER`" rule with "an actor cannot deactivate themselves" (RN05). Delete `last-master.policy.ts` and the `countActiveByRole` read path; add a `CannotDeactivateSelf` error and thread `requesterId` into deactivate.
- **BREAKING** — Remove the `change-password` use case (+ endpoint `PATCH /users/:id/password`, its HTTP DTO, and the `INVALID_CURRENT_PASSWORD` error) and the `delete-user` use case. Deactivation is the supported way to retire a user.
- Restrict all user CRUD to `ADMIN` only (RN04/RN07): update `role-authorization.policy.ts` and every `@Papeis(...)` on `users.controller.ts` to `ADMIN`.
- Add **`GET /auth/me`** (authenticated) returning the current user `{ id, name, email, role, status }` via a `GetCurrentUser`/`FindUserById` path using `@CurrentUser`.
- Include the authenticated user `{ id, name, role }` in the login response payload alongside the tokens.
- Re-map `UserInactive` to **401** (currently 403) and map `CannotDeactivateSelf` to **422** in `domain-error.mapper.ts`.
- **Web**: add an ADMIN-only **Usuários** sidebar item (hidden for non-ADMIN as reinforcement, not security) and a users-management page that redirects non-ADMIN on load (RN07) and supports list/create/edit/activate/deactivate against the backend.
- **Keep** the refresh-token flow (accessToken + refreshToken, `POST /auth/refresh`, `refresh-token` + `validate-token` use cases) — confirmed in scope.
- **Keep** the existing separate `UserPassword` (1:1) table for the hash — RN08 is satisfied and it is already built/tested; not collapsed into a column.
- **Mobile**: no functional change beyond removing the `MASTER` role from any local role handling; verify login + session persistence + logout still work.

## Capabilities

### New Capabilities
- `web-user-management`: ADMIN-only web screen and sidebar entry to list, create, edit, activate, and deactivate staff users, with a client-side permission redirect for non-ADMIN.

### Modified Capabilities
- `user-management`: roles reduced to `ADMIN`/`OPERADOR`; management authorized for `ADMIN` only; last-active-MASTER rule replaced by cannot-deactivate-self; `change-password` and `delete-user` requirements removed.
- `user-management-api`: user endpoints restricted to `ADMIN`; `PATCH /users/:id/password` removed; deactivate enforces cannot-deactivate-self (422); initial seed creates an `ADMIN` (not `MASTER`).
- `staff-authentication`: `GetCurrentUser` requirement added; login result carries the authenticated user identity; role references limited to `ADMIN`/`OPERADOR` (refresh/validate unchanged).
- `staff-authentication-api`: add public/authenticated split with `GET /auth/me`; `@Papeis` enum reduced to `ADMIN`/`OPERADOR`; `UserInactive` mapped to 401; login response includes the user object.
- `web-authentication`: admin sidebar gains an ADMIN-gated Usuários item; the users route guards on load and redirects non-ADMIN to the main page.

## Impact

- **Domain** `modules/auth/` (`@repo/auth`): `user/model/user-role.ts`, `user/service/*` (delete `last-master.policy.ts`), `user/errors/*`, `user/use-case/*` (delete `change-password`, `delete-user`), `auth/use-case/login.use-case.ts`, and their jest tests + mocks.
- **Backend** `apps/backend/src/modules/{auth,users}/`: controllers, HTTP DTOs, adapters, module wiring; `shared/auth/roles.guard.ts` + `shared/decorators/papeis.decorator.ts`; `shared/errors/domain-error.mapper.ts`.
- **Prisma** `apps/backend/prisma/`: `models/users.model.prisma` (`UserRole` enum), new migration, `seed/main.ts`.
- **Web** `apps/web/src/`: `(private)` layout/sidebar, new users-management route + form schemas; `lib/auth.ts` role typing.
- **Mobile** `apps/mobile/lib/`: role handling in auth entities/DTOs (MASTER removal only); otherwise verification.
- **Dependencies/config**: no new packages; `JWT_ACCESS_TTL`/`JWT_REFRESH_TTL` retained.
