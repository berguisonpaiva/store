# web-authentication Specification

## Purpose
TBD - created by archiving change web-auth. Update Purpose after archive.
## Requirements
### Requirement: NextAuth Credentials integration

The system SHALL configure NextAuth v5 (Auth.js) with a Credentials provider whose `authorize` step authenticates against the backend `POST /api/auth/login`, returning the user and the backend tokens. Credentials configuration MUST use the JWT session strategy.

#### Scenario: Successful authentication

- **WHEN** a user submits valid email and password
- **THEN** `authorize` calls `POST ${NEXT_PUBLIC_API_URL}/api/auth/login`, receives `accessToken` and `refreshToken`, derives the user (`id`, `name`, `email`, `role`) from the access-token payload, and a session is established

#### Scenario: Rejected credentials

- **WHEN** the backend responds 401 (invalid credentials) or 403 (inactive user)
- **THEN** `authorize` returns no user and NextAuth raises an auth error (no session is created)

### Requirement: Session carries role and access token

The system SHALL expose, via the `jwt` and `session` callbacks, the authenticated user with its `role` and the backend `accessToken`, so server code can authorize and call the API on the user's behalf.

#### Scenario: Session shape

- **WHEN** `auth()` is called in a Server Component or Server Action for a logged-in user
- **THEN** it returns a session containing `user.id`, `user.name`, `user.email`, `user.role`, and the current `accessToken`

### Requirement: Access token refresh

The system SHALL refresh the backend access token using the refresh token when the access token is expired or near expiry, transparently within the `jwt` callback. If refresh fails, the session MUST be marked so the user is sent to log in again.

#### Scenario: Transparent refresh

- **WHEN** the stored access token is past (or near) its expiry and a valid refresh token exists
- **THEN** the `jwt` callback calls `POST /api/auth/refresh`, stores the new access token and expiry, and the user stays logged in

#### Scenario: Refresh failure forces re-login

- **WHEN** `POST /api/auth/refresh` fails (invalid/expired refresh token)
- **THEN** the session is flagged with an error and the next protected navigation redirects to `/join`

### Requirement: Login form at /join

The system SHALL replace the `/join` placeholder with a login form (email + password) built with React Hook Form and the project's existing form validator, submitting through a `loginAction` Server Action that wraps `signIn('credentials')`.

#### Scenario: Valid login redirects

- **WHEN** the form is submitted with valid credentials
- **THEN** the user is signed in and redirected to `/dashboard`

#### Scenario: Field validation inline

- **WHEN** the email is empty/malformed or the password is empty
- **THEN** an inline field error is shown next to the input and no request is sent

#### Scenario: Submission error as toast

- **WHEN** the backend rejects the credentials
- **THEN** a generic error toast is shown (no inline "root" error block), and the user stays on `/join`

### Requirement: Private routes are protected

The system SHALL protect the `(private)` route group via `src/middleware.ts` and a session read in `(private)/layout.tsx`. Unauthenticated access MUST redirect to `/join`; the layout MUST inject the real user into `PrivateShell`.

#### Scenario: Unauthenticated redirected

- **WHEN** an unauthenticated user requests a `(private)` route (e.g. `/dashboard`)
- **THEN** the middleware redirects to `/join`

#### Scenario: Authenticated user sees their identity

- **WHEN** an authenticated user opens a `(private)` page
- **THEN** the layout reads the session via `auth()` and `PrivateShell` shows the real user name/email

#### Scenario: Logged-in user skips the login page

- **WHEN** an authenticated user navigates to `/join`
- **THEN** the middleware redirects them to `/dashboard`

### Requirement: Logout

The system SHALL implement `logoutAction` using NextAuth `signOut`, ending the session and redirecting to the landing route.

#### Scenario: Logout clears session

- **WHEN** the user triggers logout
- **THEN** `signOut({ redirectTo: '/' })` clears the session and redirects, and subsequent `(private)` access redirects to `/join`

### Requirement: Authenticated API client

The system SHALL provide an HTTP helper that reads the session access token and attaches `Authorization: Bearer <accessToken>` to backend requests against `NEXT_PUBLIC_API_URL`, for reuse by module data layers.

#### Scenario: Bearer attached

- **WHEN** the helper is used in a server context with an active session
- **THEN** the outgoing request includes the `Authorization: Bearer` header with the current access token

#### Scenario: Unauthenticated call surfaces as auth error

- **WHEN** the helper is used without a valid session/token
- **THEN** it does not send a bearer header and the caller can treat the 401 as an authentication failure

