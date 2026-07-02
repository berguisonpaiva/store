# sale-cash-stock-transaction Specification

## Purpose
TBD - created by archiving change sales-module. Update Purpose after archive.
## Requirements
### Requirement: A sale requires an open cash session (RN07/RN08)

The system SHALL, on `criar-venda`, bind the new sale to the acting operator's open cash session obtained through the `CaixaGateway`. If the operator has no open session, `criar-venda` MUST fail with `NO_OPEN_CASH_SESSION`. The sale's `sessaoCaixaId` is the id of that open session and MUST NOT be supplied by the client.

#### Scenario: Sale opens on the operator's open session

- **WHEN** `criar-venda` runs for an operator with an open session S
- **THEN** an `ABERTA` sale is created with `sessaoCaixaId = S`

#### Scenario: No open session blocks sale creation

- **WHEN** `criar-venda` runs for an operator with no open session
- **THEN** it returns a failed `Result` with `NO_OPEN_CASH_SESSION` and no sale is created

### Requirement: Available stock is validated before adding an item (RN09)

The system SHALL, when adding an item, call `EstoqueGateway.validarSaldoDisponivel(variacaoId, quantidade)` and reject the addition when available stock is insufficient, failing with `INSUFFICIENT_STOCK`. This is a pre-check; the authoritative decrement happens atomically at finalize.

#### Scenario: Sufficient stock allows the item

- **WHEN** an item quantity is within available stock
- **THEN** the item is added

#### Scenario: Insufficient stock blocks the item

- **WHEN** an item quantity exceeds available stock
- **THEN** it returns a failed `Result` with `INSUFFICIENT_STOCK` and no item is added

### Requirement: Finalize commits sale, stock, and cash in one transaction (RN09)

The system SHALL run `finalizar-venda` inside a single transaction that, in order, (1) concludes the sale (`concluir`, enforcing items + `Σ pagamentos == total`), (2) decrements stock via `EstoqueGateway.darBaixa(variacaoId, qtd, origemVendaId, usuarioId, tx)` for every item, and (3) registers the sale value in the cash session via `CaixaGateway.registrarVenda(sessaoCaixaId, valor, tx)`. All three MUST share the **same** transaction context `tx`. If any step fails, the whole transaction MUST roll back — no partial stock decrement, no cash movement, and the sale stays `ABERTA`.

#### Scenario: Successful finalize persists all three effects atomically

- **WHEN** `finalizar-venda` succeeds
- **THEN** the sale is `CONCLUIDA`, a stock `SAIDA` is recorded per item, and a `VENDA` cash movement equal to the total is recorded — all committed together

#### Scenario: Stock failure rolls everything back

- **WHEN** `darBaixa` fails (e.g. `INSUFFICIENT_STOCK`) during finalize
- **THEN** the transaction rolls back: the sale stays `ABERTA`, no stock movement and no cash movement persist

#### Scenario: Cash failure rolls everything back

- **WHEN** `registrarVenda` fails during finalize after stock was decremented on the same `tx`
- **THEN** the transaction rolls back: the stock decrement is undone and the sale stays `ABERTA`

#### Scenario: Payment mismatch aborts before side effects

- **WHEN** `finalizar-venda` is attempted with `Σ pagamentos ≠ total`
- **THEN** it fails with `PAYMENT_MISMATCH` and neither stock nor cash is touched

### Requirement: Cancel reverses stock and cash in one transaction

The system SHALL run `cancelar-venda` inside a single transaction that transitions the sale to `CANCELADA` and, for a sale that had already moved stock/cash, reverses them via `EstoqueGateway.estornar(..., tx)` and `CaixaGateway.estornarVenda(sessaoCaixaId, valor, tx)`. Cancel MUST be blocked when the sale's cash session has already closed, failing with `CASH_SESSION_CLOSED` (checked via `CaixaGateway.isSessaoAberta`).

#### Scenario: Cancel reverses effects atomically

- **WHEN** `cancelar-venda` runs on a sale whose session is still open
- **THEN** the sale becomes `CANCELADA`, a compensating stock `ENTRADA` and a reversing cash movement are recorded on the same `tx`

#### Scenario: Cancel is blocked on a closed session

- **WHEN** `cancelar-venda` runs on a sale whose cash session is `FECHADA`
- **THEN** it returns a failed `Result` with `CASH_SESSION_CLOSED` and nothing is reversed

### Requirement: Ports mediate all cross-aggregate access

The system SHALL route every sale↔caixa and sale↔stock interaction through the declared ports: `CaixaGateway` (bound to the sealed `CaixaPort` exposing `caixaAbertoDoOperador`, `isSessaoAberta`, `registrarVenda(…, tx?)`, `estornarVenda(…, tx?)`) and `EstoqueGateway` (bound to inventory's `EstoquePort`). Vendas MUST NOT read caixa or estoque persistence directly, and the `VENDA` cash movement MUST be created only through `CaixaPort`.

#### Scenario: Cash movement goes through the sealed port

- **WHEN** a sale registers or reverses its value in the cash session
- **THEN** the movement is created by `CaixaPort` (`registrarVenda`/`estornarVenda`), not by a public caixa command or a direct repository write

#### Scenario: No direct persistence access from vendas

- **WHEN** the vendas orchestration needs caixa/estoque state or writes
- **THEN** it uses `CaixaGateway`/`EstoqueGateway` only, never the caixa/estoque repositories directly

