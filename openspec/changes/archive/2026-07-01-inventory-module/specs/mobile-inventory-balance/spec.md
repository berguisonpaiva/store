## MODIFIED Requirements

### Requirement: Inventory contract in domain

The system SHALL define an inventory contract in `lib/domain/estoque/` — entities (`StockBalanceEntity` with `saldoAtual` and `estoqueMinimo`; `StockMovementEntity` with `tipo`, `motivo`, `quantidade`, `saldoResultante`, timestamp; `LowStockItemEntity`), an `InventoryRepository` interface (consultar saldo by SKU, consultar saldo by barcode, listar movimentações por variação/período, listar abaixo do mínimo), and `InventoryFailure`s — free of Flutter and infrastructure, returning fpdart `Either<Failure, T>`. `StockBalanceEntity` MUST NOT carry `quantidadeReservada`/`saldoDisponivel`.

#### Scenario: Domain contract present

- **WHEN** `lib/domain/estoque/` is inspected
- **THEN** the entities, repository interface, and failures exist with no imports of Flutter, `data`, or `core`, and `StockBalanceEntity` exposes `saldoAtual` and `estoqueMinimo` only

#### Scenario: Either-based results

- **WHEN** an inventory use case or repository method is declared
- **THEN** it returns an `Either<Failure, T>` rather than throwing for business outcomes

### Requirement: Consultar saldo by SKU or barcode

The system SHALL provide a saldo-lookup screen (MVVM Cubit, explicit-bloc, no `BlocProvider`) that resolves a variation by a typed/scanned SKU or barcode and shows its `saldoAtual` (and `estoqueMinimo`), with an `AppToast` when the code matches nothing. No reservation/available value is shown.

#### Scenario: Lookup shows current balance

- **WHEN** a known SKU or barcode is entered/scanned
- **THEN** the variation's `saldoAtual` (and `estoqueMinimo`) is shown (RF-EST-06)

#### Scenario: Lookup not found

- **WHEN** the SKU/barcode matches no variation (`VariationNotFound`)
- **THEN** a not-found message is shown via `AppToast`
