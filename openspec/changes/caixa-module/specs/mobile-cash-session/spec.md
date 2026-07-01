## ADDED Requirements

### Requirement: Mobile cash-session domain and data layers

The system SHALL implement, in the Flutter app, `domain` entities (`SessaoCaixa`, `MovimentacaoCaixa`) mirroring the backend, a `CaixaRepository` contract returning `Future<Either<Failure, T>>`, and use cases `AbrirCaixa`, `FecharCaixa`, `RegistrarSangria`, `RegistrarSuprimento`, `ObterCaixaAberto`, `ObterResumoSessao`, `ListarMovimentacoes`. The `data` layer provides `CaixaRepositoryImpl` + `CaixaRemoteDataSource` calling the backend, with DTOs/mappers and HTTP-error → `Exception` → `Failure` mapping. Failure codes are `CashSessionAlreadyOpen`, `CashSessionNotFound`, `CashSessionAlreadyClosed`, `PendingSaleInSession`.

#### Scenario: Use case maps a backend error to a Failure

- **WHEN** a use case calls the repository and the backend returns one of the cash error codes
- **THEN** the repository returns `Left(Failure)` with the matching `Failure` subtype

#### Scenario: DTO ↔ entity mapping round-trips

- **WHEN** a session/movement DTO is mapped to a domain entity and back
- **THEN** the values (including monetary fields and status) are preserved

### Requirement: Mobile cash-session UI flows

The system SHALL provide MVVM/Cubit views: `CaixaStatusView` (checks the operator's open session), `AbrirCaixaView` (`valorAbertura ≥ 0`), `SessaoAtivaView` (summary + movements + sangria/suprimento/fechar actions), `FecharCaixaView` (`valorFechamento ≥ 0` showing expected/counted/divergence), and a sangria/suprimento sheet (`valor > 0` + required `observacao`). ViewModels MUST NOT import Flutter; views use `BlocBuilder` with an explicit bloc; feedback uses `AppToast`; closing the cash requires confirmation.

#### Scenario: Status view branches on open session

- **WHEN** `CaixaStatusView` loads and there is no open session
- **THEN** it routes to opening the cash; when a session is open it shows the active session

#### Scenario: Close view shows divergence before confirm

- **WHEN** the operator enters `valorFechamento` in `FecharCaixaView`
- **THEN** expected, counted, and divergence are shown and a confirmation is required before closing

#### Scenario: Movement sheet validation

- **WHEN** the sangria/suprimento sheet is submitted with `valor ≤ 0` or empty `observacao`
- **THEN** validation fails and no request is sent

### Requirement: Mobile composition and routing

The system SHALL register the cash-session repository, datasource, and use cases in `get_it`, and expose routes via GoRouter guarded for an authenticated operator. Cash error codes surface in the UI as the corresponding `Failure`, consistent with the backend invariants.

#### Scenario: Guarded route requires an authenticated operator

- **WHEN** an unauthenticated user navigates to a cash route
- **THEN** the GoRouter guard blocks access

#### Scenario: Failure reflected in UI state

- **WHEN** a use case returns `Left(Failure)`
- **THEN** the Cubit emits an error state and the view shows the mapped message via `AppToast`
