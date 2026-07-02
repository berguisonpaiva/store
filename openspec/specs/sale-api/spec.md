# sale-api Specification

## Purpose
TBD - created by archiving change sales-module. Update Purpose after archive.
## Requirements
### Requirement: Sale command endpoints

The system SHALL expose CQRS command routes for sales, guarded by JWT and `@Papeis(ADMIN, OPERADOR)`, money in reais at the boundary (cents internally), acting `usuarioId` from `@CurrentUser`:

- `POST /vendas` — opens a sale on the caller's open session (body empty).
- `POST /vendas/:id/itens` — body `{ variacaoId | sku | codigoBarras, quantidade }` → adds an item at the variation's current price.
- `DELETE /vendas/:id/itens/:itemId` — removes an item.
- `PATCH /vendas/:id/desconto` — body `{ tipo: VALOR|PERCENTUAL, valor }` → applies a discount.
- `POST /vendas/:id/finalizar` — body `{ pagamentos: [{ forma, valor }] }` → concludes the sale (stock baixa + cash) in one transaction.
- `POST /vendas/:id/cancelar` — cancels the sale, reversing stock/cash.

#### Scenario: Create returns an open sale

- **WHEN** an operator with an open session `POST /vendas`
- **THEN** the response is an `ABERTA` sale bound to that session

#### Scenario: Add item returns the updated sale

- **WHEN** `POST /vendas/:id/itens` with a valid variation reference and `quantidade > 0`
- **THEN** the item is added at the variation's current price and the updated sale (with recomputed totals) is returned

#### Scenario: Finalize returns the concluded sale

- **WHEN** `POST /vendas/:id/finalizar` with payments summing to the total
- **THEN** the response is the `CONCLUIDA` sale after stock and cash committed atomically

### Requirement: Sale query endpoints with owner/admin scope (RN03/RN04)

The system SHALL expose `GET /vendas/:id` (a single sale), `GET /vendas` (paginated, filters `{ startDate?, endDate?, usuarioId?, sessaoCaixaId?, status? }`), and `GET /caixa/:id/vendas` (sales of a session). A non-ADMIN caller SHALL be scoped to their own sales/sessions; reading another operator's sale is denied with `ACESSO_NEGADO` → 403. ADMIN sees all.

#### Scenario: Operator reads own sale

- **WHEN** an operator `GET /vendas/:id` for a sale they own
- **THEN** the sale is returned with items, payments, `subtotal`/`desconto`/`total`

#### Scenario: Operator is scoped on listing

- **WHEN** a non-ADMIN operator `GET /vendas` without a `usuarioId` filter
- **THEN** only their own sales are returned

#### Scenario: Cross-operator read is forbidden

- **WHEN** a non-ADMIN operator `GET /vendas/:id` for a sale owned by another operator
- **THEN** the response is 403 (`ACESSO_NEGADO`)

### Requirement: Sale error mapping

The system SHALL map `VendaError` codes to HTTP via the shared error mapper: `NO_OPEN_CASH_SESSION`/`INSUFFICIENT_STOCK`/`PAYMENT_MISMATCH`/`CASH_SESSION_CLOSED`/`SALE_ALREADY_FINALIZED`/`SALE_NOT_OPEN` → 409/422; `SALE_NOT_FOUND`/`ITEM_NOT_FOUND` → 404; `INVALID_QUANTITY`/`INVALID_PRICE`/`INVALID_DISCOUNT`/`DISCOUNT_EXCEEDS_SUBTOTAL`/`INVALID_PAYMENT`/`SALE_HAS_NO_ITEMS` → 400/422.

#### Scenario: Business-state failures map to 409/422

- **WHEN** finalize fails with `PAYMENT_MISMATCH` or `INSUFFICIENT_STOCK`
- **THEN** the HTTP response is 409 or 422 carrying the code

#### Scenario: Unknown sale maps to 404

- **WHEN** a route targets a sale id that does not exist
- **THEN** the response is 404 (`SALE_NOT_FOUND`)

#### Scenario: Invalid input maps to 400/422

- **WHEN** an item is added with `quantidade ≤ 0` or a discount exceeds the subtotal
- **THEN** the response is 400/422 (`INVALID_QUANTITY` / `DISCOUNT_EXCEEDS_SUBTOTAL`)

