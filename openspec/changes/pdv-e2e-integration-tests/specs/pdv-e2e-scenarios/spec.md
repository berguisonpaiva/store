## ADDED Requirements

Every scenario below is an HTTP e2e assertion against the real app + real Postgres. Error assertions SHALL verify **both** the HTTP status **and** the stable code in the response body. Roles reflect the real controllers.

### Requirement: Authentication e2e coverage (RT01)

The suite SHALL cover `POST /auth/login`, `GET /auth/me`, and `POST /auth/refresh` for success and every failure.

#### Scenario: Login with seeded admin

- **WHEN** `POST /auth/login` is called with `admin@store.local` / `Admin!123`
- **THEN** the response is 200/201 with `accessToken`, `refreshToken`, and the user's id/name/email/role

#### Scenario: Login with wrong password

- **WHEN** login is called with a valid email and wrong password
- **THEN** 401 with code `INVALID_CREDENTIALS`

#### Scenario: Login with unknown email

- **WHEN** login is called with an email that does not exist
- **THEN** 401 with code `INVALID_CREDENTIALS`

#### Scenario: Login of a deactivated user

- **WHEN** a previously deactivated user attempts login
- **THEN** 401 with code `USER_INACTIVE`

#### Scenario: /auth/me with valid, missing, and invalid token

- **WHEN** `GET /auth/me` is called with a valid token, then with no token, then with an invalid/expired token
- **THEN** the valid call returns 200 with id/name/email/role; the missing-token call returns 401; the invalid-token call returns 401 (code `INVALID_TOKEN` or the JwtGuard's generic 401)

#### Scenario: Refresh with valid and invalid token

- **WHEN** `POST /auth/refresh` is called with a valid refresh token, then with an invalid one
- **THEN** the valid call returns a new `accessToken`; the invalid call returns 401 with code `INVALID_TOKEN`

### Requirement: User management e2e coverage (RT02)

The suite SHALL cover ADMIN user CRUD, activation/deactivation, validation, and pagination.

#### Scenario: Admin creates an operador

- **WHEN** ADMIN `POST /users` creates a user with role OPERADOR
- **THEN** 201 with an active OPERADOR

#### Scenario: Duplicate email

- **WHEN** ADMIN creates a user with an email already in use
- **THEN** 409 with code `EMAIL_ALREADY_IN_USE`

#### Scenario: Invalid role and invalid value objects

- **WHEN** a user is created with an invalid role, then with a weak password / invalid email
- **THEN** the invalid role returns 400 `INVALID_ROLE`; the invalid VO returns 400

#### Scenario: Patch nonexistent user

- **WHEN** `PATCH /users/:id` targets a nonexistent id
- **THEN** 404 with code `USER_NOT_FOUND`

#### Scenario: Deactivate then reactivate cycle

- **WHEN** ADMIN deactivates an operador, the operador attempts login, then ADMIN reactivates and the operador logs in again
- **THEN** the login while deactivated returns 401 `USER_INACTIVE`; after reactivation login returns 200

#### Scenario: Admin cannot deactivate self

- **WHEN** ADMIN calls deactivate on their own user id
- **THEN** the request fails with code `CANNOT_DEACTIVATE_SELF`

#### Scenario: Paginated user list

- **WHEN** ADMIN `GET /users` is called
- **THEN** 200 with the standard pagination structure

### Requirement: Permission matrix e2e coverage (RT03)

For every guarded endpoint the suite SHALL assert behavior for ADMIN, OPERADOR, and anonymous, and SHALL assert per-operator ownership scoping for cash sessions and sales.

#### Scenario: Admin-only write endpoints reject operador and anonymous

- **WHEN** an OPERADOR then an anonymous caller hits an ADMIN-only endpoint (`POST/PATCH/GET /users`, `POST/PATCH /categories`, `POST/PATCH /products` and variation writes, `POST /inventory/adjustments`, `GET /inventory/low-stock`, `GET /caixa`)
- **THEN** the OPERADOR gets 403 and the anonymous caller gets 401

#### Scenario: Shared PDV endpoints allow both roles but not anonymous

- **WHEN** ADMIN and OPERADOR call the PDV lookups/commands (`GET /variations/by-sku/:sku`, `by-barcode/:barcode`, `POST /inventory/entries`, `/exits`, `POST /caixa/abrir`, vendas commands)
- **THEN** both roles are allowed and the anonymous caller gets 401

#### Scenario: Operador cannot read another operador's cash session

- **WHEN** OPERADOR B requests `GET /caixa/:id` of a session owned by OPERADOR A, and ADMIN requests the same
- **THEN** OPERADOR B gets 403 (`ACESSO_NEGADO` or `NAO_E_DONO_DO_CAIXA`) and ADMIN gets 200

#### Scenario: Operador cannot read another operador's sale

- **WHEN** OPERADOR B requests `GET /vendas/:id` of a sale owned by OPERADOR A, and ADMIN requests the same
- **THEN** OPERADOR B gets 403 `ACESSO_NEGADO` and ADMIN gets 200

#### Scenario: Sangria on another operador's cash session

- **WHEN** OPERADOR B calls `POST /caixa/:id/sangria` on OPERADOR A's session, and an anonymous caller does the same
- **THEN** OPERADOR B gets 403 `NAO_E_DONO_DO_CAIXA` and the anonymous caller gets 401

### Requirement: Category e2e coverage (RT04)

The suite SHALL cover category creation, duplicate handling, not-found, active filtering, and the inactive-category effect on product creation.

#### Scenario: Create and duplicate category

- **WHEN** ADMIN creates a category, then creates another with the same name, then renames a third to an existing name
- **THEN** the first returns 201; the duplicate and the colliding rename each return 409 `CATEGORY_ALREADY_EXISTS`

#### Scenario: Patch nonexistent category

- **WHEN** `PATCH /categories/:id` targets a nonexistent id
- **THEN** 404 with code `CATEGORY_NOT_FOUND`

#### Scenario: Inactive category blocks product creation, reactivation restores it

- **WHEN** a category is deactivated and a product is created under it, then the category is reactivated and the product is created again
- **THEN** the first creation fails with code `CATEGORY_INACTIVE`; after reactivation the creation returns 201

#### Scenario: Active filter

- **WHEN** `GET /categories?active=true` is called with a mix of active/inactive categories
- **THEN** 200 returning only active categories

### Requirement: Product and variation e2e coverage (RT05)

The suite SHALL cover product creation with variations, all uniqueness/validation failures, and by-sku/by-barcode lookups.

#### Scenario: Create product with variations

- **WHEN** ADMIN creates a product with one or more variations (price > 0)
- **THEN** 201 with the product and its variations

#### Scenario: Product must have a variation

- **WHEN** a product is created with no variation
- **THEN** the request fails with code `PRODUCT_MUST_HAVE_VARIATION` (422)

#### Scenario: Product under nonexistent category

- **WHEN** a product is created referencing a nonexistent category
- **THEN** 404 with code `CATEGORY_NOT_FOUND`

#### Scenario: Duplicate SKU and barcode

- **WHEN** a product is created with a SKU already in use, then with a barcode already in use (within one POST or across products)
- **THEN** 409 `SKU_ALREADY_IN_USE` and 409 `BARCODE_ALREADY_IN_USE` respectively

#### Scenario: Invalid price

- **WHEN** a variation is created with a zero or negative price
- **THEN** 400 with code `INVALID_PRICE`

#### Scenario: Not-found reads

- **WHEN** `GET /products/:id` targets a nonexistent id and `PATCH` targets a nonexistent variation
- **THEN** 404 `PRODUCT_NOT_FOUND` and 404 `VARIATION_NOT_FOUND` respectively

#### Scenario: Lookup by sku and barcode

- **WHEN** `GET /variations/by-sku/:sku` and `by-barcode/:barcode` are called for an existing variation, then for a nonexistent sku
- **THEN** the existing lookups return 200 with the current price; the nonexistent sku returns 404

### Requirement: Inventory e2e coverage (RT06)

The suite SHALL cover entries/exits/adjustments, balance and ledger reads, and all validation failures.

#### Scenario: Entry updates balance

- **WHEN** an inventory entry is posted for a variation
- **THEN** `GET /inventory/variations/:variacaoId/balance` reflects the new balance

#### Scenario: Non-positive quantity

- **WHEN** an entry or exit is posted with quantity ≤ 0
- **THEN** 400 with code `QUANTIDADE_INVALIDA`

#### Scenario: Exit exceeding balance

- **WHEN** an exit larger than the current balance is posted
- **THEN** 422 with code `ESTOQUE_INSUFICIENTE`

#### Scenario: Movement on nonexistent variation

- **WHEN** a movement targets a nonexistent variation
- **THEN** 404 with code `VARIACAO_NAO_ENCONTRADA`

#### Scenario: Absolute adjustment and invalid adjustment

- **WHEN** ADMIN posts an absolute adjustment, then posts one with a negative target value
- **THEN** the valid adjustment sets the balance to the adjusted value; the negative one returns 400 `SALDO_INVALIDO`

#### Scenario: Ledger listing and low-stock

- **WHEN** `GET /inventory/variations/:variacaoId/movements` is called and `GET /inventory/low-stock` is called with a variation below its minimum
- **THEN** the ledger returns 200 paginated in order and low-stock returns 200 listing the below-minimum variation

### Requirement: Cash session e2e coverage (RT07)

The suite SHALL cover open/close, sangria/suprimento, ownership, closed-session rules, pending-sale blocking, and cent-exact summary math.

#### Scenario: Open cash session

- **WHEN** an OPERADOR opens a cash session
- **THEN** 201 with an ABERTA session and an ABERTURA movement

#### Scenario: Second open by same operador

- **WHEN** the same operador opens a second session while one is open
- **THEN** 409 with code `CAIXA_JA_ABERTO`

#### Scenario: Two operadores open simultaneously

- **WHEN** two different operadores each open a session
- **THEN** both return 201

#### Scenario: Open with negative value

- **WHEN** a session is opened with a negative opening value
- **THEN** 400 with code `VALOR_INVALIDO`

#### Scenario: Sangria and suprimento in open session

- **WHEN** valid sangria and suprimento are posted to an open session, then one with value ≤ 0
- **THEN** the valid ones return 201 with recorded movements; the non-positive one returns 400 `VALOR_INVALIDO`

#### Scenario: Sangria on foreign or closed session

- **WHEN** a sangria targets another operador's session, then a closed session
- **THEN** the foreign one returns 403 `NAO_E_DONO_DO_CAIXA`; the closed one returns 409 `CAIXA_JA_FECHADO`

#### Scenario: Close produces correct automatic summary

- **WHEN** a session with a DINHEIRO+PIX-paid sale, plus suprimentos and sangrias, is closed and `GET /caixa/:id/resumo` is read
- **THEN** totalVendas, qtdVendas, totalPorForma, sangrias and suprimentos are correct and `saldoEsperado = abertura + vendas em DINHEIRO + suprimentos − sangrias` to the exact cent (card/pix excluded from physical cash)

#### Scenario: Close guards

- **WHEN** an already-closed session is closed, a session with an open sale is closed, and a nonexistent session is closed
- **THEN** they return 409 `CAIXA_JA_FECHADO`, 409 `VENDA_PENDENTE_NO_FECHAMENTO`, and 404 `CAIXA_NAO_ENCONTRADO` respectively

#### Scenario: Admin closes operador session and empty open lookup

- **WHEN** ADMIN closes an operador's session, and `GET /caixa/aberto` is read with no open session
- **THEN** the admin close is permitted per current rule, and the open lookup returns the current empty/404 contract

### Requirement: Sales e2e coverage (RT08)

The suite SHALL cover sale creation, item/discount/payment operations, finalize/cancel, transactional rollback, ownership scoping, and every failure.

#### Scenario: Create sale requires an open cash session

- **WHEN** a sale is created with no open session, then with an open session
- **THEN** the first returns 409 `NO_OPEN_CASH_SESSION`; the second returns 201 with `sessaoCaixaId` set to the operador's session

#### Scenario: Add item by variacaoId, sku and barcode

- **WHEN** items are added via variacaoId, via sku, and via codigoBarras
- **THEN** each returns 201 with the item priced at the variation's current price

#### Scenario: Add-item failures

- **WHEN** an item is added for a nonexistent variation, an inactive variation, with insufficient stock, and with quantity ≤ 0
- **THEN** 404 `VARIACAO_NAO_ENCONTRADA`, 422 `VARIACAO_INATIVA`, 422 `INSUFFICIENT_STOCK`, and 400 `INVALID_QUANTITY` respectively

#### Scenario: Quantity change and item removal failures

- **WHEN** an item quantity is changed above available stock, and a nonexistent item is removed
- **THEN** 422 `INSUFFICIENT_STOCK` and 404 `ITEM_NOT_FOUND` respectively

#### Scenario: Discount failures

- **WHEN** a discount greater than the subtotal is applied, then a negative/invalid-percent discount
- **THEN** 422 `DISCOUNT_EXCEEDS_SUBTOTAL` and 400 `INVALID_DISCOUNT` respectively

#### Scenario: Payment and finalize failures

- **WHEN** a payment with value ≤ 0 or invalid form is posted, a sale is finalized with no items, and a sale is finalized with Σ payments ≠ total
- **THEN** 400 `INVALID_PAYMENT`, 422 `SALE_HAS_NO_ITEMS`, and 422 `PAYMENT_MISMATCH` respectively

#### Scenario: Finalize with exact split payment

- **WHEN** a sale is finalized with an exact DINHEIRO + CARTAO_CREDITO split (Σ payments == total)
- **THEN** 200/201 with status CONCLUIDA, stock decremented, and a VENDA movement recorded in the cash session

#### Scenario: Operations on a finalized sale

- **WHEN** an item/discount/payment change is attempted on a CONCLUIDA sale, and the sale is finalized again
- **THEN** the change returns 409/422 (`SALE_NOT_OPEN` or `SALE_ALREADY_FINALIZED`) and the re-finalize returns `SALE_ALREADY_FINALIZED`

#### Scenario: Finalize rollback when stock depleted mid-flight

- **WHEN** stock is exhausted between adding items and finalizing, then finalize is attempted
- **THEN** finalize fails, the sale stays ABERTA, no cash movement is created, and the stock balance is unchanged

#### Scenario: Cancel open and finalized sales

- **WHEN** an ABERTA sale is cancelled, then a CONCLUIDA sale is cancelled
- **THEN** the open one becomes CANCELADA with no reversal; the finalized one becomes CANCELADA with stock reverted and a reversal movement in the cash session

#### Scenario: Cash-session-closed guards on sales

- **WHEN** a CONCLUIDA sale is cancelled after its session is closed, and a sale of a closed session is finalized
- **THEN** both return 409 (`CASH_SESSION_CLOSED` / `CAIXA_JA_FECHADO`)

#### Scenario: Sale not found and list scoping

- **WHEN** `GET /vendas/:id` targets a nonexistent id, and OPERADOR vs ADMIN list `GET /vendas`
- **THEN** the read returns 404 `SALE_NOT_FOUND`; the OPERADOR sees only their sales and ADMIN sees all

### Requirement: End-to-end happy-path flow (RT09)

The suite SHALL execute the full flow — login → create operador → login operador → category → product+variation → stock entry → open cash → sale → item → discount → split payment → finalize → verify stock decremented and VENDA movement → close cash → verify summary — as one sequential test, asserting each step and the final cash summary to the exact cent.

#### Scenario: Full PDV flow succeeds with cent-exact summary

- **WHEN** the full flow is executed end-to-end against the real app and DB
- **THEN** every step returns its expected status, the finalized sale decrements stock and records a VENDA movement, and the closed-session summary matches `saldoEsperado = abertura + dinheiro + suprimentos − sangrias` to the exact cent
