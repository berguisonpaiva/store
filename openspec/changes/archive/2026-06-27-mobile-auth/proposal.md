## Why

The Flutter app (`apps/mobile`) already has the auth **domain** and **data** layers (from `mobile-auth-integration`) — repository, use cases, DTOs, token persistence — but **no UI and no app wiring**: the router only shows `/` (Home), there is no login screen, no session/guard, and the access token is never attached to requests. The app cannot actually log a user in. This change delivers the **auth experience**: a login screen, app-level session state, a route guard, startup session restore, and logout — connecting the existing use cases end to end. It also **reconciles the data layer with the real backend contract** (`auth-users-backend` provides only `POST /api/auth/login` and `POST /api/auth/refresh`), because the current data layer expects `/logout`, `/profile`, and a `user` field that the backend does not return — which would break login at runtime.

## What Changes

- Add a **login feature** under `lib/ui/auth/`: `LoginPage` + `LoginCubit`/`LoginState` (MVVM, explicit-bloc, no `BlocProvider`), email/password form with inline validation, `AppToast` for submission errors, loading state.
- Add **app-level session state**: an `AuthSessionCubit` (singleton) exposing `AuthStatus { unknown, authenticated, unauthenticated }`, used as the router's `refreshListenable`.
- Add a **GoRouter guard**: `redirect` sends unauthenticated users to `/login` and authenticated users away from `/login`; `appRouter` becomes a factory wired to the session cubit.
- **Startup session restore**: on boot, read the persisted session (`currentSession`), attach the access token to the `HttpClient`, and set the initial `AuthStatus`.
- **Token attachment + refresh**: call `HttpClient.setAuthToken` on login/restore/refresh and clear it on logout; add a Dio interceptor that, on `401`, attempts a single refresh-and-retry before forcing re-login.
- **Logout**: a use-case-backed action that clears tokens and routes back to `/login`.
- **Reconcile the data layer to the real backend** (modifies `mobile-auth-integration`): login/refresh target `/api/auth/login` and `/api/auth/refresh` only; the authenticated user is **derived by decoding the access-token payload** (`sub`, `name`, `email`, `role`) instead of a `user` field or `/profile`; `signOut` clears tokens locally (no `/logout` backend call).
- Add a core **JWT decode helper** (pure, behind an interface) to read the token payload.
- Add **DI registrations** (`LoginCubit`, `AuthSessionCubit`, restore/refresh use cases) and **l10n** strings (pt/en) for the login screen.
- **Out of scope**: backend changes, biometric login, signup/registration, password recovery, and any business module screens.

## Capabilities

### New Capabilities

- `mobile-auth-experience`: The login screen, app-level session state, GoRouter guard, startup session restore, token attachment/refresh interceptor, logout UX, DI wiring, and l10n for authentication in the Flutter app.

### Modified Capabilities

- `mobile-auth-integration`: Reconcile the data/domain implementation with the real backend contract — login + refresh endpoints only, user derived from the access-token payload (no `/profile`, no `user` field), and local-only `signOut` (no `/logout`). Removes the "no login screens yet" constraint now that the UI ships.

## Impact

- **Depends on**: `auth-users-backend` reachable at `API_BASE_URL` (`/api/auth/login`, `/api/auth/refresh`).
- **Files (new)**: `lib/ui/auth/**` (page + view_model), `lib/core/auth/jwt_decoder*.dart`, app-level session cubit, plus l10n entries.
- **Files (modified)**: `lib/app/router/app_router.dart`, `lib/app/bootstrap.dart`, `lib/app/app_widget.dart`, `lib/app/di/{ui_module,domain_module}.dart`, `lib/data/auth/**` (DTOs, datasource, repository) and possibly `lib/core/network/http_client_impl.dart` (interceptor), `lib/domain/auth/**` (use cases for restore/refresh; user-from-token).
- **No new heavy deps**: JWT payload decoded with built-in base64 (no package required); Drift/Dio/get_it/go_router already present.
- **Tests**: cubit tests (login success/failure, session transitions), repository test for token-derived user, widget test for the login form (per `flutter-testing`).
