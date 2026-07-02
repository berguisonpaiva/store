## 1. Test infrastructure (Subagent 1 — prerequisite for all others)

- [x] 1.1 Add a dedicated test Postgres database whose name ends in `_test` (reuse the existing docker-compose `postgres` service) and a test-only `DATABASE_URL` in `.env.test` (or equivalent), isolated from `.env` (Neon)
- [x] 1.2 Wire `test:e2e` to load the test env and ensure a documented one-command run applies `prisma migrate deploy` + admin seed before executing; confirm `test/jest-e2e.json` picks up `test/**/*.e2e-spec.ts`
- [x] 1.3 Create `test/utils/create-test-app.ts` booting `AppModule` as `NestFastifyApplication`, applying production global pipes/filters, and awaiting `getHttpAdapter().getInstance().ready()` after `app.init()`
- [x] 1.4 Create `test/utils/db.ts` with `truncateAll()` (`TRUNCATE ... RESTART IDENTITY CASCADE`) and the `_test`-name safety interlock that throws before connecting if the DB name does not end in `_test`
- [x] 1.5 Create `test/utils/auth.ts` with `loginAsAdmin()`, `createOperador()`, `loginAsOperador()` returning bearer tokens; add a shared request helper that sets `Authorization: Bearer <token>`
- [x] 1.6 Create `test/utils/factories.ts` with `criarCategoria()`, `criarProdutoComVariacao()`, `darEntradaEstoque()`, `abrirCaixa()`, `criarVendaComItem()` driving the real HTTP API; add a shared `beforeEach` that truncates + re-seeds admin
- [x] 1.7 Add an error-assertion helper that checks HTTP status + stable code in the body (tolerant to `message` equal/contains)
- [x] 1.8 **Gate:** `cd apps/backend && bun run db:start && bun run prisma:migrate:deploy` then a smoke e2e boots the app and logs in as admin — `bun run test:e2e -- --testPathPattern=smoke`

## 2. Error-status contract correction (do before asserting statuses)

- [x] 2.1 Correct `apps/backend/src/shared/errors/domain-error.mapper.ts` (minimal diff): `ESTOQUE_INSUFICIENTE`→422, `NO_OPEN_CASH_SESSION`→409, `CANNOT_DEACTIVATE_SELF`→400, `VALOR_INVALIDO`→400, `INVALID_PRICE`→400
- [x] 2.2 Update `apps/backend/src/shared/errors/domain-error.mapper.spec.ts` to assert the corrected statuses; confirm the full canonical table (`error-http-status-contract` spec) is represented
- [x] 2.3 Verify no backend code path depends on the old statuses (grep for status-based branching); check whether the web app consumes any of the 5 codes and flag if so
- [x] 2.4 **Gate:** `cd apps/backend && bun test src/shared/errors/domain-error.mapper.spec.ts`

## 3. Auth, users, permissions (Subagent 2 — RT01–RT03)

- [x] 3.1 `test/auth.e2e-spec.ts` — all RT01 scenarios (login success/failures, `/auth/me` valid/missing/invalid, refresh valid/invalid)
- [x] 3.2 `test/users.e2e-spec.ts` — all RT02 scenarios (create/duplicate/invalid role & VO, patch-not-found, deactivate→login→reactivate, cannot-deactivate-self, pagination)
- [x] 3.3 `test/permissions.e2e-spec.ts` — RT03 matrix for ADMIN/OPERADOR/anonymous across all guarded endpoints, plus cross-operator ownership on `GET /caixa/:id`, `GET /vendas/:id`, and `POST /caixa/:id/sangria`
- [x] 3.4 **Gate:** `cd apps/backend && bun run test:e2e -- --testPathPattern="auth|users|permissions"`

## 4. Catalog and inventory (Subagent 3 — RT04–RT06)

- [ ] 4.1 `test/categories.e2e-spec.ts` — RT04 (create/duplicate/rename-collision, patch-not-found, inactive blocks product then reactivate, active filter)
- [ ] 4.2 `test/products.e2e-spec.ts` — RT05 (create with variations, must-have-variation, category-not-found, duplicate SKU/barcode, invalid price → 400, not-found reads, by-sku/by-barcode lookups)
- [ ] 4.3 `test/inventory.e2e-spec.ts` — RT06 (entry updates balance, non-positive qty, exit>balance → 422 `ESTOQUE_INSUFICIENTE`, variation-not-found, absolute adjustment + negative → 400 `SALDO_INVALIDO`, ledger listing, low-stock)
- [ ] 4.4 **Gate:** `cd apps/backend && bun run test:e2e -- --testPathPattern="categories|products|inventory"`

## 5. Cash session, sales, full flow (Subagent 4 — RT07–RT09)

- [ ] 5.1 `test/caixa.e2e-spec.ts` — RT07 (open, double-open → `CAIXA_JA_ABERTO`, two operadores, negative value → 400, sangria/suprimento valid + non-positive, foreign/closed guards, cent-exact summary, close guards incl. `VENDA_PENDENTE_NO_FECHAMENTO`/not-found, admin-close, empty `/caixa/aberto`)
- [ ] 5.2 `test/vendas.e2e-spec.ts` — RT08 (no-open-session → 409 `NO_OPEN_CASH_SESSION`, add item by id/sku/barcode, all add-item failures, qty/remove failures, discount failures, payment/finalize failures, exact split finalize, operations-on-finalized, rollback on stock depletion, cancel open/finalized, cash-session-closed guards, sale-not-found, list scoping)
- [ ] 5.3 `test/fluxo-completo.e2e-spec.ts` — RT09 single sequential flow with per-step asserts and cent-exact final cash summary
- [ ] 5.4 Confirm real success statuses/contracts against the running app (e.g. `finalizar` 200 vs 201, `/caixa/aberto` empty vs 404) and assert the observed value
- [ ] 5.5 **Gate:** `cd apps/backend && bun run test:e2e -- --testPathPattern="caixa|vendas|fluxo"`

## 6. Translations and i18n guard (Subagent 5)

- [ ] 6.1 Extract the full error-code list from the 7 error files (`user-error.ts`, `auth-error.ts`, `category-error.ts`, `product-error.ts`, `estoque.error.ts`, `venda.error.ts`, `caixa.error.ts`)
- [ ] 6.2 Add any missing keys to `apps/mobile/lib/l10n/app_pt.arb` and `app_en.arb` following the existing convention; run `flutter gen-l10n` to regenerate `app_localizations*.dart`
- [ ] 6.3 Ensure each mobile failure mapper (`apps/mobile/lib/domain/*/errors/*_failure.dart`) + datasource covers its codes with a generic fallback; realign any mapping affected by the 5 corrected statuses
- [ ] 6.4 Add an automated static guard (Node script in backend) that fails, listing every gap, if any code lacks a pt or en key
- [ ] 6.5 **Gate:** `cd apps/mobile && flutter gen-l10n && flutter analyze && flutter test` and run the i18n guard green

## 7. Full-stack orchestration (Subagent 7 — prerequisite for web/mobile UI e2e)

- [x] 7.1 Add a single orchestration entrypoint that boots the backend against `_test` Postgres (migrated + admin-seeded, `_test` interlock enforced) and exposes a state-reset hook (truncate + admin re-seed) reusable by the UI layers
- [x] 7.2 Extend the entrypoint to start the Next.js web server for web e2e and to point the mobile app's base URL at the host backend per platform (Android `10.0.2.2`, iOS `localhost`) via the app's env/config
- [x] 7.3 **Gate:** the entrypoint brings the stack up against an empty `_test` DB and a connectivity smoke check reaches the backend from both the browser and the emulator address

## 8. Web browser e2e (Subagent 8 — Playwright, `web-browser-e2e`)

- [x] 8.1 Add Playwright to `apps/web` (dev dep + `playwright.config.ts`, single Chromium target) and an `apps/web/e2e/` folder wired to the orchestration entrypoint + per-spec reset
- [x] 8.2 Auth/guard specs: admin login through the UI, unauthenticated redirect, role-gated navigation hides admin-only areas
- [ ] 8.3 Admin CRUD specs: create operador; create category + product with variation; inventory balance/movements render; cash-session admin view lists sessions — all against the live backend
- [x] 8.4 Translated-error spec: duplicate category surfaces the localized message (not the raw code)
- [ ] 8.5 Prefer role/label/test-id selectors; add stable `data-testid` where needed
- [ ] 8.6 **Gate:** run the web browser e2e from an empty `_test` DB via the orchestration entrypoint (green, traces/screenshots on failure)

## 9. Mobile emulator e2e (Subagent 9 — Flutter `integration_test`, `mobile-emulator-e2e`)

- [ ] 9.1 Add `integration_test` to `apps/mobile` `pubspec.yaml` dev deps and create `apps/mobile/integration_test/` wired to the orchestration entrypoint + base-URL config for the emulator host address
- [ ] 9.2 Harness guards: fail fast with a clear message when no emulator/device is booted; reset backend state between tests for order-independence
- [ ] 9.3 Auth specs: operator login through the app; invalid credentials show the localized message
- [ ] 9.4 PDV flow spec: open cash → product lookup (sku/barcode) → add item → split payment (DINHEIRO + PIX) → finalize → close cash, asserting the visible outcome and that the backend reflects decremented stock + VENDA movement + a consistent closing summary
- [ ] 9.5 Translated-error spec: insufficient stock surfaces the localized message during the PDV flow
- [ ] 9.6 **Gate:** run the mobile emulator e2e from an empty `_test` DB on a booted emulator via the orchestration entrypoint (green)

## 10. Review and full-suite validation (Subagent 10)

- [ ] 10.1 Run the entire backend suite from a freshly created empty `_test` DB; confirm order-independence (no test depends on another's state)
- [ ] 10.2 Confirm every error code in RT01–RT09 has at least one test asserting status + code, every code has pt/en translation, and no e2e uses a repository/DB mock
- [ ] 10.3 Confirm `domain-error.mapper.ts` matches the canonical table for all codes
- [ ] 10.4 Run the web browser e2e and the mobile emulator e2e from empty `_test` DB via the orchestration entrypoint; confirm both cover their critical flows + a translated-error surface
- [ ] 10.5 **Gate:** `cd apps/backend && bun run db:start && bun run prisma:migrate:deploy && bun run test:e2e` then `bun lint && turbo build`; `cd apps/web && bun run test && bunx playwright test`; `cd apps/mobile && flutter analyze && flutter test && flutter test integration_test`
