## MODIFIED Requirements

### Requirement: Expose EstoquePort for the sales module

The system SHALL expose an `EstoquePort` from `modules/estoque` with `darBaixa(variacaoId, qtd, origemVendaId, usuarioId, motivo?, tx?)` and `estornar(...)`, to be consumed by the `vendas` module. The sale-driven exit MUST NOT be a public command of `estoque`; the only way `vendas` removes stock for a sale is through this port. Cross-module communication happens solely via this exposed port. When `vendas` supplies its transaction context, `darBaixa`/`estornar` MUST record the movement **inside the sale's transaction**, so the stock change and the sale commit or roll back together.

#### Scenario: darBaixa records a sale-driven exit in the sale's transaction

- **WHEN** `vendas` calls `darBaixa(variacaoId, qtd, origemVendaId, ...)` with its transaction context for a variation with enough balance
- **THEN** a `SAIDA` movement is recorded with motivo `VENDA_PDV`/`VENDA_ONLINE` and `origemVendaId`, and `saldoAtual` decreases by `qtd` within the same sale transaction (RF-EST-09)

#### Scenario: estornar reverses a previous sale-driven exit

- **WHEN** `vendas` calls `estornar(...)` for a previously recorded sale exit
- **THEN** a compensating `ENTRADA` movement is recorded linked to the same `origemVendaId` and `saldoAtual` is restored (RF-EST-09)

#### Scenario: Sale rollback rolls back the stock movement

- **WHEN** a sale that called `darBaixa` fails later in its own transaction and rolls back
- **THEN** the stock movement and balance change made by `darBaixa` are rolled back as well, leaving no `MovimentacaoEstoque` for the aborted sale

#### Scenario: No public sale-exit command

- **WHEN** searching the `estoque` public commands
- **THEN** there is no public command for sale-driven exits — only `registrar-entrada`, `registrar-saida`, and `ajustar-saldo` are public; sale exits go through `EstoquePort` (RF-EST-09)

### Requirement: Validate available balance before a sale exit

The system SHALL, before applying a `darBaixa`, validate that the current balance `saldoAtual` is greater than or equal to the requested quantity. If not, the port returns a failure and no stock is moved. There is no reservation; available stock is exactly `saldoAtual`.

#### Scenario: Sufficient balance

- **WHEN** `darBaixa` is called and `saldoAtual` ≥ `qtd`
- **THEN** the exit is applied

#### Scenario: Insufficient balance

- **WHEN** `darBaixa` is called and `saldoAtual` < `qtd`
- **THEN** the port returns a failed `Result` with `EstoqueInsuficiente` and no movement is recorded

#### Scenario: Unknown variation

- **WHEN** `darBaixa` references a variation that does not exist
- **THEN** the port returns a failed `Result` with `VariacaoNaoEncontrada`
