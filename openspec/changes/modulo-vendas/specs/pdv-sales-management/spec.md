## ADDED Requirements

### Requirement: Venda aggregate and PDV channel

The system SHALL model a counter sale as a `Venda` aggregate root owning `ItemVenda` and `Pagamento` collections in `modules/vendas`. A `Venda` SHALL carry `numero` (unique sequential), `canal` (fixed `PDV` in MVP 1), `status`, `usuarioId` (operator), `sessaoCaixaId`, `subtotal`, `desconto`, and `total`. Each `ItemVenda` SHALL carry `variacaoId`, `quantidade`, `precoUnitario` (snapshot), and `total`. The status lifecycle SHALL be `ABERTA → CONCLUIDA | CANCELADA`. (RF-VND-01, RF-VND-11)

#### Scenario: A new sale opens on the PDV channel

- **WHEN** a sale is created
- **THEN** it is `ABERTA`, `canal` is `PDV`, it is linked to the operator (`usuarioId`) and the operator's open `sessaoCaixaId`, and `subtotal`/`desconto`/`total` start at zero

#### Scenario: Aggregate owns its items and payments

- **WHEN** items or payments are added
- **THEN** they are persisted and read only as part of the owning `Venda`, never as standalone aggregates

### Requirement: Require an open cash session to start a sale

The system SHALL only create a `Venda` when the operator has an `ABERTA` cash session (read via `CaixaGateway`). Without one, creation MUST fail with `NO_OPEN_CASH_SESSION` and no sale is persisted. (RF-VND-01, RF-VND-02)

#### Scenario: Operator has an open session

- **WHEN** `criar-venda` runs and `CaixaGateway.caixaAbertoDoOperador(usuarioId)` returns an open session
- **THEN** the sale is created `ABERTA` bound to that `sessaoCaixaId`

#### Scenario: Operator has no open session

- **WHEN** `criar-venda` runs and no open session is returned
- **THEN** the result is `Result.fail(NO_OPEN_CASH_SESSION)` and nothing is persisted

### Requirement: Add item with a price snapshot

The system SHALL add an item to an `ABERTA` sale by `variacaoId` (resolved from SKU, barcode, or name at the edge) with `quantidade > 0`, capturing the variation's current price as `precoUnitario` (snapshot). The line `total` SHALL be `precoUnitario × quantidade`. A later change to the variation's price MUST NOT change an already-captured `precoUnitario`. (RF-VND-03)

#### Scenario: Item captures the price at add time

- **WHEN** `adicionar-item` adds a variation priced at 10.00 with `quantidade` 2
- **THEN** the line stores `precoUnitario` 10.00 and `total` 20.00

#### Scenario: Snapshot is immutable to later price changes

- **WHEN** the variation price changes to 12.00 after the item was added at 10.00
- **THEN** the existing line still reads `precoUnitario` 10.00

#### Scenario: Quantity must be positive

- **WHEN** `adicionar-item` is called with `quantidade` ≤ 0
- **THEN** the result is a validation failure and no item is added

### Requirement: Remove item and change quantity while ABERTA

The system SHALL allow removing an item and changing an item's quantity while the sale is `ABERTA`, recomputing line and sale totals. (RF-VND-04)

#### Scenario: Remove an item

- **WHEN** `remover-item` removes a line from an `ABERTA` sale
- **THEN** the line is gone and `subtotal`/`total` are recomputed

#### Scenario: Change quantity recomputes the line

- **WHEN** an item's quantity changes to a value `> 0`
- **THEN** the line `total` becomes `precoUnitario × quantidade` and sale totals update

### Requirement: Apply discount by value or percentage

The system SHALL apply a discount to an `ABERTA` sale either as an absolute `valor` or a `percentual` over the subtotal, with `valor ≥ 0`. The resulting discount amount MUST never exceed the subtotal. (RF-VND-05)

#### Scenario: Absolute discount

- **WHEN** a discount of `valor` 5.00 is applied on a subtotal of 20.00
- **THEN** `desconto` is 5.00 and `total` is 15.00

#### Scenario: Percentage discount

- **WHEN** a discount of `percentual` 10 is applied on a subtotal of 20.00
- **THEN** `desconto` is 2.00 and `total` is 18.00

#### Scenario: Discount capped at subtotal

- **WHEN** a discount greater than the subtotal is requested
- **THEN** the result is a validation failure (discount cannot exceed subtotal) and the sale total is unchanged

### Requirement: Automatic subtotal, discount and total calculation

The system SHALL compute `subtotal = Σ item.total`, the discount amount from the discount input, and `total = subtotal − desconto` automatically whenever items or the discount change. (RF-VND-06)

#### Scenario: Totals recompute on every change

- **WHEN** an item is added, removed, has its quantity changed, or a discount is applied
- **THEN** `subtotal`, `desconto`, and `total` reflect the new state, with `total = Σ itens − desconto`

### Requirement: Finalize a sale in a single orchestrated transaction

The system SHALL finalize an `ABERTA` sale by, in order: (1) validate available balance for each item via `EstoqueGateway`; (2) take stock down — one `SAIDA` per item, motivo `VENDA_PDV`, carrying `origemVendaId` — via `EstoqueGateway`; (3) persist the sale's `Pagamento` rows; (4) register a `VENDA` cash movement for the sale `total` via `CaixaGateway`; (5) set status to `CONCLUIDA` and stamp `concluidaEm`. The orchestration SHALL be atomic: a failure at any step reverts all prior steps (no partial stock take-down, no payment, no cash movement, status stays `ABERTA`). (RF-VND-07)

#### Scenario: Happy path runs 1→5 atomically

- **WHEN** `finalizar-venda` runs with enough stock and `Σ pagamentos = total`
- **THEN** stock is taken down per item with `VENDA_PDV` and `origemVendaId`, payments are persisted, a `VENDA` cash movement equal to `total` is registered, and the sale becomes `CONCLUIDA`

#### Scenario: Insufficient stock aborts everything

- **WHEN** any item lacks available balance at step 1/2
- **THEN** the result is `Result.fail(INSUFFICIENT_STOCK)`, no stock is taken down, no payment is recorded, no cash movement is created, and the sale stays `ABERTA`

#### Scenario: Failure in a later step rolls back earlier steps

- **WHEN** the cash-movement step (4) fails after stock was taken down and payments persisted
- **THEN** the stock take-down and payments are reverted and the sale stays `ABERTA`

### Requirement: Payments must equal the total to finalize

The system SHALL require that the sum of the sale's `Pagamento` values equals the sale `total` before finalizing. Otherwise finalization MUST fail with `PAYMENT_MISMATCH`. Each `Pagamento` carries `forma` and `valor`; payments are owned by `vendas` in MVP 1 (no separate payments module). (RF-VND-08)

#### Scenario: Payments equal total

- **WHEN** `finalizar-venda` runs with payments summing exactly to `total`
- **THEN** finalization proceeds

#### Scenario: Payments differ from total

- **WHEN** the payments sum is greater or less than `total`
- **THEN** the result is `Result.fail(PAYMENT_MISMATCH)` and the sale is not finalized

### Requirement: A CONCLUIDA sale is immutable

The system SHALL reject any write (add/remove item, change quantity, apply discount, finalize again) to a `CONCLUIDA` sale with `SALE_ALREADY_FINALIZED`. (RF-VND-09)

#### Scenario: Write attempt on a finalized sale

- **WHEN** any mutating use case targets a `CONCLUIDA` sale
- **THEN** the result is `Result.fail(SALE_ALREADY_FINALIZED)` and the sale is unchanged

### Requirement: Cancel a sale before the session closes

The system SHALL cancel a sale by reversing stock (an `ENTRADA`/`DEVOLUCAO` per item via `EstoqueGateway.estornar`) and reverting the cash movement via `CaixaGateway`, then setting status to `CANCELADA` and stamping `canceladaEm`. Cancellation SHALL only be allowed before the operator's cash session is closed. (RF-VND-10)

#### Scenario: Cancel reverses stock and cash

- **WHEN** `cancelar-venda` runs on a sale whose session is still open
- **THEN** stock is restored via `DEVOLUCAO`, the cash `VENDA` movement is reverted, and the sale becomes `CANCELADA`

#### Scenario: Cancel blocked after session close

- **WHEN** `cancelar-venda` runs after the sale's cash session has been closed
- **THEN** the cancellation is rejected and the sale is unchanged

#### Scenario: Cancel of a missing sale

- **WHEN** `cancelar-venda` targets a sale id that does not exist
- **THEN** the result is `Result.fail(SALE_NOT_FOUND)`

### Requirement: Unique sequential sale number

The system SHALL assign each sale a unique, sequential `numero`. Numbers MUST remain unique even under concurrent sales. (RF-VND-11)

#### Scenario: Numbers are sequential and unique

- **WHEN** multiple sales are created
- **THEN** each receives a distinct, increasing `numero` with no duplicates

### Requirement: Read use cases for sales

The system SHALL provide read use cases backed by `VendasQuery`: `buscar-venda` (by id), `listar-vendas` (filterable by period, operator, session, and status), and `resumo-vendas` (totals over the same filters). `buscar-venda` for an unknown id MUST fail with `SALE_NOT_FOUND`. (RF-VND-12)

#### Scenario: Find an existing sale

- **WHEN** `buscar-venda` is called with an existing id
- **THEN** the sale with its items and payments is returned

#### Scenario: Find a missing sale

- **WHEN** `buscar-venda` is called with an unknown id
- **THEN** the result is `Result.fail(SALE_NOT_FOUND)`

#### Scenario: List by filters

- **WHEN** `listar-vendas` is called with period/operator/session/status filters
- **THEN** only matching sales are returned

#### Scenario: Summary sums totals

- **WHEN** `resumo-vendas` is called for a period/operator/session/status
- **THEN** it returns the aggregated totals of the matching sales

### Requirement: Ports consumed are declared in the vendas provider

The system SHALL declare `EstoqueGateway` and `CaixaGateway` ports in `modules/vendas/provider/`; the domain depends only on these contracts and never imports `estoque`/`caixa` internals. Backend adapters bind each port to the owner module. (Mapa de dependências)

#### Scenario: Domain depends only on the declared ports

- **WHEN** the domain orchestrates stock and cash during finalize/cancel
- **THEN** it calls only `EstoqueGateway`/`CaixaGateway` methods, with no direct import of `estoque` or `caixa`
