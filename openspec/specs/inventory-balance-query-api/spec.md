# inventory-balance-query-api Specification

## Purpose
TBD - created by archiving change estoque-backend. Update Purpose after archive.
## Requirements
### Requirement: Inventory query adapter

The system SHALL implement the domain `EstoqueQuery` as a Prisma adapter exposing the read projections — current/available balance for a variation, ledger movements filtered by period and paginated, and variations below their minimum stock — returning read DTOs and never the mutable ledger entity.

#### Scenario: Read DTOs only

- **WHEN** any inventory query adapter method runs
- **THEN** it returns read projections (DTOs), never the mutable `MovimentacaoEstoque` or `EstoqueSaldo` entity

### Requirement: Consult balance endpoint

The system SHALL expose `GET /api/inventory/variations/:variacaoId/balance` (role-protected) that delegates to the `consultar-saldo` query and returns the variation `saldoAtual` and `saldoDisponivel = saldoAtual − quantidadeReservada`.

#### Scenario: Returns current and available balance

- **WHEN** an authorized user GETs the balance for an existing variation
- **THEN** the response is 200 with `saldoAtual` and `saldoDisponivel` (RF-EST-06)

#### Scenario: Unknown variation mapped to 404

- **WHEN** the query returns `VARIACAO_NAO_ENCONTRADA`
- **THEN** the endpoint responds 404 Not Found

### Requirement: List movements endpoint

The system SHALL expose `GET /api/inventory/variations/:variacaoId/movements` (role-protected) that delegates to the `listar-movimentacoes` query, supporting a period (date-range) filter and pagination, returning the matching ledger movements ordered by date.

#### Scenario: Paginated, period-filtered listing

- **WHEN** `GET /api/inventory/variations/:variacaoId/movements?page=1&pageSize=20&from=...&to=...` is called
- **THEN** a paginated payload of movements (tipo, motivo, quantidade, saldoResultante, timestamp) ordered by date is returned (RF-EST-07)

#### Scenario: Empty period

- **WHEN** the variation has no movements in the requested period
- **THEN** the endpoint responds 200 with an empty paginated result, not an error

### Requirement: List below-minimum endpoint

The system SHALL expose `GET /api/inventory/low-stock` (role-protected, MASTER/ADMIN) that delegates to the `listar-abaixo-do-minimo` query, returning the variations whose `saldoAtual` is below their `estoqueMinimo`, to drive replenishment alerts.

#### Scenario: Returns variations needing replenishment

- **WHEN** an authorized user GETs `/api/inventory/low-stock`
- **THEN** the response is 200 with the variations where `saldoAtual < estoqueMinimo`, including their current and minimum balances (RF-EST-08)

#### Scenario: Variation at or above minimum excluded

- **WHEN** a variation has `saldoAtual` ≥ `estoqueMinimo`
- **THEN** it is not included in the result

### Requirement: Query endpoints wiring and documentation

The system SHALL wire the read endpoints in `EstoqueModule` over the `EstoqueQuery` adapter via DI and document each with Swagger/OpenAPI, with controllers containing no rules.

#### Scenario: Read endpoints documented and wired

- **WHEN** the backend boots
- **THEN** the inventory query endpoints appear in the docs with auth requirements and resolve through the domain queries

