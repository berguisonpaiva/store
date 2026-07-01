## ADDED Requirements

### Requirement: PDV sale screen gated by an open cash session

The system SHALL provide a PDV operation screen in `apps/frontend/src/modules/vendas` that requires the operator to have an open cash session. When the API returns `NO_OPEN_CASH_SESSION`, the screen MUST block selling and guide the operator to open a cash drawer.

#### Scenario: No open session blocks the screen

- **WHEN** the operator opens the PDV screen without an open cash session
- **THEN** selling is blocked and a message instructs the operator to open a cash session

#### Scenario: Open session enables selling

- **WHEN** the operator has an open session
- **THEN** the item-entry field is focused and ready to add items

### Requirement: Single item-entry field by SKU, barcode, or name

The system SHALL provide a single entry field that accepts a SKU, a scanned barcode (bip), or a name search with autocomplete (`@headlessui/react` `Combobox` via `Controller`), resolving to an existing active variation. Adding an item MUST NOT reload the screen, and focus MUST return to the entry field after each add.

#### Scenario: Add item by barcode scan

- **WHEN** the operator scans a barcode into the entry field
- **THEN** the matching active variation is added as a line without a page reload and focus returns to the field

#### Scenario: Add item by name search

- **WHEN** the operator types a name
- **THEN** the `Combobox` shows matching active variations to pick from

### Requirement: Editable item list with snapshot price

The system SHALL render the sale's items with an editable quantity (`> 0`, `≤` available balance), a read-only `precoUnitario` (snapshot), and a per-line total. Monetary fields SHALL use `NumericFormat` via `Controller`.

#### Scenario: Quantity validation

- **WHEN** the operator sets a quantity ≤ 0 or above the available balance
- **THEN** the field shows a validation error and the line total is not updated

#### Scenario: Price is read-only

- **WHEN** viewing a line
- **THEN** `precoUnitario` is read-only and reflects the snapshot captured when the item was added

### Requirement: Live totals and discount

The system SHALL display `subtotal`, `desconto`, and `total`, recomputing them on every change. The discount control SHALL offer `valor`/`percentual` with a value `≥ 0` that is never greater than the subtotal (Zod-validated).

#### Scenario: Totals recompute on change

- **WHEN** an item or the discount changes
- **THEN** subtotal, discount, and total update immediately with `total = subtotal − desconto`

#### Scenario: Discount cannot exceed subtotal

- **WHEN** the operator enters a discount greater than the subtotal
- **THEN** the schema rejects it before submission

### Requirement: Finalize with payment equal to total

The system SHALL provide a payment step where the sum of payments must equal the `total` before finalization is allowed. When the API returns `PAYMENT_MISMATCH`, finalization MUST stay blocked.

#### Scenario: Finalize blocked until payments match

- **WHEN** the payments sum differs from `total`
- **THEN** the finalize action is disabled/blocked

#### Scenario: Finalize allowed when payments match

- **WHEN** the payments sum equals `total`
- **THEN** the operator can finalize the sale

### Requirement: Cancel before session close

The system SHALL allow cancelling the sale while the operator's cash session is open, and hide/disable the action once it is no longer permitted.

#### Scenario: Cancel available before close

- **WHEN** the session is open
- **THEN** the cancel action is available and triggers `POST /vendas/:id/cancelar`

### Requirement: Map API error codes to UI states

The system SHALL map API error codes to UI behavior: `NO_OPEN_CASH_SESSION` blocks the sale; `INSUFFICIENT_STOCK` highlights the offending item; `PAYMENT_MISMATCH` blocks finalization until payments equal total; `SALE_ALREADY_FINALIZED` switches the sale to read-only.

#### Scenario: Insufficient stock highlights the item

- **WHEN** finalization returns `INSUFFICIENT_STOCK`
- **THEN** the item without balance is highlighted

#### Scenario: Finalized sale becomes read-only

- **WHEN** the API returns `SALE_ALREADY_FINALIZED`
- **THEN** the sale UI becomes read-only
