## MODIFIED Requirements

### Requirement: Consult balance for a variation

The system SHALL provide a `consultar-saldo` query that returns, for a variation, its `saldoAtual` and its `estoqueMinimo`. The query reads through the `EstoqueQuery` port and MUST NOT expose the internal ledger entity. Stock reservation (`quantidadeReservada`/`saldoDisponivel`) is not part of the model; there is no separate "available balance".

#### Scenario: Returns current balance and minimum

- **WHEN** `consultar-saldo` runs for an existing variation
- **THEN** it returns `saldoAtual` and `estoqueMinimo` (RF-EST-06)

#### Scenario: Unknown variation

- **WHEN** `consultar-saldo` references a variation that does not exist
- **THEN** the query returns a failed `Result` with `VariacaoNaoEncontrada`
