## ADDED Requirements

### Requirement: Domain layer mirrors the sale model and failures

The system SHALL provide, in the Flutter `lib/domain`, `Venda` and `ItemVenda` entities (status `ABERTA/CONCLUIDA/CANCELADA`), a `VendasRepository` contract returning `Future<Either<Failure, T>>`, and use cases `CriarVenda`, `AdicionarItem`, `RemoverItem`, `AplicarDesconto`, `FinalizarVenda`, `CancelarVenda`, `BuscarVenda`, `ListarVendas`, `ResumoVendas`. Failures SHALL be `SaleNotFound`, `SaleAlreadyFinalized`, `NoOpenCashSession`, `InsufficientStock`, `PaymentMismatch`.

#### Scenario: Use case returns a failure

- **WHEN** a use case runs against a fake repository configured to fail (e.g. no open session)
- **THEN** it returns `Left(NoOpenCashSession)` and the matching failure type for each error code

#### Scenario: Use case happy path

- **WHEN** a use case runs against a fake repository configured to succeed
- **THEN** it returns `Right(value)` with the expected entity

### Requirement: Data layer maps HTTP errors to failures

The system SHALL provide `VendasRepositoryImpl` and `VendasRemoteDataSource` in `lib/data`, with DTOs/mappers for sale, item, discount, finalization (payments), and summary. HTTP errors/codes SHALL be mapped Exception → `Failure` consistent with the backend codes.

#### Scenario: HTTP 422 payment mismatch maps to PaymentMismatch

- **WHEN** the data source receives a 422 `PAYMENT_MISMATCH` response on finalize
- **THEN** `VendasRepositoryImpl` returns `Left(PaymentMismatch)`

#### Scenario: DTO ↔ entity round-trip

- **WHEN** a sale DTO is mapped to an entity and back
- **THEN** items, payments, and totals are preserved

### Requirement: PDV operation UI with MVVM/Cubit

The system SHALL provide, in `lib/ui`, a `VendaPdvView` (bip/search field, item list, subtotal/desconto/total summary, actions), a `DescontoSheet` (`valor`/`percentual` with value `≤ subtotal`), and a `FinalizarVendaView` (payment step that blocks until payments = total). ViewModels MUST NOT import Flutter; views MUST use `BlocBuilder` with an explicit bloc, `AppToast` for feedback, and confirm before cancelling a sale.

#### Scenario: Add item by bip recalculates totals

- **WHEN** the operator enters an item via the bip field
- **THEN** the item is added and subtotal/total recompute

#### Scenario: Finalize blocked on payment mismatch

- **WHEN** payments do not sum to `total`
- **THEN** the finalize action stays blocked and `PaymentMismatch` feedback is shown

#### Scenario: No open session blocks selling

- **WHEN** the operator has no open cash session
- **THEN** selling is blocked with guidance to open the cash drawer

#### Scenario: Finalized sale is read-only

- **WHEN** a sale is `CONCLUIDA`
- **THEN** its UI is read-only

### Requirement: App layer wiring and guarded routes

The system SHALL register the repository, data source, and use cases in `get_it` (`lib/app`) and define GoRouter routes guarded by an authenticated operator with an open cash session.

#### Scenario: Route guard requires operator and open session

- **WHEN** an unauthenticated user or one without an open session navigates to the PDV route
- **THEN** the guard redirects away from the sale screen

#### Scenario: Dependencies resolve from get_it

- **WHEN** the PDV feature is opened
- **THEN** its ViewModel, use cases, repository, and data source resolve from `get_it`
