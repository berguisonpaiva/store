## Context

`apps/web` is Next.js 16.2.9 (App Router, React 19) on the **"simple"** layout from `config-frontend-layout`: route groups `(public)` and `(private)`, an `AdminShell`/`PrivateShell` (client) fed by a server `(private)/layout.tsx`, a `/join` placeholder, and a `logoutAction` stub. The scaffold's own comments document the intended auth integration with NextAuth (`@/lib/auth`, `auth()`, `signOut`). Forms use React Hook Form + a **custom validator** under `src/components/form/validator` (Zod is not installed). The backend exposes `POST /api/auth/login` → `{ accessToken, refreshToken }` and `POST /api/auth/refresh` → `{ accessToken }`; the access-token payload carries `{ sub, name, email, role }`. `NEXT_PUBLIC_API_URL` is already set.

Chosen approach (confirmed with the user): **NextAuth v5 Credentials in the existing simple layout**, login form reusing `/join`.

## Goals / Non-Goals

**Goals:**

- Authenticate staff via the backend, keeping the backend as the credential authority; NextAuth manages the session/cookie and token lifecycle.
- Protect `(private)` routes (middleware + layout session read) and feed the real user into `PrivateShell`.
- Make the backend access token available to server code for authenticated API calls.
- Reuse the existing form stack (RHF + custom validator) and toast convention.
- Follow `config-frontend-layout` (simple) and `frontend-form-schema` skills, adapted to the project's reality.

**Non-Goals:**

- No migration to the "modules" layout; no 3-column shell.
- No backend changes; no `/logout` or `/profile` endpoints (not needed with this design).
- No permission/ACL system beyond exposing `role` on the session.
- No business module screens.

## Decisions

### 1. NextAuth v5 Credentials, JWT session

`src/lib/auth.ts` calls `NextAuth({...})` and exports `{ handlers, auth, signIn, signOut }`; `src/app/api/auth/[...nextauth]/route.ts` re-exports `handlers`. Credentials provider forces the JWT session strategy (required for Credentials), so no DB session store is needed.

- Alternative considered: custom httpOnly-cookie session. Rejected — the scaffold already targets NextAuth and it gives middleware/`auth()`/`signOut` for free.

### 2. Derive the user from the access token, not a `/profile` call

The backend login returns only tokens, and the access-token payload contains `{ sub, name, email, role }`. `authorize` decodes the payload (via `jose`'s `decodeJwt` — decode only, the token came directly from our backend over a trusted server-side call) to build the NextAuth user. This avoids needing a `/profile` endpoint the backend doesn't have.

### 3. Token lifecycle in the `jwt` callback

The `jwt` callback stores `accessToken`, `refreshToken`, `accessTokenExpires` (parsed from the JWT `exp`), and the user fields. On each invocation, if the access token is expired/near expiry, it calls `POST /api/auth/refresh`; on success it swaps in the new access token + expiry, on failure it sets `token.error = 'RefreshFailed'`. The `session` callback maps these onto `session.user` (+ `role`), `session.accessToken`, and `session.error`.

- Refresh rotation: the backend returns only a new access token (matches the backend design), so the refresh token is kept as-is.

### 4. Route protection: proxy + layout, complementary

**Next 16 note:** `middleware.ts` was renamed to **`proxy.ts`** (same functionality). The guard lives at `src/proxy.ts` and uses `export default auth((req) => ...)`.

`src/proxy.ts` (using the `auth` wrapper from `lib/auth.ts`) handles redirects at the edge: no session on a `(private)` path → `/join`; session on `/join` → `/dashboard`. The matcher targets the private paths and `/join`. The `(private)/layout.tsx` additionally calls `auth()` server-side and, if absent, `redirect('/join')`, then passes the real `user.name`/`user.email` into `PrivateShell` (replacing the stubbed empty values). Two layers because middleware is the gate and the layout is where the user data is injected.

### 5. Login via Server Action wrapping `signIn`

`/join` becomes a client form (RHF + custom validator) calling a `loginAction` Server Action that runs `signIn('credentials', { email, password, redirectTo: '/dashboard' })`. Field validation (required/email format) is inline; a thrown `AuthError` (bad credentials/inactive) is caught and surfaced as a generic `toast.error(...)` per `frontend-form-schema` (submission errors → toast, not inline). The generic message preserves the backend's no-user-enumeration behavior.

### 6. Reuse the custom form validator (no Zod)

`frontend-form-schema` prescribes Zod, but the project ships a custom validator and no Zod dependency. To stay consistent with the codebase we use the existing `src/components/form/validator` with RHF rather than introducing Zod. Flagged in Open Questions if the team prefers to standardize on Zod.

### 7. Authenticated API client

`src/lib/http` (or `src/lib/api`) wraps `fetch` against `NEXT_PUBLIC_API_URL`, reading the access token from `auth()` (server) and attaching `Authorization: Bearer`. This is the seam future module data layers use; for this change it also backs login/refresh fetches (those go without a bearer).

### 8. Session consumption stays server-driven

The user is read server-side in the layout and passed as props into the (already client) `PrivateShell`; logout is a Server Action. No `SessionProvider`/`useSession` is added unless a client component later needs live session — keeps the bundle and wiring minimal.

## Risks / Trade-offs

- [NextAuth v5 (beta) on Next 16 / React 19 may have rough edges] → Verify against `node_modules/next/dist/docs/` and Context7 before coding (AGENTS.md mandates this); pin a known-good `next-auth` version.
- [Decoding the access token without verifying] → Acceptable: the token is obtained over a trusted server-to-backend call in `authorize`; it is used only to populate display fields, never as an authorization decision on the web side.
- [Role on the session can go stale until refresh/re-login] → Same trade-off as the backend (short access TTL); acceptable for MVP.
- [Refresh inside the `jwt` callback can run in the edge/middleware runtime] → `fetch` works on edge; keep the callback lean and guard against refresh loops with the `error` flag.
- [Custom validator vs. skill's Zod] → Documented (Decision 6); low risk, isolated to the form.

## Migration Plan

1. Add `next-auth@beta` + `jose`; add `AUTH_SECRET` to `.env`/`.env.example`.
2. Create `lib/auth.ts`, the `[...nextauth]` route, and the `lib/http` helper.
3. Add `middleware.ts`; update `(private)/layout.tsx` to read the session and inject the user; update `actions.ts` `logoutAction` to `signOut`.
4. Build the `/join` login form + `loginAction`.
5. Verify end-to-end against the running backend (login, refresh, guard, logout).

Rollback: remove the auth files/deps and revert the three touched scaffold files; the simple layout returns to its open state.

## Open Questions

- Standardize forms on Zod (per `frontend-form-schema`) or keep the project's custom validator? Default: keep the custom validator.
- Login route: confirmed `/join` (reuse the existing public auth route).
- Should `(private)/layout.tsx` redirect itself, or rely solely on middleware? Default: both (defense in depth).
