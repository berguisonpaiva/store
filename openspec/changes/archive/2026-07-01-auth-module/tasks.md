## 1. Domain — `modules/auth` (`@repo/auth`) — BLOCKING

- [x] 1.1 Reduce `user/model/user-role.ts` `UserRole` to `{ ADMIN, OPERADOR }`; remove every `MASTER` reference in the aggregate.
- [x] 1.2 Add `CannotDeactivateSelf` to `user/errors/user-error.ts`; remove `INVALID_CURRENT_PASSWORD`; keep `UserNotFound`, `EmailAlreadyInUse`, `OperationNotAllowedForRole`, `INVALID_ROLE`; update the errors barrel.
- [x] 1.3 Delete `user/service/last-master.policy.ts` and its export; set `user/service/role-authorization.policy.ts` to ADMIN-only (CRUD).
- [x] 1.4 Remove `countActiveByRole` from `user/provider/user.repository.ts` (`UsersRepository`) and any callers; confirm ports are `findByEmail`, `findById`, `create`, `update`, `list`. (Note: shared `CrudRepository` exposes `update`, not `save`.)
- [x] 1.5 Change `user/use-case/deactivate-user.use-case.ts` input to `{ userId, requesterId }`; return `CannotDeactivateSelf` when equal, `UserNotFound` when missing.
- [x] 1.6 Delete `user/use-case/change-password.use-case.ts` and `user/use-case/delete-user.use-case.ts`; remove their exports from the use-case barrel.
- [x] 1.7 Remove `ChangePasswordInputDTO` from `user/dto/user.dto.ts`; confirm `UserDTO` output has no hash (RN08) and list filters are `{ status?/active?, role? }`. (Note: kept `active: boolean` as the canonical field across layers; `status` is the presentation name.)
- [x] 1.8 Confirm `create-user.use-case` returns `{ userId }` using `findByEmail` + `HashGenerator` + `create` (EmailAlreadyInUse); confirm `update-user` errors (`UserNotFound`, `EmailAlreadyInUse`); confirm `activate-user`, `list-users` (filters `active`, `role`), `find-user-by-id` (`UserNotFound`).
- [x] 1.9 Extend `auth/use-case/login.use-case.ts` output to include the authenticated user `{ id, name, role }` alongside `accessToken`/`refreshToken`; keep generic `InvalidCredentials` and `UserInactive` (RN02); update `auth/dto/auth.dto.ts` `LoginOutputDTO`.
- [x] 1.10 Keep the refresh flow untouched: `auth/use-case/refresh-token.use-case.ts`, `validate-token.use-case.ts`, `token-service.ts` port.
- [x] 1.11 Add a `GetCurrentUser` read path returning the user projection by user id (reusing find-user-by-id), erroring `UserNotFound`.
- [x] 1.12 Update tests/mocks in `test/`: delete `change-password.use-case.test.ts` and `delete-user.use-case.test.ts`; update `deactivate` (self-guard), `policies.test.ts` (drop last-master), `login` (user in output), `user.entity.test.ts` and mocks (`in-memory-user.repository.ts`, `user-builder.ts`) to the 2-role model.
- [x] 1.13 Reconcile all barrels up to `modules/auth/src/index.ts`; gate: `turbo build --filter=@repo/auth` and `bun test` green; deliver diff.

## 2. Backend — `apps/backend/src/modules/{auth,users}` (depends on 1)

- [x] 2.1 Prisma: reduce `prisma/models/users.model.prisma` `UserRole` enum to `ADMIN`/`OPERADOR`; keep `User` + separate `UserPassword` (1:1) tables.
- [x] 2.2 Generate a migration that alters the enum and updates existing `MASTER` rows to `ADMIN`. (Authored by hand at `prisma/migrations/20260701000000_auth_roles/`; not applied live — no DB reachable.)
- [x] 2.3 Update `prisma/seed/main.ts` to seed one active `ADMIN` (hashed password in `UserPassword`). New identity: `admin@store.local` / `Admin!123`.
- [x] 2.4 Update `modules/users/adapters/user.prisma.repository.ts` and `user.prisma.query.ts`: drop `countActiveByRole`; keep `toDomain`/`fromDomain`, `findByEmail`, `findById`, `create`, `update`, `list` (+ `delete` retained per `CrudRepository`).
- [x] 2.5 Confirm `modules/auth/adapters/jwt-token-service.ts` (Encrypter) and `shared/crypto/bcrypt-hash-generator.ts` / `bcrypt-hash-comparer.ts` bindings; no changes beyond role typing.
- [x] 2.6 `shared/decorators/papeis.decorator.ts` + `shared/auth/roles.guard.ts`: align to the 2-value `UserRole`; keep 401 for unauthenticated, 403 for wrong role. (Also removed `UserRole.MASTER` from categories/inventory/products/sales controllers to keep the build green.)
- [x] 2.7 `auth.controller.ts`: extend `POST /auth/login` response with `user { id, name, role }`; add authenticated `GET /auth/me` using `@CurrentUser` → `GetCurrentUser`; keep `@Public()` on login and refresh.
- [x] 2.8 `users.controller.ts`: set `@Papeis(UserRole.ADMIN)` on list/create/update/activate/deactivate + `GET /users/:id`; pass `@CurrentUser` id as `requesterId` to deactivate; remove `PATCH /users/:id/password` and its handler.
- [x] 2.9 Remove `modules/users/dto/change-password.http.dto.ts`; confirm remaining `*.http.dto.ts` use class-validator + Swagger (`@ApiTags`/`@ApiOperation`/`@ApiResponse`/`@ApiBearerAuth`).
- [x] 2.10 `shared/errors/domain-error.mapper.ts`: `USER_INACTIVE` → 401; add `CANNOT_DEACTIVATE_SELF` → 422; remove `INVALID_CURRENT_PASSWORD`; keep the rest; update `domain-error.mapper.spec.ts`.
- [x] 2.11 Update `auth.module.ts` / `users.module.ts` port→adapter bindings (drop `ChangePassword`; add `GetCurrentUser`).
- [x] 2.12 Gate: `turbo build --filter=@repo/backend` + backend tests green (8 suites / 65 tests); deliver diff.

## 3. Web — `apps/web` (parallel with 4, after API contract)

- [x] 3.1 Confirm `(public)/join` login form (React Hook Form + Zod) still works against `POST /api/auth/login`; align `lib/auth.ts` role typing to `ADMIN`/`OPERADOR` and consume the `user` object now returned by login.
- [x] 3.2 Add role metadata to sidebar nav items and filter by `session.user.role` in the `(private)` shell; render **Usuários** only for `ADMIN` (RN04, reinforcement only).
- [x] 3.3 Create the `(private)/usuarios` users-management route; on load, redirect non-`ADMIN` to `/dashboard` (RN07).
- [x] 3.4 Implement list with role/active filters via the authenticated API client (`GET /api/users`); render `{ name, email, role }` + Active/Inactive derived from `active` (no hash).
- [x] 3.5 Implement create/edit forms with Zod `*.schema.ts` + `zodResolver` → `POST /api/users`, `PATCH /api/users/:id`; surface 409 duplicate-email inline/toast.
- [x] 3.6 Implement activate/deactivate row actions → `PATCH /api/users/:id/{activate,deactivate}`; surface 422 cannot-deactivate-self as a toast.
- [x] 3.7 Gate: `turbo build --filter=@repo/web` green; web diff adds zero new lint findings (repo lint has a pre-existing out-of-scope baseline).

## 4. Mobile — `apps/mobile` (Flutter; parallel with 3)

- [x] 4.1 Remove `MASTER` from any local role handling in `domain/auth` entities and `data/auth` DTOs; align to `ADMIN`/`OPERADOR`.
- [x] 4.2 Verify login (any role, focus OPERADOR), session token persistence (`flutter_secure_storage`), and logout still work end-to-end.
- [x] 4.3 Gate: mobile build + tests green; deliver diff. (No user management in this MVP.)

## 5. Review — end-to-end (after 1–4)

- [x] 5.1 Verified statically: `POST /auth/login` returns `{ accessToken, refreshToken, user }`; `GET /auth/me` (JwtGuard) → `GetCurrentUser`; login/refresh `@Public()`, all else authenticated (RN06). (No live DB/backend available for runtime e2e; build + backend tests green.)
- [x] 5.2 Verified `@Papeis(UserRole.ADMIN)` on all users routes + `RolesGuard` → 403 for non-ADMIN (RN04/RN07). Backend suite green.
- [x] 5.3 Verified `CANNOT_DEACTIVATE_SELF` → 422 (RN05) and `USER_INACTIVE` → 401 (RN02) in `domain-error.mapper.ts` + spec (green).
- [x] 5.4 RN08: no response DTO contains a hash (only `password` inputs on create/login). RN01: removed remaining live `MASTER` references (caixa role Set, estoque copy/comment, `.env.example` seed vars → `SEED_ADMIN_*`). RN03: no tenant fields introduced.
- [x] 5.5 `npx turbo build` → 7/7 green; `npx turbo test` → 7/7 green (shared 327, auth 34, backend 65, web 62; mobile 149 via flutter). Lint at pre-existing baseline; this change adds no new findings.
