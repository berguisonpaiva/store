## ADDED Requirements

### Requirement: SessaoCaixa aggregate root

The system SHALL define a `SessaoCaixa` aggregate root in `modules/caixa` owning `operadorId`, `status` (`ABERTO` | `FECHADO`), `valorAbertura`, optional `valorFechamento`, `abertaEm`, and optional `fechadaEm`. A session starts `ABERTO` and transitions to `FECHADO` exactly once. `valorAbertura` MUST be `≥ 0`; `valorFechamento`, when present, MUST be `≥ 0`. All monetary values are non-negative decimals (no floats).

#### Scenario: Opening a session with a valid float

- **WHEN** a `SessaoCaixa` is built with `valorAbertura ≥ 0` for an operator
- **THEN** the session is created with `status = ABERTO`, `abertaEm` set, and no `valorFechamento`/`fechadaEm` (RF-CX-01)

#### Scenario: Negative opening amount is rejected

- **WHEN** a `SessaoCaixa` is built with `valorAbertura < 0`
- **THEN** creation returns a failed `Result` (invalid value)

#### Scenario: A FECHADO session cannot reopen

- **WHEN** a transition to `ABERTO` is attempted on a session already `FECHADO`
- **THEN** the operation returns a failed `Result` and the status is unchanged

### Requirement: MovimentacaoCaixa entity

The system SHALL define a `MovimentacaoCaixa` entity with `tipo` (`SUPRIMENTO` | `SANGRIA` | `VENDA`), `valor`, and an optional `observacao`. The `valor` of any movement MUST be strictly `> 0`. A `VENDA` movement MUST only be created through the cash port consumed by `vendas` — never via a manual command.

#### Scenario: Movement with positive value is created

- **WHEN** a `MovimentacaoCaixa` is built with a known `tipo` and `valor > 0`
- **THEN** the movement is created successfully

#### Scenario: Non-positive movement value is rejected

- **WHEN** a `MovimentacaoCaixa` is built with `valor ≤ 0`
- **THEN** creation returns a failed `Result` (invalid value)

### Requirement: Open a cash session

The system SHALL provide an `abrir-caixa` use case that opens a new `ABERTO` session for the operator with the given `valorAbertura`. At most one `ABERTO` session per operator is allowed at any time.

#### Scenario: Operator without an open session opens the cash

- **WHEN** `abrir-caixa` runs for an operator that has no `ABERTO` session, with `valorAbertura ≥ 0`
- **THEN** a new `SessaoCaixa` is persisted with `status = ABERTO` (RF-CX-01)

#### Scenario: Operator already has an open session

- **WHEN** `abrir-caixa` runs for an operator that already has an `ABERTO` session
- **THEN** the use case returns `Result.fail(CASH_SESSION_ALREADY_OPEN)` and no new session is created (RF-CX-02)

### Requirement: Register sangria

The system SHALL provide a `registrar-sangria` use case that records a `SANGRIA` movement (cash withdrawal) on an open session with `valor > 0` and an `observacao`.

#### Scenario: Sangria on an open session

- **WHEN** `registrar-sangria` runs on an `ABERTO` session with `valor > 0`
- **THEN** a `SANGRIA` movement is recorded against the session (RF-CX-03)

#### Scenario: Sangria on an unknown session

- **WHEN** `registrar-sangria` references a session that does not exist
- **THEN** the use case returns `Result.fail(CASH_SESSION_NOT_FOUND)`

#### Scenario: Sangria with non-positive value

- **WHEN** `registrar-sangria` runs with `valor ≤ 0`
- **THEN** the use case returns a failed `Result` (invalid value) and no movement is recorded

### Requirement: Register suprimento

The system SHALL provide a `registrar-suprimento` use case that records a `SUPRIMENTO` movement (cash reinforcement) on an open session with `valor > 0` and an `observacao`.

#### Scenario: Suprimento on an open session

- **WHEN** `registrar-suprimento` runs on an `ABERTO` session with `valor > 0`
- **THEN** a `SUPRIMENTO` movement is recorded against the session (RF-CX-04)

#### Scenario: Suprimento on an unknown session

- **WHEN** `registrar-suprimento` references a session that does not exist
- **THEN** the use case returns `Result.fail(CASH_SESSION_NOT_FOUND)`

#### Scenario: Suprimento with non-positive value

- **WHEN** `registrar-suprimento` runs with `valor ≤ 0`
- **THEN** the use case returns a failed `Result` (invalid value) and no movement is recorded

### Requirement: Expected-balance formula and session summary

The system SHALL provide a `resumo-sessao` read use case that computes the expected cash balance as `esperado = valorAbertura + Σ suprimentos + Σ vendas_em_dinheiro − Σ sangrias`. When the session is closed, it also reports `contado = valorFechamento` and `divergencia = valorFechamento − esperado`.

#### Scenario: Summary computes expected balance

- **WHEN** `resumo-sessao` runs for a session with a known float, suprimentos, cash sales, and sangrias
- **THEN** it returns `abertura`, `suprimentos`, `vendasDinheiro`, `sangrias`, and `esperado` computed by the formula (RF-CX-06)

#### Scenario: Divergence is reported on a closed session

- **WHEN** `resumo-sessao` runs for a `FECHADO` session
- **THEN** it additionally returns `contado = valorFechamento` and `divergencia = valorFechamento − esperado`

#### Scenario: Summary for an unknown session

- **WHEN** `resumo-sessao` references a session that does not exist
- **THEN** the use case returns `Result.fail(CASH_SESSION_NOT_FOUND)`

### Requirement: Close a cash session

The system SHALL provide a `fechar-caixa` use case that closes an `ABERTO` session with a counted `valorFechamento ≥ 0`, sets `status = FECHADO` and `fechadaEm`, and records the divergence versus the expected balance. Closing MUST be blocked while a sale is still `ABERTA` in the session.

#### Scenario: Close an open session

- **WHEN** `fechar-caixa` runs on an `ABERTO` session with `valorFechamento ≥ 0` and no pending sale
- **THEN** the session becomes `FECHADO` with `fechadaEm` set and `divergencia = valorFechamento − esperado` recorded (RF-CX-07)

#### Scenario: Close an unknown session

- **WHEN** `fechar-caixa` references a session that does not exist
- **THEN** the use case returns `Result.fail(CASH_SESSION_NOT_FOUND)`

#### Scenario: Close an already-closed session

- **WHEN** `fechar-caixa` runs on a session already `FECHADO`
- **THEN** the use case returns `Result.fail(CASH_SESSION_ALREADY_CLOSED)`

#### Scenario: Close blocked by a pending sale

- **WHEN** `fechar-caixa` runs on a session that still has a sale in `ABERTA` state
- **THEN** the use case returns `Result.fail(PENDING_SALE_IN_SESSION)` and the session stays `ABERTO` (RF-CX-08)

### Requirement: Query the operator's open session and movements

The system SHALL provide read use cases `caixa-aberto-do-operador` (returns the operator's current `ABERTO` session, if any) and `listar-movimentacoes` (returns the movements of a session), backed by a `CaixaQuery` projection.

#### Scenario: Operator has an open session

- **WHEN** `caixa-aberto-do-operador` runs for an operator with an `ABERTO` session
- **THEN** the open `SessaoCaixa` is returned (RF-CX-09)

#### Scenario: Operator has no open session

- **WHEN** `caixa-aberto-do-operador` runs for an operator with no `ABERTO` session
- **THEN** an empty result is returned (no session)

#### Scenario: List movements of a session

- **WHEN** `listar-movimentacoes` runs for an existing session
- **THEN** the session's movements (`SUPRIMENTO`, `SANGRIA`, `VENDA`) are returned

### Requirement: Domain contracts and error codes

The system SHALL expose, in `modules/caixa/provider/`, a `CaixaRepository` (session and movement persistence) and a `CaixaQuery` (read projections), and SHALL define the domain error codes in `errors/caixa-error.ts`: `CASH_SESSION_ALREADY_OPEN`, `CASH_SESSION_NOT_FOUND`, `CASH_SESSION_ALREADY_CLOSED`, and `PENDING_SALE_IN_SESSION`. Failures MUST be returned via `Result.fail(CODE)`, never thrown as ad-hoc errors.

#### Scenario: Contracts live in provider and are framework-free

- **WHEN** inspecting `modules/caixa`
- **THEN** `CaixaRepository` and `CaixaQuery` are interfaces in `provider/` with no framework/HTTP/ORM imports

#### Scenario: Failures use Result codes

- **WHEN** any use case fails an invariant
- **THEN** it returns `Result.fail(CODE)` with one of the four defined cash-session error codes
