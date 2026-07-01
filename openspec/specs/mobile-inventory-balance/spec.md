# mobile-inventory-balance Specification

## Purpose
TBD - created by archiving change estoque-mobile. Update Purpose after archive.
## Requirements
### Requirement: Inventory contract in domain

The system SHALL define an inventory contract in `lib/domain/estoque/` — entities (`StockBalanceEntity` with `saldoAtual` and `estoqueMinimo`; `StockMovementEntity` with `tipo`, `motivo`, `quantidade`, `saldoResultante`, timestamp; `LowStockItemEntity`), an `InventoryRepository` interface (consultar saldo by SKU, consultar saldo by barcode, listar movimentações por variação/período, listar abaixo do mínimo), and `InventoryFailure`s — free of Flutter and infrastructure, returning fpdart `Either<Failure, T>`. `StockBalanceEntity` MUST NOT carry `quantidadeReservada`/`saldoDisponivel`.

#### Scenario: Domain contract present

- **WHEN** `lib/domain/estoque/` is inspected
- **THEN** the entities, repository interface, and failures exist with no imports of Flutter, `data`, or `core`, and `StockBalanceEntity` exposes `saldoAtual` and `estoqueMinimo` only

#### Scenario: Either-based results

- **WHEN** an inventory use case or repository method is declared
- **THEN** it returns an `Either<Failure, T>` rather than throwing for business outcomes

### Requirement: Inventory read repository against the backend

The system SHALL implement the read side of the contract in `lib/data/estoque/` against `GET /api/inventory/balance/by-sku/:sku`, `GET /api/inventory/balance/by-barcode/:barcode`, `GET /api/inventory/movements`, and `GET /api/inventory/low-stock`, mapping DTOs to domain and converting technical `AppException`s into `InventoryFailure`s. Requests are authenticated via the shared `HttpClient` (bearer + 401 refresh).

#### Scenario: Read endpoints wired

- **WHEN** the inventory data source is inspected
- **THEN** it targets the balance, movements, and low-stock endpoints and maps responses to domain entities

#### Scenario: Exceptions converted to Failures

- **WHEN** a data source throws an `AppException` during an inventory read call
- **THEN** the repository returns a domain `InventoryFailure` via `Either`

### Requirement: Consultar saldo by SKU or barcode

The system SHALL provide a saldo-lookup screen (MVVM Cubit, explicit-bloc, no `BlocProvider`) that resolves a variation by a typed/scanned SKU or barcode and shows its `saldoAtual` (and `estoqueMinimo`), with an `AppToast` when the code matches nothing. No reservation/available value is shown.

#### Scenario: Lookup shows current balance

- **WHEN** a known SKU or barcode is entered/scanned
- **THEN** the variation's `saldoAtual` (and `estoqueMinimo`) is shown (RF-EST-06)

#### Scenario: Lookup not found

- **WHEN** the SKU/barcode matches no variation (`VariationNotFound`)
- **THEN** a not-found message is shown via `AppToast`

### Requirement: Movement history by variation and period

The system SHALL provide a movement-history view that lists the `MovimentacaoEstoque` records for a variation, optionally filtered by period, showing `tipo`, `motivo`, `quantidade`, `saldoResultante`, and timestamp.

#### Scenario: History listed for a variation

- **WHEN** the user opens the movement history for a variation
- **THEN** its movements are listed with tipo, motivo, quantidade, saldoResultante, and date (RF-EST-07)

#### Scenario: History filtered by period

- **WHEN** the user applies a period filter
- **THEN** only movements within that period are shown (RF-EST-07)

### Requirement: Low-stock alerts list

The system SHALL provide a low-stock alerts list that shows variations whose `saldoAtual` is at or below `estoqueMinimo`, for replenishment.

#### Scenario: Variations below minimum are listed

- **WHEN** the low-stock alerts screen loads
- **THEN** variations at or below their `estoqueMinimo` are listed for replenishment (RF-EST-08)

### Requirement: Dependency injection and routing for inventory read

The system SHALL register the inventory data source, repository, read use cases, and read cubits in get_it, add the inventory routes (saldo lookup, movement history, low-stock), and a navigation entry, behind the existing auth session.

#### Scenario: Resolvable and routed

- **WHEN** the app boots authenticated
- **THEN** the inventory read cubits resolve from get_it and the inventory screens are reachable via their routes

#### Scenario: ViewModels are Flutter-free

- **WHEN** the inventory read ViewModels/Cubits are inspected
- **THEN** they contain no Flutter imports and delegate to use cases

