## MODIFIED Requirements

### Requirement: PDV variation lookup by SKU and barcode

The system SHALL provide the Atos "Consulta de produto" screen as the operator's read-only lookup: a single search field that resolves products/variations by name, SKU, or barcode (the PDV bipe), listing each result with its name, SKU (mono), unit price (tabular), and a stock badge, and showing an `AppToast` when nothing matches. The screen is read-only — it exposes no create/edit action.

#### Scenario: Lookup by barcode

- **WHEN** a known barcode is entered/scanned
- **THEN** the matching variation and its product (name, SKU, price, stock badge) are shown (RF-CAT-07)

#### Scenario: Lookup by name or SKU

- **WHEN** a name term or SKU is typed
- **THEN** the matching products/variations are listed with price and stock badge

#### Scenario: Lookup not found

- **WHEN** the SKU/barcode/term matches nothing (`VariationNotFound`)
- **THEN** a not-found message is shown via `AppToast`

### Requirement: Dependency injection and routing

The system SHALL register the catalog data source, repository, use cases, and the consulta cubit in get_it, and add a single "Consulta de produto" route behind the existing auth session. No product list/admin route is registered on mobile.

#### Scenario: Resolvable and routed

- **WHEN** the app boots authenticated
- **THEN** the consulta cubit resolves from get_it and the Consulta de produto screen is reachable via its route

#### Scenario: ViewModels are Flutter-free

- **WHEN** the catalog ViewModels/Cubits are inspected
- **THEN** they contain no Flutter imports and delegate to use cases

## REMOVED Requirements

### Requirement: Products list UI with search and filter

**Reason**: The mobile app is reduced to the Operador PDV surface; a paginated product browse/detail list is not part of the operator workflow. Product read/browse is replaced by the read-only "Consulta de produto" lookup.

**Migration**: Use the "Consulta de produto" screen for price/stock lookup on mobile; full product management and browsing remain on the web admin surface (`web-product-catalog`).
