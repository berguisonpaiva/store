# inventory-movement-api Specification

## Purpose
TBD - created by archiving change estoque-backend. Update Purpose after archive.
## Requirements
### Requirement: Inventory persistence schema

The system SHALL define Prisma models `MovimentacaoEstoque` (append-only ledger: `tipo`, `motivo`, `quantidade`, `saldoResultante`, optional `origemVendaId`, `variacaoId` FK, `createdAt`) and `EstoqueSaldo` (per-variation balance projection keyed by a unique `variacaoId`: `saldoAtual`, `estoqueMinimo` seeded from catalog `Variation.minStock`, timestamps). The `EstoqueSaldo` model MUST NOT carry a `quantidadeReservada` column. A check constraint that `saldoAtual >= 0` exists only as a redundant safety net; the invariants are enforced in `@repo/inventory`. The ledger is never updated or deleted by the adapters. A migration drops the previous `quantidadeReservada` column and its check constraint.

#### Scenario: Schema present

- **WHEN** `apps/backend/prisma/models/estoque.model.prisma` is inspected
- **THEN** `MovimentacaoEstoque` and `EstoqueSaldo` models exist with the described columns, the `variacaoId` unique on the projection, the redundant `saldoAtual >= 0` check, and no `quantidadeReservada` column

#### Scenario: Reservation column dropped by migration

- **WHEN** the inventory migration is applied
- **THEN** the `EstoqueSaldo.quantidadeReservada` column and its check constraint are removed

#### Scenario: Ledger is append-only

- **WHEN** the inventory adapters are inspected
- **THEN** there is no update or delete operation on `MovimentacaoEstoque`; corrections are recorded as new movements

### Requirement: Inventory repository adapter with single-transaction write

The system SHALL implement the domain `EstoqueRepository` as a Prisma adapter whose write persists, atomically, both the `MovimentacaoEstoque` ledger entry (with its `saldoResultante`) and the updated `EstoqueSaldo.saldoAtual` — both or neither. When the caller supplies a transaction context (a sale-driven `darBaixa`/`estornar`), the write MUST execute on that context (joining the sale's transaction); otherwise it uses the existing `runInTransaction`/`TransactionManager` to open its own. The current balance row MUST be read under a row lock (`SELECT ... FOR UPDATE`) so concurrent movements on the same variation do not race on `saldoResultante`. The adapter maps to/from the domain and returns `Result`.

#### Scenario: Both writes commit together

- **WHEN** a stock command completes successfully
- **THEN** the ledger movement and the new `saldoAtual` are persisted together in a single transaction (RF-EST-03)

#### Scenario: Write joins the caller's transaction when provided

- **WHEN** the write is invoked with a caller-supplied transaction context
- **THEN** the `SELECT ... FOR UPDATE`, ledger insert, and balance update run on that context and commit or roll back with the caller's transaction, without opening a separate one

#### Scenario: Partial failure rolls back

- **WHEN** persisting the movement or the new `saldoAtual` fails mid-transaction
- **THEN** neither the movement nor the balance change is applied (RF-EST-03)

#### Scenario: Concurrent movements are serialized

- **WHEN** two movements on the same variation are applied concurrently
- **THEN** the balance row is locked per transaction so each `saldoResultante` is computed over the committed predecessor

### Requirement: EstoquePort implementation for the sales module

The system SHALL provide an `EstoquePort` implementation (`darBaixa(variacaoId, qtd, origemVendaId, usuarioId, motivo?, tx?)` / `estornar(...)`), wired in `EstoqueModule` via DI for use by `vendas`, reusing the single-transaction write and passing through the caller's transaction context so the movement joins the sale's transaction. `darBaixa` records a `SAIDA` movement with motivo `VENDA_PDV`/`VENDA_ONLINE` and the `origemVendaId`; `estornar` records a compensating `ENTRADA` linked to the same `origemVendaId`. There MUST be no controller route for sale-driven exits.

#### Scenario: darBaixa applied through the port in the sale's transaction

- **WHEN** `EstoquePort.darBaixa` is invoked with the sale's transaction context for a variation with enough balance
- **THEN** a `SAIDA` `VENDA_*` movement with `origemVendaId` is recorded and `saldoAtual` decreases within the sale's transaction (RF-EST-09)

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

The system SHALL provide an `EstoqueModule` composing the domain use cases, the `EstoqueRepository`/`EstoqueQuery` adapters, and the `EstoquePort` provider via DI, register it in `app.module.ts`, extend the shared `domain-error.mapper` to cover every `EstoqueError` code (`ESTOQUE_INSUFICIENTE`→409, `LEDGER_IMUTAVEL`→409, `VARIACAO_NAO_ENCONTRADA`→404, `QUANTIDADE_INVALIDA`→400, `MOTIVO_MOVIMENTACAO_INVALIDO`→400, `SALDO_INVALIDO`→400), and document every endpoint with Swagger/OpenAPI.

#### Scenario: Endpoints documented and wired

- **WHEN** the backend boots
- **THEN** the inventory command endpoints appear in the docs with auth requirements and resolve through the domain use cases (controllers contain no rules)

#### Scenario: Domain errors mapped uniformly

- **WHEN** any inventory endpoint returns a failed `Result` with an estoque code
- **THEN** the shared mapper translates it to the matching HTTP status (`ESTOQUE_INSUFICIENTE`/`LEDGER_IMUTAVEL`→409, `VARIACAO_NAO_ENCONTRADA`→404, `QUANTIDADE_INVALIDA`/`MOTIVO_MOVIMENTACAO_INVALIDO`/`SALDO_INVALIDO`→400)

