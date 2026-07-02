## Context

The backend is Clean Architecture: pure domain in `modules/*`, a NestJS+Fastify shell in `apps/backend`, and a Flutter mobile in `apps/mobile`. Failures flow as `Result` errors carrying stable string codes; `apps/backend/src/shared/errors/domain-error.mapper.ts` translates the first code into a NestJS HTTP exception, and the mobile translates the same codes to localized `Failure`s. Today the only e2e is a single smoke test; there is no real-HTTP coverage of the sale lifecycle, the error→status contract, the permission matrix, or the code→translation coverage.

Ground truth already gathered: 7 error-code files (~45 codes), the mapper's current status table, the real route+role map for all controllers, an existing `test/jest-e2e.json` + `test:e2e`/`db:start`/`prisma:migrate:deploy` scripts, a Docker `postgres:16-alpine` service (`docker:docker@localhost:5432/docker`), a `.env` pointing at remote Neon, and an idempotent `seedAdmin` (`admin@store.local`/`Admin!123`). The user has decided the task's HTTP table is source of truth, so 5 codes get corrected in the mapper and the mobile realigned.

## Goals / Non-Goals

**Goals:**
- Real HTTP e2e (Jest+supertest) against the full Nest+Fastify app and a real Postgres `_test` DB, no mocks/fakes.
- Assert every error code by HTTP status + body code, the full permission/ownership matrix, and a cent-exact end-to-end flow.
- Add browser-driven web e2e (Playwright) and emulator-driven mobile e2e (Flutter `integration_test`), both running against the **live backend + `_test` Postgres** (full-stack), covering the critical console/PDV flows and translated error rendering.
- Correct the 5 divergent statuses in the mapper (+ its unit spec) and realign the mobile failure mappers.
- Static guard proving every error code has pt+en translations and a mobile failure mapping.
- One-command run from an empty DB; hard guarantee tests never touch the Neon/dev DB.

**Non-Goals:**
- No new product features or endpoints; no renaming of error codes (mobile contract).
- No load/perf testing, no CI pipeline authoring (guards must be CI-runnable, but wiring CI is out of scope).
- No rewrite of existing unit/domain tests beyond the mapper spec.
- UI e2e (web/mobile) covers the **critical flows + translated error surfaces**, not a 1:1 re-test of every RT error case (the backend HTTP e2e owns exhaustive error coverage).
- No cross-browser matrix (a single Chromium target for web); no iOS-device farm (one local emulator/simulator target).

## Decisions

- **Real DB over Testcontainers/sqlite.** Reuse the existing Docker `postgres` service with a separate `_test` database via a test-only `DATABASE_URL`. Rationale: the suite must exercise real Prisma SQL (the `/low-stock` regression was a real-SQL bug); Testcontainers adds a dependency and startup cost, sqlite diverges from Postgres semantics. Alternative (Neon branch per run) rejected: network-bound and risks prod credentials.
- **DB safety interlock.** The harness asserts the resolved database name ends in `_test` and throws otherwise before connecting. Rationale: `.env` points at Neon; a misconfigured env must fail loud, never truncate prod. Alternative (trusting env discipline) rejected as too dangerous given truncate-per-test.
- **Isolation = truncate + re-seed per test.** `beforeEach` runs `TRUNCATE ... RESTART IDENTITY CASCADE` then re-seeds admin. Rationale: order-independence and cheapest reliable reset; per-file transactions-with-rollback don't compose with the app's own `$transaction` usage. Alternative (drop/recreate schema per test) rejected as far slower.
- **Factories drive the real API, not the DB.** `criarProdutoComVariacao`, `abrirCaixa`, etc. call HTTP so tests reflect real controller/guard/mapper behavior; direct Prisma writes only for preconditions the API can't express (e.g. forcing a deactivated user before a login test, or depleting stock mid-flight for the rollback test). Rationale: maximize contract coverage; keep DB pokes explicit and rare.
- **Assert status + body code, tolerant to body shape.** The mapper passes the code as the exception message, so the body exposes it via `message`. Helpers assert status and that the code appears in the body (`message` equal/contains), rather than hard-coding one JSON shape. Rationale: resilient to Nest/Fastify serialization details while still pinning the contract.
- **Mapper correction is the minimal diff.** Only the 5 codes move; `domain-error.mapper.spec.ts` updates to match. The e2e `error-http-status-contract` scenarios then re-assert the whole table end-to-end. Rationale: smallest blast radius on a mobile contract change.
- **i18n guard is a Node script in the backend.** It extracts codes from the 7 error files (regex/AST over the exported constants) and diffs against keys in both `.arb` files, listing all gaps. Rationale: runs in the same Bun toolchain as the suite and can gate CI without Flutter; a Dart test is the alternative but couples the guard to the mobile toolchain.
- **Playwright for web browser e2e.** `apps/web` has only `vitest` today; add Playwright (`apps/web/e2e/`, `playwright.config.ts`). Rationale: de-facto standard for Next.js browser e2e, auto-wait reduces flakiness, first-class trace/screenshot on failure. Cypress rejected: heavier, weaker multi-tab/parallelism story. Web e2e targets a single Chromium.
- **Flutter `integration_test` for mobile emulator e2e.** Add the `integration_test` dev dep + `apps/mobile/integration_test/`. Rationale: official Flutter on-device/emulator harness, reuses `flutter_test` finders already known in the repo. `patrol` considered for native-dialog control but rejected to avoid a new heavyweight dep; revisit only if permission dialogs block the flow.
- **Full-stack orchestration entrypoint.** A single script boots backend (against `_test` Postgres, migrated+seeded), starts the web dev/preview server for web e2e, and for mobile points the app's base URL at the host backend — Android emulator via `10.0.2.2`, iOS simulator via `localhost` — through the existing env/base-URL config. Rationale: UI layers must hit the same live stack the backend e2e validates; centralizing startup keeps the `_test` interlock and reset logic in one place. Alternative (each layer boots its own stack) rejected as duplicative and drift-prone.
- **UI isolation reuses backend reset.** Web/mobile specs reset state via the backend truncate + admin re-seed (through a test-only reset path or by re-running the seed), not by poking Postgres from the browser/emulator. Rationale: one reset mechanism, honoring the `_test` interlock.

## Risks / Trade-offs

- **[Truncate hits the wrong DB] → Mitigation:** name-ends-with-`_test` interlock + a dedicated `.env.test`; never read `.env` for the suite.
- **[HTTP status change breaks other clients] → Mitigation:** mobile failure mappers updated in the same change; Impact lists the 5 codes; web/other consumers flagged for review in tasks.
- **[Fastify not ready → flaky first requests] → Mitigation:** always `await getHttpAdapter().getInstance().ready()` after `init()` in `create-test-app.ts`.
- **[Truncate-per-test is slow at scale] → Mitigation:** `RESTART IDENTITY CASCADE` in one statement; keep factories lean; acceptable for the current suite size.
- **[Enum/route assumptions drift from reality (e.g. finalize returns 201 not 200, `/caixa/aberto` empty vs 404)] → Mitigation:** tasks require confirming actual status/shape from the running app and asserting the real contract, not the doc's guess.
- **[i18n key naming convention mismatch] → Mitigation:** the guard maps code→key by the existing convention; where a code has no key, add following the nearest existing example (e.g. `inventoryErrorInsufficientStock`).
- **[Emulator→host networking (`10.0.2.2`) misconfigured] → Mitigation:** drive the base URL through the app's env/config, assert connectivity in an early smoke step, and document the emulator/simulator address per platform.
- **[No emulator in CI / mobile e2e flakiness] → Mitigation:** the mobile harness fails fast when no device is booted; treat mobile e2e as a locally/opt-in CI-gated lane rather than a blocking default; keep flows to the critical PDV path to bound runtime.
- **[Full-stack UI e2e is slow/flaky vs backend HTTP e2e] → Mitigation:** keep UI coverage to critical flows + translated-error surfaces (not exhaustive RT re-tests); rely on Playwright/`integration_test` auto-wait; capture traces/screenshots on failure.
- **[Orchestration starts servers that hit the wrong DB] → Mitigation:** the single entrypoint owns the `_test` interlock; backend refuses non-`_test` DBs before serving, so web/mobile can only ever reach a `_test`-backed stack.
- **[Web UI selectors drift and break tests] → Mitigation:** prefer role/label/test-id selectors over brittle CSS; add stable `data-testid` where needed.

## Migration Plan

1. Land the mapper correction + updated `domain-error.mapper.spec.ts` and mobile failure-mapper realignment together (contract change is atomic).
2. Add harness + specs; run against a fresh `_test` DB.
3. Add i18n guard; add any missing translations; regenerate `app_localizations*.dart`.
4. Rollback: revert is safe — the change is additive (tests, guard) plus a localized mapper/mobile diff; reverting restores prior statuses. No data migration.

## Open Questions

- Exact success status of `POST /vendas/:id/finalizar` (200 vs 201) and the `GET /caixa/aberto` empty contract — resolved by observing the running app during Subagent 4, then asserting the real value.
- Whether the web app consumes any of the 5 corrected statuses — to be checked before merge (flagged in tasks); mobile is the known consumer.
