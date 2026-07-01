## MODIFIED Requirements

### Requirement: Inventory query adapter

The system SHALL implement the domain `EstoqueQuery` as a Prisma adapter exposing the read projections — current balance (`saldoAtual`) and minimum (`estoqueMinimo`) for a variation, ledger movements filtered by period and paginated, and variations below their minimum stock — returning read DTOs and never the mutable ledger entity. No reservation/available-balance projection is exposed.

#### Scenario: Read DTOs only

- **WHEN** any inventory query adapter method runs
- **THEN** it returns read projections (DTOs), never the mutable `MovimentacaoEstoque` or `EstoqueSaldo` entity

### Requirement: Consult balance endpoint

The system SHALL expose `GET /api/inventory/variations/:variacaoId/balance` (role-protected) that delegates to the `consultar-saldo` query and returns the variation `saldoAtual` and `estoqueMinimo`. The response MUST NOT include a `saldoDisponivel`/`quantidadeReservada` field.

#### Scenario: Returns current balance and minimum

- **WHEN** an authorized user GETs the balance for an existing variation
- **THEN** the response is 200 with `saldoAtual` and `estoqueMinimo` (RF-EST-06)

#### Scenario: Unknown variation mapped to 404

- **WHEN** the query returns `VARIACAO_NAO_ENCONTRADA`
- **THEN** the endpoint responds 404 Not Found
