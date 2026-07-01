## ADDED Requirements

### Requirement: One open cash session per operator (RN01)

The system SHALL allow an operator to have at most one `SessaoCaixa` with `status = ABERTA` at any time. `abrir-caixa` takes `{ usuarioId, valorAbertura }` and creates a session in `ABERTA` with an `ABERTURA` movement for `valorAbertura`; if the operator already has an open session it MUST fail with `CAIXA_JA_ABERTO`. The invariant is also enforced at the database by a partial unique index on `operadorId` where `status = 'ABERTA'`.

#### Scenario: Opening the first session succeeds

- **WHEN** `abrir-caixa` runs for an operator with no open session and `valorAbertura ≥ 0`
- **THEN** a `SessaoCaixa` is created with `status = ABERTA`, `abertaEm` set, and an `ABERTURA` movement for `valorAbertura`, returning `{ sessaoCaixaId }`

#### Scenario: Opening a second session is rejected

- **WHEN** `abrir-caixa` runs for an operator who already has a session in `ABERTA`
- **THEN** it returns a failed `Result` with `CAIXA_JA_ABERTO` and no session is created

#### Scenario: Negative opening value is rejected

- **WHEN** `abrir-caixa` runs with `valorAbertura < 0`
- **THEN** it returns a failed `Result` with `VALOR_INVALIDO`

### Requirement: Portuguese cash-session vocabulary

The system SHALL model the cash-session status as `StatusSessaoCaixa = { ABERTA, FECHADA }` and expose caixa failures as `CaixaError = { CAIXA_NAO_ENCONTRADO, CAIXA_JA_ABERTO, CAIXA_JA_FECHADO, NAO_E_DONO_DO_CAIXA, ACESSO_NEGADO, VENDA_PENDENTE_NO_FECHAMENTO, VALOR_INVALIDO }`. Movement types are `TipoMovimentacaoCaixa = { ABERTURA, VENDA, SANGRIA, SUPRIMENTO }`; each `MovimentacaoCaixa` is immutable and append-only.

#### Scenario: Status uses the Portuguese enum

- **WHEN** a session is opened or closed
- **THEN** its status is `ABERTA` or `FECHADA` (never `ABERTO`/`FECHADO`)

#### Scenario: Failures use the Portuguese codes

- **WHEN** any caixa command or query fails
- **THEN** the returned `Result` carries one of the `CaixaError` Portuguese codes

### Requirement: Only the owner operates the session (RN02)

The system SHALL permit `fechar-caixa`, `registrar-sangria`, and `registrar-suprimento` only for the operator who owns the session. A request by a different operator MUST fail with `NAO_E_DONO_DO_CAIXA`. The acting `usuarioId` is derived from the authenticated context, not from the request body.

#### Scenario: Owner closes the session

- **WHEN** the owning operator issues `fechar-caixa` on their open session
- **THEN** the operation proceeds

#### Scenario: Non-owner is blocked

- **WHEN** an operator issues `fechar-caixa`/`registrar-sangria`/`registrar-suprimento` on a session owned by another operator
- **THEN** it returns a failed `Result` with `NAO_E_DONO_DO_CAIXA` and no change is made

### Requirement: Sangria and suprimento movements

The system SHALL record `SANGRIA` (cash removal) and `SUPRIMENTO` (cash injection) movements against an open session with a positive value and an optional note. Both MUST fail with `CAIXA_JA_FECHADO` if the session is `FECHADA` and with `VALOR_INVALIDO` if the value is not positive.

#### Scenario: Suprimento increases expected cash

- **WHEN** `registrar-suprimento` runs on an open session with `valor > 0`
- **THEN** a `SUPRIMENTO` movement is appended and reflected in the session resumo

#### Scenario: Sangria decreases expected cash

- **WHEN** `registrar-sangria` runs on an open session with `valor > 0`
- **THEN** a `SANGRIA` movement is appended and reflected in the session resumo

#### Scenario: Movement on a closed session is rejected

- **WHEN** `registrar-sangria`/`registrar-suprimento` runs on a `FECHADA` session
- **THEN** it returns a failed `Result` with `CAIXA_JA_FECHADO`

### Requirement: Close produces an automatic resumo (RN05)

The system SHALL, on `fechar-caixa`, compute an automatic resumo of the session: `{ totalVendas, qtdVendas, totalPorForma, sangrias, suprimentos, saldoEsperado }` where `saldoEsperado = valorAbertura + suprimentos + vendasEmDinheiro − sangrias`. `fechar-caixa` takes `{ sessaoCaixaId, usuarioId }` (optionally a counted `valorFechamento`) and returns the resumo. It MUST fail with `CAIXA_NAO_ENCONTRADO` when the session does not exist and `CAIXA_JA_FECHADO` when already closed.

#### Scenario: Closing an open session returns the resumo

- **WHEN** the owner closes an open session
- **THEN** the session transitions to `FECHADA` with `fechadaEm` set and the resumo `{ totalVendas, qtdVendas, totalPorForma, sangrias, suprimentos, saldoEsperado }` is returned

#### Scenario: Closing an unknown session is rejected

- **WHEN** `fechar-caixa` targets a non-existent session
- **THEN** it returns a failed `Result` with `CAIXA_NAO_ENCONTRADO`

#### Scenario: Closing an already-closed session is rejected

- **WHEN** `fechar-caixa` targets a `FECHADA` session
- **THEN** it returns a failed `Result` with `CAIXA_JA_FECHADO`

### Requirement: Close is blocked while a sale is pending

The system SHALL block `fechar-caixa` when the session has any `Venda` in `ABERTA`, failing with `VENDA_PENDENTE_NO_FECHAMENTO`. Pendency is determined through a `PendingSalePredicate` port backed by the vendas aggregate, so the caixa domain does not read venda internals directly.

#### Scenario: Pending sale blocks close

- **WHEN** `fechar-caixa` runs on a session that has an `ABERTA` sale
- **THEN** it returns a failed `Result` with `VENDA_PENDENTE_NO_FECHAMENTO` and the session stays `ABERTA`

#### Scenario: No pending sale allows close

- **WHEN** `fechar-caixa` runs on a session whose sales are all `CONCLUIDA`/`CANCELADA`
- **THEN** the close proceeds and the resumo is returned

### Requirement: Closed session is immutable (RN06)

The system SHALL treat a `FECHADA` session as immutable: it cannot be reopened, and no further movement (`SANGRIA`, `SUPRIMENTO`, or sale-driven `VENDA`) can be appended to it. Attempts MUST fail with `CAIXA_JA_FECHADO`.

#### Scenario: Reopening is impossible

- **WHEN** any operation attempts to move a `FECHADA` session back to `ABERTA` or append a movement to it
- **THEN** the operation returns a failed `Result` with `CAIXA_JA_FECHADO`
