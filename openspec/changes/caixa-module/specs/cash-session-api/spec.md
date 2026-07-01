## ADDED Requirements

### Requirement: Cash session HTTP routes

The system SHALL expose the cash-session use cases over HTTP from `apps/backend/src/modules/caixa` controllers, behind an authentication guard (`@ApiBearerAuth`) and tagged `@ApiTags('caixa')`. The `operadorId` MUST be derived from the authenticated user and never read from the request body. The routes are:

| Verb | Route | Use case |
|---|---|---|
| POST | `/caixa/abrir` | `abrir-caixa` |
| POST | `/caixa/:id/fechar` | `fechar-caixa` |
| POST | `/caixa/:id/sangria` | `registrar-sangria` |
| POST | `/caixa/:id/suprimento` | `registrar-suprimento` |
| GET | `/caixa/aberto` | `caixa-aberto-do-operador` |
| GET | `/caixa/:id/resumo` | `resumo-sessao` |
| GET | `/caixa/:id/movimentacoes` | `listar-movimentacoes` |

#### Scenario: Open cash happy path

- **WHEN** `POST /caixa/abrir` is called by an authenticated operator with `{ valorAbertura ≥ 0 }`
- **THEN** the `abrir-caixa` use case runs with `operadorId` from the token and a `SessaoOutDTO` is returned with `201`/`200`

#### Scenario: Get the operator's open session

- **WHEN** `GET /caixa/aberto` is called
- **THEN** the operator's `ABERTO` session is returned, or an empty body when none exists

#### Scenario: registrar-venda is not a public route

- **WHEN** inspecting the controller routes
- **THEN** there is no public route that creates a `VENDA` movement; sale movements only enter via the cash port

### Requirement: Error code to HTTP status mapping

The system SHALL map each cash-session domain error to the correct HTTP status: `CASH_SESSION_ALREADY_OPEN → 409`, `CASH_SESSION_NOT_FOUND → 404`, `CASH_SESSION_ALREADY_CLOSED → 409`, `PENDING_SALE_IN_SESSION → 422`, and invalid input → `400`. Mapping uses NestJS exceptions (`ConflictException`, `NotFoundException`, `UnprocessableEntityException`, `BadRequestException`) and is documented with `@ApiResponse` per status.

#### Scenario: Double open is rejected with 409

- **WHEN** `POST /caixa/abrir` runs for an operator that already has an open session
- **THEN** the response is `409` from `CASH_SESSION_ALREADY_OPEN`

#### Scenario: Close unknown session returns 404

- **WHEN** `POST /caixa/:id/fechar` targets a non-existent session
- **THEN** the response is `404` from `CASH_SESSION_NOT_FOUND`

#### Scenario: Close already-closed session returns 409

- **WHEN** `POST /caixa/:id/fechar` targets a `FECHADO` session
- **THEN** the response is `409` from `CASH_SESSION_ALREADY_CLOSED`

#### Scenario: Close with pending sale returns 422

- **WHEN** `POST /caixa/:id/fechar` targets a session with a sale still `ABERTA`
- **THEN** the response is `422` from `PENDING_SALE_IN_SESSION`

#### Scenario: Sangria/suprimento on unknown session returns 404

- **WHEN** `POST /caixa/:id/sangria` or `POST /caixa/:id/suprimento` targets a non-existent session
- **THEN** the response is `404` from `CASH_SESSION_NOT_FOUND`

### Requirement: Cash session DTOs

The system SHALL define typed In/Out DTOs. Input: `AbrirCaixaInDTO { valorAbertura: number (≥ 0) }`, `FecharCaixaInDTO { valorFechamento: number (≥ 0) }`, `MovimentacaoInDTO { valor: number (> 0), observacao: string (required) }`. Output: `SessaoOutDTO` (id, operadorId, status, values, dates), `ResumoSessaoOutDTO { abertura, suprimentos, vendasDinheiro, sangrias, esperado, contado?, divergencia? }`, `MovimentacaoOutDTO { id, tipo, valor, observacao?, criadaEm }`.

#### Scenario: Summary route returns the full resumo shape

- **WHEN** `GET /caixa/:id/resumo` succeeds for an open session
- **THEN** the body contains `{ abertura, suprimentos, vendasDinheiro, sangrias, esperado }` (with `contado`/`divergencia` present once closed)

#### Scenario: Movement input requires positive value and observation

- **WHEN** `POST /caixa/:id/sangria` is called with `valor ≤ 0` or a missing `observacao`
- **THEN** the response is `400` (validation) and no movement is recorded

### Requirement: Prisma persistence with Decimal money

The system SHALL persist `SessaoCaixa` and `MovimentacaoCaixa` via Prisma models declared in `prisma/models/caixa.model.prisma`, with monetary fields typed as `Decimal` (never `float`). A `*.prisma.ts` adapter implements `CaixaRepository` and `CaixaQuery` with `toDomain`/`fromDomain` mappings. The migration is versioned SQL and `prisma generate` is run.

#### Scenario: Round-trip mapping preserves precision

- **WHEN** a session/movement is saved and reloaded through the adapter
- **THEN** `toDomain`/`fromDomain` reconstruct the domain object with monetary values intact and no floating-point drift

### Requirement: Partial unique index enforces one open session per operator

The system SHALL create a partial unique index on `SessaoCaixa.operadorId WHERE status = ABERTO`, so the "one open session per operator" invariant holds at the database level even under concurrency, complementing the `abrir-caixa` use-case check.

#### Scenario: Concurrent double-open is blocked by the index

- **WHEN** two `abrir-caixa` requests for the same operator race past the use-case check
- **THEN** the second insert violates the partial unique index and only one `ABERTO` session exists

### Requirement: Transactional movement registration

The system SHALL run any operation that creates a movement together with related state changes inside a single transaction (`TransactionManager` / `runInTransaction`). On failure the whole operation rolls back, leaving no orphan movement.

#### Scenario: Failure rolls back the movement

- **WHEN** registering a movement fails partway through the transaction
- **THEN** no `MovimentacaoCaixa` row is persisted and session state is unchanged
