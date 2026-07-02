## Why

The PDV backend has 60+ routes across auth, users, catalog, inventory, sales and cash-session, a stable error-code contract shared with the mobile app, and a role matrix (ADMIN × OPERADOR × anonymous) — but the only automated coverage today is a single smoke `app.e2e-spec.ts`. There is no end-to-end guarantee that the real Nest+Fastify app, running against a real Postgres, behaves correctly across the full sale lifecycle, that every error code returns the agreed HTTP status, or that every error code has a mobile translation. Regressions in these contracts (like the recent stale-Prisma-client 500 on `/inventory/low-stock`) reach runtime undetected.

## What Changes

- Add a real HTTP e2e suite in `apps/backend/test/` (Jest + supertest) that boots the full `AppModule` with `FastifyAdapter` against a **dedicated local Postgres `_test` database** (Docker), with migrations applied and truncate + admin re-seed between every test. No repository mocks, no DB fakes.
- Add reusable test infrastructure under `apps/backend/test/utils/`: `create-test-app.ts`, `db.ts` (truncate), `auth.ts` (login/create-operador helpers), `factories.ts` (category/product+variation/stock-entry/open-cash/sale builders).
- Add nine spec files covering RT01–RT09: happy path end-to-end plus **every error code** of every module asserted by **HTTP status + stable code in the response body**, and the full ADMIN/OPERADOR/anonymous permission matrix, including per-operator ownership scoping of cash sessions and sales.
- **BREAKING (mobile HTTP contract):** Correct `domain-error.mapper.ts` (minimal diff) so 5 codes match the agreed status table — `ESTOQUE_INSUFICIENTE` 409→422, `NO_OPEN_CASH_SESSION` 422→409, `CANNOT_DEACTIVATE_SELF` 422→400, `VALOR_INVALIDO` 422→400, `INVALID_PRICE` 422→400 — and realign the mobile failure mappers to the new statuses.
- Add an automated guard (static comparison) that fails if any backend error code lacks a `pt` **and** `en` translation key in `app_pt.arb` / `app_en.arb`, or is unmapped in a mobile failure mapper; add the missing keys and regenerate `app_localizations*.dart`.
- Add **web browser e2e** (Playwright — new tooling in `apps/web`) driving the real Next.js UI in a real browser against the **live NestJS backend + `_test` Postgres**, covering the admin console flows (login, user/operador, category, product+variation, inventory views, cash-session admin) and auth-redirect/permission gating, with translated error messages rendered from real backend error codes.
- Add **mobile emulator e2e** (Flutter `integration_test` — new dependency + `apps/mobile/integration_test/`) driving the real Flutter PDV UI on an Android/iOS emulator against the **live backend + `_test` Postgres**, covering the operator PDV flow (login → open cash → product lookup → build sale → split payment → finalize → close cash) and a translated error surface (e.g. insufficient stock).
- Wire test scripts/env so the whole suite runs from an empty DB with one command (migrate + seed automatic), and never against the dev/prod (Neon) database; add a full-stack orchestration entrypoint that boots backend + web (+ emulator) for the UI layers.

## Capabilities

### New Capabilities
- `e2e-test-harness`: reusable infrastructure that boots the real NestFastifyApplication against a dedicated Postgres `_test` DB, guarantees per-test isolation (truncate + admin re-seed), and exposes auth/factory/request helpers. Includes the safety rule that the suite refuses to run against a non-`_test` database.
- `pdv-e2e-scenarios`: the authoritative behavioral coverage for the PDV flow — RT01–RT09 — asserting the happy-path lifecycle end-to-end (with cent-exact cash-summary math), every error code with its HTTP status + body code, and the ADMIN/OPERADOR/anonymous permission + ownership matrix.
- `error-http-status-contract`: the canonical error-code → HTTP-status table (including the 5 corrections) that `domain-error.mapper.ts` must satisfy; the e2e asserts are the enforcement of this contract.
- `error-code-i18n-coverage`: the guarantee, enforced by an automated static check, that every backend error code has a `pt` and `en` translation and a mobile failure-mapper entry, with a generic fallback.
- `web-browser-e2e`: browser-driven (Playwright) coverage of the Next.js admin console against the live backend + `_test` Postgres — real login/session, admin CRUD flows, auth redirect and role gating, and translated error rendering.
- `mobile-emulator-e2e`: emulator-driven (Flutter `integration_test`) coverage of the PDV operator flow against the live backend + `_test` Postgres — real login, cash open, product lookup, sale build, split payment, finalize, close, and a translated error surface.

### Modified Capabilities
<!-- The 5 status corrections touch behavior implied by existing *-api specs, but those specs do not pin these exact statuses; the corrected contract is captured in the new error-http-status-contract capability rather than as delta specs. -->

## Impact

- **Code:** new `apps/backend/test/**` (utils + 9 e2e specs + i18n guard); edits to `apps/backend/src/shared/errors/domain-error.mapper.ts` (5 status changes); edits to `apps/backend/src/shared/errors/domain-error.mapper.spec.ts` to match; mobile edits in `apps/mobile/lib/l10n/app_pt.arb`, `app_en.arb`, regenerated `app_localizations*.dart`, and affected `apps/mobile/lib/domain/*/errors/*_failure.dart` + datasource mappers.
- **New web tooling:** Playwright added to `apps/web` (dev dep + `playwright.config.ts` + `apps/web/e2e/**`) — first browser-test stack in the web app (today only `vitest`).
- **New mobile tooling:** `integration_test` added to `apps/mobile` `pubspec.yaml` dev deps + `apps/mobile/integration_test/**` — first emulator-test stack in the mobile app.
- **Config/infra:** dedicated `_test` Postgres database (reuses existing `docker-compose` postgres service), a test `DATABASE_URL` (`.env.test` or equivalent) isolated from `.env` (Neon), and test scripts that apply migrations + seed before running; a full-stack orchestration entrypoint that boots backend + web (+ starts/targets an emulator) so the UI layers run against the live stack. Android emulator reaches the host backend via `10.0.2.2`.
- **Contract:** 5 error codes change HTTP status — consumers relying on the old statuses (mobile) are updated in the same change; any other client must be reviewed.
- **Affected existing specs (behavioral overlap, statuses now pinned by `error-http-status-contract`):** `inventory-movement-api`, `cash-session-api`, `user-management-api`, `product-catalog-api`, `sale-api`.
- **Dependencies:** no new runtime deps; uses existing Jest/supertest, Prisma, Docker Postgres, and Flutter `gen-l10n`.
