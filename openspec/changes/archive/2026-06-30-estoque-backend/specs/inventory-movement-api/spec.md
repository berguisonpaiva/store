## ADDED Requirements

### Requirement: Inventory persistence schema

The system SHALL define Prisma models `MovimentacaoEstoque` (append-only ledger: `tipo`, `motivo`, `quantidade`, `saldoResultante`, optional `origemVendaId`, `variacaoId` FK, `createdAt`) and `EstoqueSaldo` (per-variation balance projection keyed by a unique `variacaoId`: `saldoAtual`, `quantidadeReservada` default 0, `estoqueMinimo` seeded from catalog `Variation.minStock`). Check constraints that `saldoAtual >= 0` and `quantidadeReservada >= 0` exist only as redundant safety nets; the invariants are enforced in `@repo/estoque`. The ledger is never updated or deleted by the adapters.

#### Scenario: Schema present

- **WHEN** `apps/backend/prisma/models/estoque.model.prisma` is inspected
- **THEN** `MovimentacaoEstoque` and `EstoqueSaldo` models exist with the described columns, the `variacaoId` unique on the projection, and the redundant non-negative checks

#### Scenario: Ledger is append-only

- **WHEN** the inventory adapters are inspected
- **THEN** there is no update or delete operation on `MovimentacaoEstoque`; corrections are recorded as new movements

### Requirement: Inventory repository adapter with single-transaction write

The system SHALL implement the domain `EstoqueRepository` as a Prisma adapter whose write persists, atomically, both the `MovimentacaoEstoque` ledger entry (with its `saldoResultante`) and the updated `EstoqueSaldo.saldoAtual` — both or neither — using the existing `runInTransaction`/`TransactionManager`. The current balance row MUST be read under a row lock (`SELECT ... FOR UPDATE`) so concurrent movements on the same variation do not race on `saldoResultante`. The adapter maps to/from the domain and returns `Result`.

#### Scenario: Both writes commit together

- **WHEN** a stock command completes successfully
- **THEN** the ledger movement and the new `saldoAtual` are persisted together in a single transaction (RF-EST-03)

#### Scenario: Partial failure rolls back

- **WHEN** persisting the movement or the new `saldoAtual` fails mid-transaction
- **THEN** neither the movement nor the balance change is applied (RF-EST-03)

#### Scenario: Concurrent movements are serialized

- **WHEN** two movements on the same variation are applied concurrently
- **THEN** the balance row is locked per transaction so each `saldoResultante` is computed over the committed predecessor

### Requirement: EstoquePort implementation for the sales module

The system SHALL provide an `EstoquePort` implementation (`darBaixa(variacaoId, qtd, origemVendaId)` / `estornar(...)`), wired in `EstoqueModule` via DI for later use by `vendas`, reusing the single-transaction write. `darBaixa` records a `SAIDA` movement with motivo `VENDA_PDV`/`VENDA_ONLINE` and the `origemVendaId`; `estornar` records a compensating `ENTRADA` linked to the same `origemVendaId`. There MUST be no controller route for sale-driven exits.

#### Scenario: darBaixa applied through the port

- **WHEN** the `EstoquePort.darBaixa` is invoked for a variation with enough available balance
- **THEN** a `SAIDA` `VENDA_*` movement with `origemVendaId` is recorded and `saldoAtual` decreases in the same transaction (RF-EST-09)

#### Scenario: estornar reverses a sale exit

- **WHEN** `EstoquePort.estornar` is invoked for a previously recorded sale exit
- **THEN** a compensating `ENTRADA` linked to the same `origemVendaId` is recorded and `saldoAtual` is restored (RF-EST-09)

#### Scenario: No sale-exit endpoint exposed

- **WHEN** the inventory controllers are inspected
- **THEN** no HTTP route registers a sale-driven exit; the port is reachable only via DI (RF-EST-09)

### Requirement: Stock entry endpoint

The system SHALL expose `POST /api/inventory/entries` (role-protected) that registers a stock entry by delegating to the `registrar-entrada` use case, accepting `variacaoId`, `quantidade` (> 0), `motivo` (COMPRA/DEVOLUCAO/AJUSTE), and an optional `observacao`.

#### Scenario: Valid entry

- **WHEN** an authorized user POSTs a valid entry to `POST /api/inventory/entries`
- **THEN** the response is 201 and the variation `saldoAtual` increases by `quantidade` (RF-EST-01)

#### Scenario: Unknown variation mapped to 404

- **WHEN** the entry returns `VARIACAO_NAO_ENCONTRADA`
- **THEN** the endpoint responds 404 Not Found

#### Scenario: Non-positive quantity mapped to 400

- **WHEN** the entry returns `QUANTIDADE_INVALIDA` (or fails DTO validation for `quantidade` ≤ 0)
- **THEN** the endpoint responds 400 Bad Request

### Requirement: Stock exit endpoint

The system SHALL expose `POST /api/inventory/exits` (role-protected) that registers a manual stock exit by delegating to the `registrar-saida` use case, accepting `variacaoId`, `quantidade` (> 0), `motivo` (PERDA/AJUSTE), and an optional `observacao`, and MUST NOT let the balance go negative.

#### Scenario: Valid exit

- **WHEN** an authorized user POSTs a valid exit with sufficient balance to `POST /api/inventory/exits`
- **THEN** the response is 201 and `saldoAtual` decreases by `quantidade` (RF-EST-02)

#### Scenario: Insufficient stock mapped to 409

- **WHEN** the exit returns `ESTOQUE_INSUFICIENTE`
- **THEN** the endpoint responds 409 Conflict and no movement is recorded (RF-EST-05)

### Requirement: Balance adjustment endpoint

The system SHALL expose `POST /api/inventory/adjustments` (role-protected, MASTER/ADMIN) that sets the variation balance to an absolute `novoSaldo` (≥ 0) by delegating to the `ajustar-saldo` use case, recording the difference as an AJUSTE movement, with a required justification `observacao`.

#### Scenario: Adjustment sets the balance

- **WHEN** an authorized user POSTs a valid adjustment to `POST /api/inventory/adjustments`
- **THEN** the response is 201, `saldoAtual` becomes `novoSaldo`, and a single AJUSTE movement for the difference is recorded (RF-EST-04)

#### Scenario: Negative target balance mapped to 400

- **WHEN** the adjustment returns `QUANTIDADE_INVALIDA` for `novoSaldo < 0`
- **THEN** the endpoint responds 400 Bad Request

### Requirement: Inventory module wiring and documentation

The system SHALL provide an `EstoqueModule` composing the domain use cases, the `EstoqueRepository`/`EstoqueQuery` adapters, and the `EstoquePort` provider via DI, register it in `app.module.ts`, extend the shared `domain-error.mapper` (`ESTOQUE_INSUFICIENTE`→409, `VARIACAO_NAO_ENCONTRADA`→404, `QUANTIDADE_INVALIDA`→400), and document every endpoint with Swagger/OpenAPI.

#### Scenario: Endpoints documented and wired

- **WHEN** the backend boots
- **THEN** the inventory command endpoints appear in the docs with auth requirements and resolve through the domain use cases (controllers contain no rules)

#### Scenario: Domain errors mapped uniformly

- **WHEN** any inventory endpoint returns a failed `Result` with an estoque code
- **THEN** the shared mapper translates it to the matching HTTP status (409/404/400)
