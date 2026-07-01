## Why

The `apps/web` frontend is on the "simple" layout (dark-only, `(private)`/`(public)` route groups) with **no authentication**: `/dashboard` is open, the `/join` page is a placeholder, and `logoutAction` only redirects. The backend (`auth-users-backend`) now issues staff JWTs via `POST /api/auth/login` and `POST /api/auth/refresh`. This change plugs **NextAuth v5 (Auth.js)** into the existing simple layout so staff can log in, the `(private)` area is protected, and the backend access token is available for authenticated API calls — without restructuring the app into the heavier "modules" layout.

## What Changes

- Add **NextAuth v5 (Auth.js)** with a **Credentials provider** in `src/lib/auth.ts` (exports `handlers`, `auth`, `signIn`, `signOut`) and the route handler at `src/app/api/auth/[...nextauth]/route.ts`.
- `authorize()` calls `POST ${NEXT_PUBLIC_API_URL}/api/auth/login` with email + password; on success stores the backend `accessToken` + `refreshToken` and derives the user (`id`, `name`, `email`, `role`) by decoding the access-token payload (no `/profile` endpoint needed).
- **Token lifecycle in the `jwt` callback**: persist tokens + access expiry; when the access token is near expiry, call `POST /api/auth/refresh` with the refresh token to obtain a new access token; on refresh failure mark the session for re-login.
- **`session` callback** exposes `user` (with `role`) and the `accessToken` for downstream API calls.
- Replace the `/join` placeholder with a **real login form** (React Hook Form + the project's existing form validator), submitting via a `loginAction` Server Action that wraps `signIn('credentials')`; invalid credentials surface as a **toast** (per the form convention), not an inline field error.
- **Route protection**: add `src/middleware.ts` that redirects unauthenticated users from `(private)` routes to `/join`, and authenticated users away from `/join` to `/dashboard`; the `(private)/layout.tsx` reads the session via `auth()` and injects the real user into `PrivateShell` (defense in depth).
- Wire **`logoutAction`** to `signOut({ redirectTo: '/' })`.
- Add an **authenticated HTTP helper** (`src/lib/http`/`api`) that attaches `Authorization: Bearer <accessToken>` from the session, ready for module data layers.
- Add env: `AUTH_SECRET` (and `AUTH_URL` if needed); `NEXT_PUBLIC_API_URL` already exists.
- **Out of scope**: backend changes, `/logout` and `/profile` endpoints, the "modules" layout migration, per-permission ACLs beyond role on the session, and any business module screens.

## Capabilities

### New Capabilities

- `web-authentication`: NextAuth v5 Credentials integration against the backend (login, token storage + refresh, session shape with role + access token), the `/join` login form, `(private)` route protection via middleware + layout session read, logout, and the authenticated API client helper.

### Modified Capabilities

<!-- None — first auth integration in the web app; no existing spec requirements change. -->

## Impact

- **Depends on**: `auth-users-backend` running (or reachable at `NEXT_PUBLIC_API_URL`) for `/api/auth/login` and `/api/auth/refresh`.
- **Files**: `apps/web/src/lib/auth.ts`, `apps/web/src/app/api/auth/[...nextauth]/route.ts`, `apps/web/src/middleware.ts`, `apps/web/src/lib/http/*`, updates to `apps/web/src/app/(public)/join/page.tsx`, `apps/web/src/app/(private)/layout.tsx`, `apps/web/src/app/(private)/actions.ts`, and `.env`/`.env.example`.
- **New deps**: `next-auth@beta` (v5) and a small JWT-decode util (e.g. `jose`).
- **Compatibility**: Next.js 16.2.9 + React 19 — verify NextAuth v5 compatibility against the in-repo Next docs (`node_modules/next/dist/docs/`) / Context7 before coding (per `apps/web/AGENTS.md`).
