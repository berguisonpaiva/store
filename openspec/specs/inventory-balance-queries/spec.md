# inventory-balance-queries Specification

## Purpose
TBD - created by archiving change estoque-domain. Update Purpose after archive.
## Requirements
### Requirement: Consult balance for a variation

The system SHALL provide a `consultar-saldo` query that returns, for a variation, its `saldoAtual` and its `estoqueMinimo`. The query reads through the `EstoqueQuery` port and MUST NOT expose the internal ledger entity. Stock reservation (`quantidadeReservada`/`saldoDisponivel`) is not part of the model; there is no separate "available balance".

#### Scenario: Returns current balance and minimum

- **WHEN** `consultar-saldo` runs for an existing variation
- **THEN** it returns `saldoAtual` and `estoqueMinimo` (RF-EST-06)

#### Scenario: Unknown variation

- **WHEN** `consultar-saldo` references a variation that does not exist
- **THEN** the query returns a failed `Result` with `VariacaoNaoEncontrada`

### Requirement: List movements by variation and period

The system SHALL provide a `listar-movimentacoes` query returning the ledger movements of a variation, filterable by period (date range) and paginated. Results are read projections (DTOs), never the mutable domain entity.

#### Scenario: List movements within a period

- **WHEN** `listar-movimentacoes` runs for a variation with a start/end date filter
- **THEN** it returns the matching movements (tipo, motivo, quantidade, saldoResultante, timestamp), paginated and ordered by date (RF-EST-07)

#### Scenario: Empty result

- **WHEN** a variation has no movements in the requested period
- **THEN** the query returns an empty paginated result, not an error

### Requirement: List variations below minimum stock

The system SHALL provide a `listar-abaixo-do-minimo` query returning the variations whose `saldoAtual` is below their `estoqueMinimo`, to drive replenishment alerts.

#### Scenario: Returns variations needing replenishment

- **WHEN** `listar-abaixo-do-minimo` runs
- **THEN** it returns the variations where `saldoAtual < estoqueMinimo`, with their current and minimum balances (RF-EST-08)

#### Scenario: Variation at or above minimum is excluded

- **WHEN** a variation has `saldoAtual` ≥ `estoqueMinimo`
- **THEN** it is not included in the result

