## ADDED Requirements

### Requirement: Real application boot for e2e tests

The harness SHALL boot the full production `AppModule` as a `NestFastifyApplication` using `FastifyAdapter`, applying the same global pipes/filters as production, and SHALL await `app.getHttpAdapter().getInstance().ready()` after `app.init()` so Fastify is fully routed before any request. Tests SHALL issue requests via `supertest(app.getHttpServer())`.

#### Scenario: App boots and serves authenticated requests

- **WHEN** a spec calls the harness `createTestApp()` and logs in with the seeded admin
- **THEN** the app instance is returned ready, `POST /auth/login` returns a token, and an authenticated request with `Authorization: Bearer <token>` succeeds

#### Scenario: Global error mapping is active

- **WHEN** any request triggers a domain failure
- **THEN** the response uses the production `domain-error.mapper` mapping (correct HTTP status and stable code in the body), not a raw 500

### Requirement: Dedicated test database with migrations and seed

The harness SHALL run exclusively against a dedicated local Postgres database whose name ends in `_test`, configured by a test-only `DATABASE_URL` (e.g. `.env.test`) isolated from the dev/prod `.env`. Before the suite runs, migrations SHALL be applied (`prisma migrate deploy`) and the admin SHALL be seeded. The whole suite SHALL be runnable from an empty database with a single command.

#### Scenario: Suite refuses a non-test database

- **WHEN** the resolved test `DATABASE_URL` does not target a database whose name ends in `_test`
- **THEN** the harness throws before opening any connection or running any test, with a message naming the offending database

#### Scenario: One-command run from empty database

- **WHEN** the documented test command is run against a freshly created empty `_test` database
- **THEN** migrations are applied, the admin is seeded, and the suite executes without manual setup steps

### Requirement: Per-test isolation via truncate and re-seed

The harness SHALL provide `truncateAll()` that truncates every application table in FK-safe order (or via `TRUNCATE ... RESTART IDENTITY CASCADE`) and SHALL, in `beforeEach`, truncate then re-seed the admin so tests are order-independent and share no residual state.

#### Scenario: Tests do not leak state

- **WHEN** two specs create entities with the same natural key (e.g. same category name) in sequence
- **THEN** neither observes the other's rows, because each test starts from a truncated + admin-seeded database

#### Scenario: Admin always present after reset

- **WHEN** any test begins
- **THEN** the seeded admin (`admin@store.local` / `Admin!123`, role ADMIN, active) can authenticate

### Requirement: Auth and data factory helpers

The harness SHALL expose helpers in `test/utils/`: `auth.ts` with `loginAsAdmin()`, `createOperador()` and `loginAsOperador()` returning usable bearer tokens; and `factories.ts` with `criarCategoria()`, `criarProdutoComVariacao()`, `darEntradaEstoque()`, `abrirCaixa()`, and `criarVendaComItem()`. Factories SHALL drive the real HTTP API (not direct DB writes) except where seeding a precondition the API cannot express.

#### Scenario: Factory builds a sellable variation

- **WHEN** a spec calls `criarProdutoComVariacao()` then `darEntradaEstoque()` for the returned variation
- **THEN** `GET /inventory/variations/:variacaoId/balance` reflects the entered quantity and the variation is sellable

#### Scenario: Operator token is distinct from admin

- **WHEN** a spec calls `createOperador()` then `loginAsOperador()`
- **THEN** the returned token authenticates as an OPERADOR distinct from the admin, usable for ownership-scoping tests

### Requirement: No repository or database mocks

The harness and all e2e specs SHALL NOT use repository mocks, in-memory query fakes, or database stubs. All persistence SHALL go through the real Prisma adapters against the `_test` Postgres.

#### Scenario: Review rejects mocks in e2e

- **WHEN** an e2e spec or util imports an in-memory repository/query or overrides a provider with a fake
- **THEN** it is out of contract for this capability and must be removed
