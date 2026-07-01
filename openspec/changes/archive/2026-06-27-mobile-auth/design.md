## Context

`apps/mobile` is a Flutter Clean Architecture app (get_it, go_router, flutter_bloc, fpdart, dio, flutter_secure_storage, drift). The auth **domain** (`AuthRepository`, entities, `AuthFailure`, `SignIn/SignOut/GetProfile` use cases) and **data** (`AuthRemoteDataSourceImpl`, `AuthRepositoryImpl` persisting tokens, DTOs, mapper) already exist from `mobile-auth-integration`, which deliberately shipped **no UI**. The router (`app_router.dart`) only declares `/` → `HomePage`; `HttpClientImpl` has `setAuthToken` but nothing calls it.

The backend `auth-users-backend` provides only `POST /api/auth/login` → `{ accessToken, refreshToken }` and `POST /api/auth/refresh` → `{ accessToken }`; the access-token payload carries `{ sub, name, email, role }`. The current data layer instead expects a `user` field plus `/logout` and `/profile` — so login would throw at runtime. This change adds the UI/app wiring and reconciles the data layer.

## Goals / Non-Goals

**Goals:**

- Ship a working login → session → guarded navigation → logout loop, reusing the existing use cases.
- Reconcile data/domain with the real backend contract (login + refresh only; user from token; local logout).
- Attach the bearer token and refresh transparently on 401.
- Follow the Flutter skills: `flutter-feature-workflow`, `flutter-ui-mvvm`, `flutter-app-composition`, `flutter-domain-layer`, `flutter-data-drift-layer`, `flutter-core-layer`, `flutter-testing`.

**Non-Goals:**

- No backend changes; no `/logout` or `/profile`.
- No signup, password recovery, biometrics, or business module screens.
- No role-based screen gating yet (role is captured on the session for later use).

## Decisions

### 1. Derive the user from the access token (no `/profile`, no `user` field)

The backend login returns tokens only. A pure core helper `JwtDecoder` (interface + impl, base64-decoding the JWT payload — no package needed) extracts `{ sub, name, email, role }`. The repository builds `AuthUserEntity` from the decoded payload on login and on session restore.

- `AuthSessionDto` is reduced to `{ accessToken, refreshToken }` (login) and refresh parses `{ accessToken }`, reusing the stored refresh token.
- Alternative considered: add `/profile` + `user` to the backend. Rejected for this change (frontend-only scope); could be a future backend change if richer profile data is needed.

### 2. `role` added to the auth user

`AuthUserEntity` gains `role` (string) so the session knows the staff role (MASTER/ADMIN/OPERADOR) for future authorization. Decoded from the token; defaults safely if absent.

### 3. App-level session state drives the router

An `AuthSessionCubit` (singleton in DI) holds `AuthStatus { unknown, authenticated, unauthenticated }`. `appRouter` becomes a factory taking the cubit and using `refreshListenable: GoRouterRefreshStream(cubit.stream)` with a `redirect` that: keeps users on a splash/neutral state while `unknown`; routes to `/login` when `unauthenticated`; and bounces away from `/login` when `authenticated`. `bootstrap` restores the session before building `AppWidget`, so the first frame already knows the status (minimizing flicker).

- Alternative considered: guarding inside each page. Rejected — centralized `redirect` is the `flutter-app-composition` pattern and avoids per-screen leakage.

### 4. Login UI follows MVVM strictly

`LoginPage` (StatefulWidget) resolves `LoginCubit` via `getIt`, closes it in `dispose`, and uses explicit-bloc `BlocBuilder`/`BlocListener` (no `BlocProvider`). `LoginCubit`/`LoginState` have zero Flutter imports. Field validation is inline; submission failures use `AppToast` (matching the project's toast convention and the web app's behavior). The generic credentials error avoids user enumeration.

### 5. Token attachment + 401 refresh via a Dio interceptor

A core auth interceptor (registered on the Dio instance behind `HttpClient`) attaches the bearer from secure storage and, on `401`, performs a single `refresh` and retries; if refresh fails it signals the `AuthSessionCubit` to go `unauthenticated`. The bearer is also set explicitly via `HttpClient.setAuthToken` on login/restore for immediate effect. This keeps refresh logic in one place rather than scattered across call sites.

- Trade-off: interceptor coordination with the session cubit crosses core↔app; handled via a small callback/port to avoid core depending on the app layer.

### 6. Use cases for restore and logout

Add `RestoreSessionUseCase` (wraps `currentSession` + token-derived user) and reuse `SignOutUseCase`; optionally `RefreshSessionUseCase` for the interceptor. UI/cubits depend on use cases, never the repository directly (`flutter-domain-layer`/MVVM boundary).

### 7. Logout is local

With no backend `/logout`, `SignOutUseCase` clears secure storage and the bearer, and flips the session to `unauthenticated`; the guard routes to `/login`.

## Skills to use

- `flutter-feature-workflow` — orchestrate the end-to-end feature (file creation order, handoffs).
- `flutter-ui-mvvm` — `LoginPage`, `LoginCubit`/`LoginState`, explicit-bloc, AppToast.
- `flutter-app-composition` — router guard/`refreshListenable`, bootstrap/startup restore, get_it module wiring/order.
- `flutter-domain-layer` — restore/refresh use cases, `role` on the entity, Either-based contracts.
- `flutter-data-drift-layer` — DTO/datasource/repository reconciliation and mapping.
- `flutter-core-layer` — `JwtDecoder` wrapper and the Dio auth interceptor.
- `flutter-design-system` — login screen styling via theme tokens and shared widgets (`PrimaryButton`).
- `flutter-testing` — cubit, repository, and widget tests.

## Risks / Trade-offs

- [Backend contract mismatch breaks login if not reconciled] → Decision 1 reduces the DTO and derives the user from the token; covered by a repository test.
- [Decoding the token without signature verification] → Acceptable: the token is received over a trusted login/refresh call and used only to populate display fields + role; never used as a security decision on the device.
- [Guard flicker while status is `unknown`] → Restore session in `bootstrap` before first frame; show a neutral/splash state for `unknown`.
- [Interceptor ↔ session-cubit coupling] → Mediated by a callback/port so `core` does not import `app`.
- [Refresh storms on repeated 401] → Single-flight refresh with a retry flag; on failure go straight to `unauthenticated`.

## Migration Plan

1. Add `JwtDecoder` (core) and reconcile `data/auth` DTOs/datasource/repository to the real contract; add `role` to `AuthUserEntity`.
2. Add restore/refresh use cases; register them and the cubits in DI.
3. Build `LoginPage` + `LoginCubit`/`LoginState` and l10n strings.
4. Make `appRouter` a factory with the guard; restore session in `bootstrap`; pass it to `AppWidget`.
5. Add the Dio auth interceptor (bearer + 401 refresh).
6. Add tests; run `flutter analyze`, `flutter test`, and a manual sign-in against the backend.

Rollback: remove `lib/ui/auth/**`, the session cubit, interceptor, and revert the router/bootstrap and data-layer edits; the domain+data scaffold returns to its UI-less state.

## Open Questions

- Splash vs. immediate login while `AuthStatus == unknown`? Default: brief neutral state during bootstrap restore.
- Add `RefreshSessionUseCase` explicitly, or let the interceptor call the repository via a port? Default: explicit use case for testability.
- Should the backend later add `/profile` + `/logout` (and `user` in login)? Out of scope here; revisit if richer profile/refresh-rotation is needed.
