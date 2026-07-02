## MODIFIED Requirements

### Requirement: Cash-session query endpoints with admin list-all (RN04)

The system SHALL expose CQRS query routes for the cash session: `GET /caixa/aberto` (the caller's open session or null), `GET /caixa/minhas` (paginated list of the caller's own sessions, any role, filters `{ status?, from?, to? }`), `GET /caixa/:id` (the session detail, owner or ADMIN only), `GET /caixa/:id/resumo` (session resumo), `GET /caixa/:id/movimentacoes` (paginated movements), and `GET /caixa` restricted to `@Papeis(ADMIN)` returning all operators' sessions with filters `{ usuarioId?, status?, from?, to? }`. A non-ADMIN calling `GET /caixa` MUST receive 403; a non-ADMIN reading a session they do not own MUST receive 403 (`ACESSO_NEGADO`).

#### Scenario: Admin lists all sessions

- **WHEN** an ADMIN calls `GET /caixa` with optional filters
- **THEN** it returns sessions across all operators matching the filters

#### Scenario: Operator cannot list all sessions

- **WHEN** an OPERADOR calls `GET /caixa`
- **THEN** the response is 403 Forbidden

#### Scenario: Caller reads own open session

- **WHEN** an operator calls `GET /caixa/aberto`
- **THEN** it returns their open session or null

#### Scenario: Operator lists own sessions

- **WHEN** an operator calls `GET /caixa/minhas`
- **THEN** only their own sessions are returned, regardless of role

#### Scenario: Owner reads a session detail

- **WHEN** an operator calls `GET /caixa/:id` for a session they own (open or closed)
- **THEN** the response is the `SessaoCaixaOutput` with status, `valorAbertura`, `abertaEm`, and `fechadaEm` when closed

#### Scenario: Cross-operator session detail is forbidden

- **WHEN** a non-ADMIN operator calls `GET /caixa/:id` for a session owned by another operator
- **THEN** the response is 403 (`ACESSO_NEGADO`)
