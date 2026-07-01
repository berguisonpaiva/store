## MODIFIED Requirements

### Requirement: Ledger and balance updated in a single transaction

The system SHALL ensure every entry/exit (including adjustments) performs, atomically, both (1) the creation of the `MovimentacaoEstoque` with its `saldoResultante` and (2) the update of the variation `saldoAtual`. Either both succeed or neither is applied; the `EstoqueRepository` port exposes a transactional write for this. The write MUST accept an optional caller-supplied transaction context: when one is provided (e.g. a sale-driven `darBaixa`/`estornar`), the ledger insert and balance update MUST run **inside that caller's transaction** and commit or roll back with it; when none is provided (the standalone ADMIN commands), the write opens its own transaction.

#### Scenario: Both writes commit together

- **WHEN** a stock command completes successfully
- **THEN** the ledger movement and the new `saldoAtual` are persisted together via a single transaction (RF-EST-03)

#### Scenario: Partial failure rolls back

- **WHEN** persisting the movement or the new `saldoAtual` fails mid-transaction
- **THEN** neither the movement nor the balance change is applied (RF-EST-03)

#### Scenario: Write joins a caller-supplied transaction

- **WHEN** the transactional write is invoked with an ambient transaction context supplied by the caller
- **THEN** the ledger insert and balance update run on that context and are committed or rolled back together with the caller's transaction, without opening a separate one

#### Scenario: Write opens its own transaction when none is supplied

- **WHEN** the transactional write is invoked without a caller-supplied transaction context
- **THEN** it opens its own transaction and commits both writes atomically
