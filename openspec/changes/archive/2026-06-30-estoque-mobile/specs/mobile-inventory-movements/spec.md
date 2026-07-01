## ADDED Requirements

### Requirement: Stock-movement use cases in domain

The system SHALL define quick stock-movement use cases in `lib/domain/estoque/` — `RegisterEntry` (registrar-entrada), `RegisterExit` (registrar-saida), and `AdjustBalance` (ajustar-saldo) — on the `InventoryRepository` contract, returning fpdart `Either<InventoryFailure, T>`, free of Flutter and infrastructure. `RegisterEntry`/`RegisterExit` require `quantidade > 0`; `AdjustBalance` requires `novoSaldo >= 0`.

#### Scenario: Movement use cases declared

- **WHEN** `lib/domain/estoque/` is inspected
- **THEN** `RegisterEntry`, `RegisterExit`, and `AdjustBalance` exist and return `Either<InventoryFailure, T>` without throwing for business outcomes

### Requirement: Stock-movement repository against command endpoints

The system SHALL implement the write side of the contract in `lib/data/estoque/` against `POST /api/inventory/entrada`, `POST /api/inventory/saida`, and `POST /api/inventory/ajuste` via the shared `HttpClient`, mapping request DTOs from the domain and converting `AppException`s and backend error codes (`VARIACAO_NAO_ENCONTRADA`, `ESTOQUE_INSUFICIENTE`, `QUANTIDADE_INVALIDA`) into the matching `InventoryFailure`s.

#### Scenario: Command endpoints wired

- **WHEN** the inventory data source is inspected
- **THEN** it targets the entrada, saida, and ajuste endpoints and sends domain-derived request DTOs

#### Scenario: Domain error codes mapped to failures

- **WHEN** a command call returns `ESTOQUE_INSUFICIENTE`, `VARIACAO_NAO_ENCONTRADA`, or `QUANTIDADE_INVALIDA`
- **THEN** the repository returns the matching `InventoryFailure` (`InsufficientStock`, `VariationNotFound`, `InvalidQuantity`) via `Either`

### Requirement: Registrar entrada de estoque (UI)

The system SHALL provide an entrada form (MVVM Cubit, explicit-bloc, no `BlocProvider`) that takes a variation (by SKU/barcode), a `quantidade > 0`, a `motivo` of `COMPRA`/`DEVOLUCAO`/`AJUSTE`, and an optional observação, calling `RegisterEntry` and showing success or a domain-error `AppToast`.

#### Scenario: Valid entry increases balance

- **WHEN** the user submits an entrada for an existing variation with `motivo` COMPRA and `quantidade > 0`
- **THEN** the movement is registered and the new balance is reflected (RF-EST-01)

#### Scenario: Entry for unknown variation

- **WHEN** the variation does not exist (`VARIACAO_NAO_ENCONTRADA`)
- **THEN** a not-found message is shown via `AppToast` (RF-EST-01)

### Requirement: Registrar saída manual (UI)

The system SHALL provide a saída form that takes a variation, a `quantidade > 0`, a `motivo` of `PERDA`/`AJUSTE`, and an optional observação, calling `RegisterExit`, and MUST surface `ESTOQUE_INSUFICIENTE` via `AppToast` when the exit would drive the balance negative.

#### Scenario: Valid exit decreases balance

- **WHEN** the user submits a saída for a variation with sufficient balance, `motivo` PERDA and `quantidade > 0`
- **THEN** the movement is registered and the new balance is reflected (RF-EST-02)

#### Scenario: Exit beyond available balance is blocked

- **WHEN** the requested `quantidade` exceeds the current balance (`ESTOQUE_INSUFICIENTE`)
- **THEN** no movement is registered and an insufficient-stock message is shown via `AppToast` (RF-EST-05)

### Requirement: Ajustar saldo (UI)

The system SHALL provide an ajuste form (inventory correction) that takes a variation, a `novoSaldo >= 0`, and a required observação (justification), calling `AdjustBalance`, recording the difference as a movement and surfacing `QUANTIDADE_INVALIDA` via `AppToast` for an invalid target.

#### Scenario: Adjustment sets the balance

- **WHEN** the user submits an ajuste with a `novoSaldo` different from the current balance and a justification
- **THEN** the balance is set to `novoSaldo` and the difference is recorded as a movement (RF-EST-04)

#### Scenario: Invalid target balance

- **WHEN** the user submits `novoSaldo < 0` (`QUANTIDADE_INVALIDA`)
- **THEN** no movement is registered and an invalid-quantity message is shown via `AppToast`

### Requirement: Dependency injection and routing for movements

The system SHALL register the stock-movement use cases and the movement cubit(s) in get_it, add the entrada/saida/ajuste routes (or sections), behind the existing auth session, with the movement ViewModels free of Flutter imports.

#### Scenario: Resolvable and routed

- **WHEN** the app boots authenticated
- **THEN** the movement cubit(s) resolve from get_it and the entrada/saida/ajuste flows are reachable

#### Scenario: ViewModels are Flutter-free

- **WHEN** the movement ViewModels/Cubits are inspected
- **THEN** they contain no Flutter imports and delegate to the use cases
