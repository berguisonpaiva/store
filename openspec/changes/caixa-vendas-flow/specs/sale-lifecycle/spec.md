## MODIFIED Requirements

### Requirement: Items priced from the active variation (RN10)

The system SHALL, when adding an item, resolve the variation through a domain port `VariacaoGateway.buscarParaVenda(variacaoId) → { variacaoId, preco, ativa } | null` and snapshot the variation's current unit price into `ItemVenda.precoUnitario`, never re-reading it afterward. The item's `total = precoUnitario × quantidade`, `quantidade > 0`. Adding an item MUST fail with `VARIACAO_NAO_ENCONTRADA` when the gateway returns null and with `VARIACAO_INATIVA` when `ativa = false`; a non-positive quantity MUST fail with `INVALID_QUANTITY`; a non-positive price MUST fail with `INVALID_PRICE`. Changing an item's quantity (`alterarQuantidadeItem`) SHALL revalidate available stock for the new quantity, failing with `INSUFFICIENT_STOCK` when unavailable.

#### Scenario: Item captures the price at add-time

- **WHEN** an item is added for an active variation priced at P
- **THEN** `precoUnitario = P` is stored on the item and used for all later totals even if the variation price later changes

#### Scenario: Inactive variation cannot be sold

- **WHEN** an item is added for a variation whose `ativa = false`
- **THEN** it returns a failed `Result` with `VARIACAO_INATIVA` and no item is added

#### Scenario: Unknown variation cannot be sold

- **WHEN** an item is added for a `variacaoId` the gateway does not resolve
- **THEN** it returns a failed `Result` with `VARIACAO_NAO_ENCONTRADA` and no item is added

#### Scenario: Non-positive quantity is rejected

- **WHEN** an item is added with `quantidade ≤ 0`
- **THEN** it returns a failed `Result` with `INVALID_QUANTITY`

#### Scenario: Quantity change revalidates stock

- **WHEN** `alterarQuantidadeItem` raises an item's quantity beyond the available stock
- **THEN** it returns a failed `Result` with `INSUFFICIENT_STOCK` and the item keeps its previous quantity

## ADDED Requirements

### Requirement: Sequential sale number assigned at finalize

The system SHALL assign each concluded sale a unique, monotonically increasing `numero`, drawn atomically from a persistence-layer sequence when the concluded sale is persisted, inside the same finalize transaction that commits stock and cash. An `ABERTA` sale has no `numero`; once assigned it never changes (the domain exposes `Venda.atribuirNumero`/`numero` for hydration and invariants).

#### Scenario: Finalize assigns the next number

- **WHEN** a sale is finalized successfully
- **THEN** it carries a `numero` unique across all sales, assigned within the same transaction that commits stock and cash

#### Scenario: Open sale has no number

- **WHEN** a sale is created and edited while `ABERTA`
- **THEN** its `numero` is unset

### Requirement: Incremental payment registration

The system SHALL allow registering payments one at a time on an `ABERTA` sale (`adicionarPagamento`), each with a valid `forma` and `valor > 0` (`INVALID_PAYMENT` otherwise). Incremental payments do not need to sum to the total at registration time — the equality `Σ pagamentos == total` is enforced only by `concluir` (RN07/RN12, `PAYMENT_MISMATCH`).

#### Scenario: Partial payment is accepted while open

- **WHEN** a payment of `valor > 0` is added to an `ABERTA` sale whose payments do not yet reach the total
- **THEN** the payment is appended and the sale stays `ABERTA`

#### Scenario: Payment on a non-open sale is rejected

- **WHEN** `adicionarPagamento` runs on a `CONCLUIDA` or `CANCELADA` sale
- **THEN** it returns a failed `Result` with `SALE_ALREADY_FINALIZED`/`SALE_NOT_OPEN` and no payment is added
