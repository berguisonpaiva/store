# sale-lifecycle Specification

## Purpose
TBD - created by archiving change sales-module. Update Purpose after archive.
## Requirements
### Requirement: Sale lifecycle ABERTA → CONCLUIDA | CANCELADA

The system SHALL model a `Venda` aggregate with `StatusVenda = { ABERTA, CONCLUIDA, CANCELADA }`, `CanalVenda = { PDV }`, keyed by `variacaoId`, money in cents. `Venda.abrir` creates an `ABERTA` sale bound to `usuarioId` and `sessaoCaixaId`; `Venda.hydrate` rebuilds it from persistence. A sale owns `ItemVenda` and `Pagamento` children and a `Desconto`. Only `CONCLUIDA` is immutable; `ABERTA` is mutable; `CANCELADA` is terminal and reverses side effects.

#### Scenario: A new sale starts ABERTA

- **WHEN** `Venda.abrir` runs with a valid `usuarioId` and `sessaoCaixaId`
- **THEN** a sale is created with `status = ABERTA`, empty items/payments, and `Desconto.zero()`

#### Scenario: Conclude transitions to CONCLUIDA

- **WHEN** `concluir` runs on an `ABERTA` sale that has items and matching payments
- **THEN** the sale becomes `CONCLUIDA` with `concluidaEm` set

#### Scenario: Cancel transitions to CANCELADA

- **WHEN** `cancelar` runs on a sale
- **THEN** the sale becomes `CANCELADA` with `canceladaEm` set

### Requirement: Writes are allowed only while ABERTA (RN11)

The system SHALL accept `adicionarItem`, `removerItem`, `alterarQuantidadeItem`, `aplicarDesconto`, `adicionarPagamento`, and `definirPagamentos` only while the sale is `ABERTA`. A write on a `CONCLUIDA` sale MUST fail with `SALE_ALREADY_FINALIZED`; a write requiring an open sale that finds it not `ABERTA` MUST fail with `SALE_NOT_OPEN`.

#### Scenario: Editing an open sale succeeds

- **WHEN** an item is added to an `ABERTA` sale
- **THEN** the item is appended and totals recompute

#### Scenario: Editing a concluded sale is rejected

- **WHEN** any write is attempted on a `CONCLUIDA` sale
- **THEN** it returns a failed `Result` with `SALE_ALREADY_FINALIZED` and the sale is unchanged

#### Scenario: Editing a cancelled sale is rejected

- **WHEN** any write is attempted on a `CANCELADA` sale
- **THEN** it returns a failed `Result` with `SALE_NOT_OPEN` (or `SALE_ALREADY_FINALIZED`) and the sale is unchanged

### Requirement: Items priced from the active variation (RN10)

The system SHALL, when adding an item, snapshot the variation's current unit price into `ItemVenda.precoUnitario` and never re-read it afterward. The item's `total = precoUnitario × quantidade`, `quantidade > 0`. Adding an item for an **inactive or unknown** variation MUST fail (variation inactive/inexistent); a non-positive quantity MUST fail with `INVALID_QUANTITY`; a non-positive price MUST fail with `INVALID_PRICE`.

#### Scenario: Item captures the price at add-time

- **WHEN** an item is added for an active variation priced at P
- **THEN** `precoUnitario = P` is stored on the item and used for all later totals even if the variation price later changes

#### Scenario: Inactive variation cannot be sold

- **WHEN** an item is added for a variation that is inactive
- **THEN** it returns a failed `Result` indicating the variation is inactive and no item is added

#### Scenario: Non-positive quantity is rejected

- **WHEN** an item is added with `quantidade ≤ 0`
- **THEN** it returns a failed `Result` with `INVALID_QUANTITY`

### Requirement: Discount does not exceed subtotal

The system SHALL support a `Desconto` of `TipoDesconto = { VALOR, PERCENTUAL }` (VALOR in cents, PERCENTUAL in 0..100). The applied discount amount is capped at the subtotal and computed as `desconto = Desconto.amountFor(subtotal)`; `total = subtotal − desconto`. Applying a discount that would exceed the subtotal MUST fail with `DISCOUNT_EXCEEDS_SUBTOTAL`; an otherwise invalid discount MUST fail with `INVALID_DISCOUNT`.

#### Scenario: Percentual discount reduces total

- **WHEN** a `PERCENTUAL` discount of 10 is applied to a subtotal of 1000 cents
- **THEN** `desconto = 100` and `total = 900`

#### Scenario: Absolute discount exceeding subtotal is rejected

- **WHEN** a `VALOR` discount greater than the current subtotal is applied
- **THEN** it returns a failed `Result` with `DISCOUNT_EXCEEDS_SUBTOTAL`

### Requirement: Split payments must sum to the total (RN12)

The system SHALL allow multiple `Pagamento` children per sale, each with `forma ∈ FormaPagamento = { DINHEIRO, CARTAO_DEBITO, CARTAO_CREDITO, PIX }` and `valor > 0`. `concluir` MUST require the sale to have at least one item and `Σ pagamentos == total`; otherwise it fails — `SALE_HAS_NO_ITEMS` when there are no items, `PAYMENT_MISMATCH` when the payments do not equal the total. An invalid payment MUST fail with `INVALID_PAYMENT`.

#### Scenario: Exact split payment concludes the sale

- **WHEN** `concluir` runs on a sale of `total = 5000` with payments `DINHEIRO 2000` + `PIX 3000`
- **THEN** the sale is concluded (`Σ pagamentos == total`)

#### Scenario: Payment mismatch is rejected

- **WHEN** `concluir` runs on a sale of `total = 5000` with payments summing to `4000`
- **THEN** it returns a failed `Result` with `PAYMENT_MISMATCH` and the sale stays `ABERTA`

#### Scenario: Concluding without items is rejected

- **WHEN** `concluir` runs on a sale with no items
- **THEN** it returns a failed `Result` with `SALE_HAS_NO_ITEMS`

#### Scenario: Invalid payment form or value is rejected

- **WHEN** a payment is added with `valor ≤ 0` or an unknown `forma`
- **THEN** it returns a failed `Result` with `INVALID_PAYMENT`

