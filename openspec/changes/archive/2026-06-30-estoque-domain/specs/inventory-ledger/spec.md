## ADDED Requirements

### Requirement: Immutable stock-movement ledger

The system SHALL define a `MovimentacaoEstoque` entity in `modules/estoque` as an **immutable ledger** — the source of truth for stock movement. Each movement records `variacaoId`, `tipo` (`ENTRADA` or `SAIDA`), `motivo` (`MotivoMovimentacaoEstoque`: `COMPRA`, `AJUSTE`, `DEVOLUCAO`, `VENDA_PDV`, `VENDA_ONLINE`, `PERDA`), `quantidade` (> 0), the resulting balance `saldoResultante`, an optional `origemVendaId`, and a creation timestamp. A movement, once created, MUST NOT be edited or deleted; corrections are made by recording a new movement.

#### Scenario: Movement is created with the resulting balance

- **WHEN** a stock movement is built with a valid variation, type, motivo, and `quantidade > 0`
- **THEN** the `MovimentacaoEstoque` is created successfully carrying its `saldoResultante`

#### Scenario: Non-positive quantity is rejected

- **WHEN** a movement is built with `quantidade` ≤ 0
- **THEN** creation returns a failed `Result` with `QuantidadeInvalida`

#### Scenario: saldoResultante equals previous balance plus or minus quantity

- **WHEN** an `ENTRADA` (or `SAIDA`) movement is recorded over a previous balance
- **THEN** `saldoResultante` equals `saldoAnterior + quantidade` for `ENTRADA` and `saldoAnterior − quantidade` for `SAIDA`

### Requirement: Register stock entry

The system SHALL provide a `registrar-entrada` command that increases the balance of a variation. Its `motivo` MUST be one of `COMPRA`, `DEVOLUCAO`, or `AJUSTE`. The command records an `ENTRADA` movement and increases `saldoAtual` by `quantidade`.

#### Scenario: Valid entry increases balance

- **WHEN** `registrar-entrada` runs for an existing variation with `motivo` COMPRA and `quantidade > 0`
- **THEN** an `ENTRADA` movement is recorded and `saldoAtual` increases by `quantidade` (RF-EST-01)

#### Scenario: Entry for unknown variation is rejected

- **WHEN** `registrar-entrada` references a variation that does not exist
- **THEN** the command returns a failed `Result` with `VariacaoNaoEncontrada` (RF-EST-01)

#### Scenario: Invalid motivo for entry is rejected

- **WHEN** `registrar-entrada` is called with a `motivo` outside COMPRA/DEVOLUCAO/AJUSTE
- **THEN** the command returns a failed `Result`

### Requirement: Register manual stock exit

The system SHALL provide a `registrar-saida` command that decreases the balance of a variation for manual reasons. Its `motivo` MUST be `PERDA` or `AJUSTE`. The command records a `SAIDA` movement and decreases `saldoAtual` by `quantidade`, and MUST NOT let the balance go negative.

#### Scenario: Valid exit decreases balance

- **WHEN** `registrar-saida` runs for a variation with sufficient balance, `motivo` PERDA and `quantidade > 0`
- **THEN** a `SAIDA` movement is recorded and `saldoAtual` decreases by `quantidade` (RF-EST-02)

#### Scenario: Exit that would make the balance negative is rejected

- **WHEN** `registrar-saida` is called with `quantidade` greater than the current `saldoAtual`
- **THEN** the command returns a failed `Result` with `EstoqueInsuficiente` and no movement is recorded (RF-EST-05)

### Requirement: Adjust balance to an absolute value

The system SHALL provide an `ajustar-saldo` command that sets the variation balance to an absolute `novoSaldo` (inventory correction), recording the difference (`novoSaldo − saldoAtual`) as a movement with `motivo` AJUSTE (`ENTRADA` when increasing, `SAIDA` when decreasing). `novoSaldo` MUST be ≥ 0. This is the only command allowed to override the non-negative-balance protection of normal exits.

#### Scenario: Adjustment records the delta and sets the balance

- **WHEN** `ajustar-saldo` sets `novoSaldo` different from the current `saldoAtual`
- **THEN** `saldoAtual` becomes `novoSaldo` and a single AJUSTE movement is recorded for the difference (RF-EST-04)

#### Scenario: Negative target balance is rejected

- **WHEN** `ajustar-saldo` is called with `novoSaldo < 0`
- **THEN** the command returns a failed `Result` with `QuantidadeInvalida`

#### Scenario: No-op adjustment

- **WHEN** `ajustar-saldo` is called with `novoSaldo` equal to the current `saldoAtual`
- **THEN** no movement is recorded and the balance is unchanged

### Requirement: Ledger and balance updated in a single transaction

The system SHALL ensure every entry/exit (including adjustments) performs, atomically, both (1) the creation of the `MovimentacaoEstoque` with its `saldoResultante` and (2) the update of the variation `saldoAtual`. Either both succeed or neither is applied; the `EstoqueRepository` port exposes a transactional write for this.

#### Scenario: Both writes commit together

- **WHEN** a stock command completes successfully
- **THEN** the ledger movement and the new `saldoAtual` are persisted together via a single transaction (RF-EST-03)

#### Scenario: Partial failure rolls back

- **WHEN** persisting the movement or the new `saldoAtual` fails mid-transaction
- **THEN** neither the movement nor the balance change is applied (RF-EST-03)
