# cash-session-api Specification

## Purpose
TBD - created by archiving change sales-module. Update Purpose after archive.
## Requirements
### Requirement: Cash-session command endpoints

The system SHALL expose CQRS command routes for the cash session, guarded by JWT and `@Papeis(ADMIN, OPERADOR)`, with money exchanged in reais at the HTTP boundary and converted to cents internally. The acting operator id is taken from the authenticated user (`@CurrentUser`), never from the body.

- `POST /caixa/abrir` — body `{ valorAbertura }` → opens the caller's session, returns the session.
- `POST /caixa/:id/fechar` — body `{ valorFechamento? }` → closes the caller's session, returns `{ resumo, esperado, contado?, divergencia? }`.
- `POST /caixa/:id/sangria` — body `{ valor, observacao? }` → records a SANGRIA.
- `POST /caixa/:id/suprimento` — body `{ valor, observacao? }` → records a SUPRIMENTO.

#### Scenario: Open returns the created session

- **WHEN** an authenticated operator `POST /caixa/abrir` with a valid `valorAbertura`
- **THEN** the response is 201/200 with the session in `ABERTA`

#### Scenario: Close returns the resumo

- **WHEN** the owner `POST /caixa/:id/fechar`
- **THEN** the response includes the automatic resumo and the session is `FECHADA`

#### Scenario: Sangria/suprimento append a movement

- **WHEN** the owner `POST /caixa/:id/sangria` or `/suprimento` with `valor > 0`
- **THEN** the movement is recorded and returned

### Requirement: Cash-session query endpoints with admin list-all (RN04)

The system SHALL expose CQRS query routes for the cash session: `GET /caixa/aberto` (the caller's open session or null), `GET /caixa/:id/resumo` (session resumo), `GET /caixa/:id/movimentacoes` (paginated movements), and `GET /caixa` restricted to `@Papeis(ADMIN)` returning all operators' sessions with filters `{ usuarioId?, status?, from?, to? }`. A non-ADMIN calling `GET /caixa` MUST receive 403.

#### Scenario: Admin lists all sessions

- **WHEN** an ADMIN calls `GET /caixa` with optional filters
- **THEN** it returns sessions across all operators matching the filters

#### Scenario: Operator cannot list all sessions

- **WHEN** an OPERADOR calls `GET /caixa`
- **THEN** the response is 403 Forbidden

#### Scenario: Caller reads own open session

- **WHEN** an operator calls `GET /caixa/aberto`
- **THEN** it returns their open session or null

### Requirement: Owner/scope enforcement on cash routes (RN02/RN03)

The system SHALL enforce that command routes act only on the caller's own session (domain `NAO_E_DONO_DO_CAIXA` surfaced as 403) and that a non-ADMIN reading a session/resumo/movements they do not own is denied (`ACESSO_NEGADO` → 403).

#### Scenario: Non-owner command is forbidden

- **WHEN** an operator closes or moves a session owned by someone else
- **THEN** the response is 403 (`NAO_E_DONO_DO_CAIXA`)

#### Scenario: Non-owner read is forbidden

- **WHEN** a non-ADMIN operator reads another operator's session resumo/movements
- **THEN** the response is 403 (`ACESSO_NEGADO`)

### Requirement: Cash-session error mapping

The system SHALL map `CaixaError` codes to HTTP via the shared error mapper: `CAIXA_JA_ABERTO`/`CAIXA_JA_FECHADO`/`VENDA_PENDENTE_NO_FECHAMENTO` → 409/422; `NAO_E_DONO_DO_CAIXA`/`ACESSO_NEGADO` → 403; `CAIXA_NAO_ENCONTRADO` → 404; `VALOR_INVALIDO` → 400/422.

#### Scenario: Conflict codes map to 409/422

- **WHEN** a command fails with `CAIXA_JA_ABERTO`, `CAIXA_JA_FECHADO`, or `VENDA_PENDENTE_NO_FECHAMENTO`
- **THEN** the HTTP response is 409 or 422 with the code in the error body

#### Scenario: Not-found maps to 404

- **WHEN** a route references a session that does not exist and the domain returns `CAIXA_NAO_ENCONTRADO`
- **THEN** the HTTP response is 404

