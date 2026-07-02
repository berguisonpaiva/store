## ADDED Requirements

### Requirement: Canonical error-code to HTTP-status mapping

`domain-error.mapper.ts` SHALL map every stable domain error code to the HTTP status defined by the canonical table below, and SHALL place the stable code in the response body so clients can branch on it. Error codes are a contract with the mobile app and SHALL NOT be renamed. When the mapper diverges from this table, the mapper (and the mobile failure mappers) SHALL be corrected with a minimal diff; the e2e assertions are the enforcement of this table.

Canonical table:

- **401** — `INVALID_CREDENTIALS`, `INVALID_TOKEN`, `USER_INACTIVE`
- **403** — `OPERATION_NOT_ALLOWED_FOR_ROLE`, `ACESSO_NEGADO`, `NAO_E_DONO_DO_CAIXA`
- **404** — `USER_NOT_FOUND`, `CATEGORY_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `VARIATION_NOT_FOUND`, `VARIACAO_NAO_ENCONTRADA`, `CAIXA_NAO_ENCONTRADO`, `SALE_NOT_FOUND`, `ITEM_NOT_FOUND`
- **409** — `EMAIL_ALREADY_IN_USE`, `CATEGORY_ALREADY_EXISTS`, `SKU_ALREADY_IN_USE`, `BARCODE_ALREADY_IN_USE`, `LEDGER_IMUTAVEL`, `CAIXA_JA_ABERTO`, `CAIXA_JA_FECHADO`, `NO_OPEN_CASH_SESSION`, `CASH_SESSION_CLOSED`, `VENDA_PENDENTE_NO_FECHAMENTO`, `SALE_ALREADY_FINALIZED`, `SALE_NOT_OPEN`
- **422** — `INSUFFICIENT_STOCK`, `ESTOQUE_INSUFICIENTE`, `PAYMENT_MISMATCH`, `SALE_HAS_NO_ITEMS`, `DISCOUNT_EXCEEDS_SUBTOTAL`, `VARIACAO_INATIVA`, `CATEGORY_INACTIVE`, `PRODUCT_MUST_HAVE_VARIATION`
- **400** — `INVALID_ROLE`, `INVALID_QUANTITY`, `QUANTIDADE_INVALIDA`, `INVALID_DISCOUNT`, `INVALID_PAYMENT`, `INVALID_PRICE`, `VALOR_INVALIDO`, `SALDO_INVALIDO`, `MOTIVO_MOVIMENTACAO_INVALIDO`, `CANNOT_DEACTIVATE_SELF`

#### Scenario: Every table code returns its declared status

- **WHEN** an e2e scenario provokes any code in the canonical table
- **THEN** the HTTP status equals the table value and the response body contains the exact stable code

#### Scenario: Unknown code defaults safely

- **WHEN** a domain failure carries a code not present in the mapper
- **THEN** the response is HTTP 400 (default) rather than 500, and the gap is surfaced to be added to the table

### Requirement: Correct the five divergent statuses

The mapper SHALL be changed (minimal diff) so the following codes match the canonical table, overriding their previous statuses: `ESTOQUE_INSUFICIENTE` → 422 (was 409), `NO_OPEN_CASH_SESSION` → 409 (was 422), `CANNOT_DEACTIVATE_SELF` → 400 (was 422), `VALOR_INVALIDO` → 400 (was 422), `INVALID_PRICE` → 400 (was 422). The mapper's unit spec SHALL be updated to assert the new statuses.

#### Scenario: ESTOQUE_INSUFICIENTE is 422

- **WHEN** an inventory exit exceeds the available balance
- **THEN** the response is HTTP 422 with code `ESTOQUE_INSUFICIENTE`

#### Scenario: NO_OPEN_CASH_SESSION is 409

- **WHEN** a sale is created while the operator has no open cash session
- **THEN** the response is HTTP 409 with code `NO_OPEN_CASH_SESSION`

#### Scenario: CANNOT_DEACTIVATE_SELF is 400

- **WHEN** an admin attempts to deactivate their own user
- **THEN** the response is HTTP 400 with code `CANNOT_DEACTIVATE_SELF`

#### Scenario: VALOR_INVALIDO is 400

- **WHEN** a cash open/sangria/suprimento is submitted with a non-positive value
- **THEN** the response is HTTP 400 with code `VALOR_INVALIDO`

#### Scenario: INVALID_PRICE is 400

- **WHEN** a product/variation is created with a zero or negative price
- **THEN** the response is HTTP 400 with code `INVALID_PRICE`

### Requirement: Mobile failure mappers realigned to new statuses

Any mobile failure mapper or datasource that branches on the HTTP status of the five corrected codes SHALL be updated so the mapped `Failure` remains correct under the new statuses, preserving a generic fallback.

#### Scenario: Mobile still maps corrected codes

- **WHEN** the mobile receives one of the five corrected codes at its new HTTP status
- **THEN** it resolves the same domain-specific `Failure` as before (not the generic fallback)
