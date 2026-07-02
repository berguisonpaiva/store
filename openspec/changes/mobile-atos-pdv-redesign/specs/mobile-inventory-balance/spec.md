## MODIFIED Requirements

### Requirement: Consultar saldo by SKU or barcode

The system SHALL surface a variation's `saldoAtual` (and `estoqueMinimo`) to the operator **within the read-only "Consulta de produto" screen** (see `mobile-product-catalog`), resolved by a typed/scanned SKU or barcode, with an `AppToast` when the code matches nothing. No reservation/available value is shown, and there is no standalone inventory saldo-lookup screen on mobile.

#### Scenario: Balance shown in product consulta

- **WHEN** a known SKU or barcode is resolved in the Consulta de produto screen
- **THEN** the variation's `saldoAtual` (and `estoqueMinimo`) is shown as its stock badge (RF-EST-06)

#### Scenario: Lookup not found

- **WHEN** the SKU/barcode matches no variation (`VariationNotFound`)
- **THEN** a not-found message is shown via `AppToast`

### Requirement: Dependency injection and routing for inventory read

The system SHALL register the inventory read data source, repository, and read use case needed to resolve a variation's balance in get_it so the Consulta de produto screen can display stock, behind the existing auth session. No standalone inventory routes (saldo lookup, movement history, low-stock) are registered on mobile.

#### Scenario: Balance read resolvable

- **WHEN** the app boots authenticated
- **THEN** the inventory read dependency resolves from get_it and the Consulta de produto screen can display a variation's balance

#### Scenario: No standalone inventory routes

- **WHEN** the mobile router is inspected
- **THEN** no saldo-lookup, movement-history, or low-stock routes are registered

## REMOVED Requirements

### Requirement: Movement history by variation and period

**Reason**: The mobile app is reduced to the Operador PDV surface; browsing inventory movement history is an admin task.

**Migration**: View movement history on the web inventory surface (`web-inventory-movements`).

### Requirement: Low-stock alerts list

**Reason**: The mobile app is reduced to the Operador PDV surface; low-stock replenishment is an admin task and the endpoint is ADMIN-only.

**Migration**: View low-stock alerts on the web inventory/admin surface (`web-inventory-balance`).
