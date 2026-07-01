## ADDED Requirements

### Requirement: Login screen

The system SHALL provide a login screen under `lib/ui/auth/` built with the project's MVVM pattern: a `LoginPage` that owns its `LoginCubit` (resolved from get_it), renders via explicit-bloc `BlocBuilder`/`BlocListener` (no `BlocProvider`), and has no Flutter imports inside the ViewModel. The form MUST capture email and password, validate them inline, and disable submit while loading.

#### Scenario: Successful login

- **WHEN** the user submits valid credentials and the backend accepts them
- **THEN** the `SignInUseCase` succeeds, the session becomes authenticated, and the app navigates to the home route

#### Scenario: Inline field validation

- **WHEN** the email is empty/malformed or the password is empty
- **THEN** an inline validation message is shown and no request is sent

#### Scenario: Invalid credentials shown as toast

- **WHEN** the backend rejects the credentials (`InvalidCredentialsFailure`)
- **THEN** a generic error is shown via `AppToast` and the user stays on the login screen

#### Scenario: Localized strings

- **WHEN** the login screen renders
- **THEN** its labels/messages come from l10n (pt/en), not hardcoded strings

### Requirement: App-level session state

The system SHALL maintain an app-level `AuthSessionCubit` exposing `AuthStatus` of `unknown`, `authenticated`, or `unauthenticated`, registered as a singleton, and updated on login, logout, startup restore, and refresh outcomes.

#### Scenario: Status reflects login and logout

- **WHEN** a login succeeds or a logout completes
- **THEN** the `AuthSessionCubit` emits `authenticated` or `unauthenticated` respectively

#### Scenario: Initial unknown status

- **WHEN** the app starts before the session is restored
- **THEN** the status is `unknown` so the guard can defer navigation until restore completes

### Requirement: Route guard

The system SHALL guard navigation with a GoRouter `redirect` driven by the `AuthSessionCubit` (via `refreshListenable`): unauthenticated users are redirected to the login route, and authenticated users on the login route are redirected to the home route.

#### Scenario: Unauthenticated redirected to login

- **WHEN** an unauthenticated user navigates to a protected route
- **THEN** GoRouter redirects them to `/login`

#### Scenario: Authenticated user skips login

- **WHEN** an authenticated user navigates to `/login`
- **THEN** GoRouter redirects them to the home route

### Requirement: Startup session restore

The system SHALL, during bootstrap, restore any persisted session: read tokens from secure storage, derive the user from the access token, attach the access token to the `HttpClient`, and set the initial `AuthStatus` accordingly.

#### Scenario: Returning user stays signed in

- **WHEN** the app starts and valid tokens exist in secure storage
- **THEN** the session is restored as `authenticated`, the bearer token is attached, and the user lands on the home route without logging in again

#### Scenario: No session starts at login

- **WHEN** the app starts and no tokens are stored
- **THEN** the status is `unauthenticated` and the user lands on the login route

### Requirement: Token attachment and refresh on 401

The system SHALL attach the access token to authenticated requests and recover from expiry: set the bearer on login/restore/refresh, clear it on logout, and on a `401` response attempt a single refresh-and-retry before forcing re-login.

#### Scenario: Bearer attached to requests

- **WHEN** an authenticated request is made after login or restore
- **THEN** it carries the `Authorization: Bearer <accessToken>` header

#### Scenario: Expired token refreshed transparently

- **WHEN** an authenticated request returns `401` and a valid refresh token exists
- **THEN** the client refreshes the access token once and retries the request

#### Scenario: Refresh failure forces re-login

- **WHEN** refresh fails (no/invalid refresh token)
- **THEN** the session becomes `unauthenticated` and the guard routes to `/login`

### Requirement: Logout

The system SHALL provide a logout action (use-case backed) that clears the persisted tokens, clears the bearer on the `HttpClient`, sets the status to `unauthenticated`, and routes back to the login screen.

#### Scenario: Logout returns to login

- **WHEN** the user triggers logout
- **THEN** tokens are cleared, the status becomes `unauthenticated`, and the user is routed to `/login`

### Requirement: Dependency injection wiring

The system SHALL register the auth UI and supporting use cases in the get_it modules: `LoginCubit` as a factory, `AuthSessionCubit` as a singleton, and any restore/refresh use cases needed by them.

#### Scenario: Resolvable dependencies

- **WHEN** the app boots
- **THEN** `LoginCubit` and `AuthSessionCubit` resolve from get_it with their use-case dependencies, in the correct module registration order
