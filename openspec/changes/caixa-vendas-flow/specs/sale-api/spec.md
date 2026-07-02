## MODIFIED Requirements

### Requirement: Sale command endpoints

The system SHALL expose CQRS command routes for sales, guarded by JWT and `@Papeis(ADMIN, OPERADOR)`, money in reais at the boundary (cents internally), acting `usuarioId` from `@CurrentUser`:

- `POST /vendas` — opens a sale on the caller's open session (body empty).
- `POST /vendas/:id/itens` — body `{ variacaoId | sku | codigoBarras, quantidade }` → adds an item at the variation's current price; fails when the variation is unknown (`VARIACAO_NAO_ENCONTRADA`) or inactive (`VARIACAO_INATIVA`).
- `DELETE /vendas/:id/itens/:itemId` — removes an item.
- `PATCH /vendas/:id/itens/:itemId/quantidade` — body `{ quantidade }` → changes an item's quantity, revalidating available stock.
- `PATCH /vendas/:id/desconto` — body `{ tipo: VALOR|PERCENTUAL, valor }` → applies a discount.
- `POST /vendas/:id/pagamentos` — body `{ forma, valor }` → registers one payment incrementally on the open sale.
- `POST /vendas/:id/finalizar` — body `{ pagamentos: [{ forma, valor }] }` → redefines the sale's payments with the given set and concludes the sale (stock baixa + cash) in one transaction.
- `POST /vendas/:id/cancelar` — cancels the sale, reversing stock/cash.

#### Scenario: Create returns an open sale

- **WHEN** an operator with an open session `POST /vendas`
- **THEN** the response is an `ABERTA` sale bound to that session

#### Scenario: Add item returns the updated sale

- **WHEN** `POST /vendas/:id/itens` with a valid variation reference and `quantidade > 0`
- **THEN** the item is added at the variation's current price and the updated sale (with recomputed totals) is returned

#### Scenario: Change item quantity returns the updated sale

- **WHEN** `PATCH /vendas/:id/itens/:itemId/quantidade` with a `quantidade > 0` covered by available stock
- **THEN** the item quantity is updated and the sale returns with recomputed totals

#### Scenario: Incremental payment is registered

- **WHEN** `POST /vendas/:id/pagamentos` with a valid `{ forma, valor > 0 }` on an `ABERTA` sale
- **THEN** the payment is appended and the updated sale is returned

#### Scenario: Finalize returns the concluded sale

- **WHEN** `POST /vendas/:id/finalizar` with payments summing to the total
- **THEN** the response is the `CONCLUIDA` sale after stock and cash committed atomically

### Requirement: Sale error mapping

The system SHALL map `VendaError` codes to HTTP via the shared error mapper: `NO_OPEN_CASH_SESSION`/`INSUFFICIENT_STOCK`/`PAYMENT_MISMATCH`/`CASH_SESSION_CLOSED`/`SALE_ALREADY_FINALIZED`/`SALE_NOT_OPEN` → 409/422; `SALE_NOT_FOUND`/`ITEM_NOT_FOUND`/`VARIACAO_NAO_ENCONTRADA` → 404; `VARIACAO_INATIVA` → 422; `ACESSO_NEGADO` → 403; `INVALID_QUANTITY`/`INVALID_PRICE`/`INVALID_DISCOUNT`/`DISCOUNT_EXCEEDS_SUBTOTAL`/`INVALID_PAYMENT`/`SALE_HAS_NO_ITEMS` → 400/422.

#### Scenario: Business-state failures map to 409/422

- **WHEN** finalize fails with `PAYMENT_MISMATCH` or `INSUFFICIENT_STOCK`
- **THEN** the HTTP response is 409 or 422 carrying the code

#### Scenario: Unknown sale maps to 404

- **WHEN** a route targets a sale id that does not exist
- **THEN** the response is 404 (`SALE_NOT_FOUND`)

#### Scenario: Variation failures map to 404/422

- **WHEN** an item is added for an unknown variation or an inactive variation
- **THEN** the response is 404 (`VARIACAO_NAO_ENCONTRADA`) or 422 (`VARIACAO_INATIVA`)

#### Scenario: Invalid input maps to 400/422

- **WHEN** an item is added with `quantidade ≤ 0` or a discount exceeds the subtotal
- **THEN** the response is 400/422 (`INVALID_QUANTITY` / `DISCOUNT_EXCEEDS_SUBTOTAL`)
