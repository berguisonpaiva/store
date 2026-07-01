## ADDED Requirements

### Requirement: Cash status and conditional rendering

The system SHALL provide a web cash-session UI in `apps/frontend/src/modules/caixa` that, on load, checks `GET /caixa/aberto`. When the operator has no open session, only the "Abrir caixa" call-to-action is shown; when a session is open, the active-session panel is shown instead.

#### Scenario: Operator without an open session

- **WHEN** the cash screen loads and `GET /caixa/aberto` returns no session
- **THEN** the UI shows only the "Abrir caixa" action

#### Scenario: Operator with an open session

- **WHEN** the cash screen loads and `GET /caixa/aberto` returns an open session
- **THEN** the UI shows the active session panel (summary, movements, and actions)

### Requirement: Open, sangria, and suprimento forms

The system SHALL provide Zod + React Hook Form forms with monetary fields rendered via `react-number-format` `NumericFormat` through a `Controller`. The open form validates `valorAbertura ≥ 0`. The sangria/suprimento form validates `valor > 0` and a required `observacao`.

#### Scenario: Open form rejects a negative float

- **WHEN** the open form is submitted with `valorAbertura < 0`
- **THEN** Zod validation fails and the request is not sent

#### Scenario: Movement form requires value and observation

- **WHEN** the sangria/suprimento form is submitted with `valor ≤ 0` or an empty `observacao`
- **THEN** Zod validation fails and the request is not sent

### Requirement: Close form shows expected, counted, and divergence

The system SHALL provide a close form for `valorFechamento ≥ 0` that displays the expected balance, the counted value, and the live-computed divergence (`contado − esperado`) before the operator confirms.

#### Scenario: Divergence updates live before confirm

- **WHEN** the operator types a `valorFechamento` in the close form
- **THEN** the UI shows `esperado`, `contado`, and `divergencia` recomputed in real time before submission (RF-CX-07)

### Requirement: API error mapping in the web UI

The system SHALL map cash-session API error codes to UI behavior: `CASH_SESSION_ALREADY_OPEN` blocks "Abrir" and surfaces the active session; `PENDING_SALE_IN_SESSION` blocks closing with an "há venda aberta" warning. Actions are hidden or disabled according to the operator's permission.

#### Scenario: Already-open blocks the open action

- **WHEN** `POST /caixa/abrir` responds with `CASH_SESSION_ALREADY_OPEN`
- **THEN** the UI blocks "Abrir" and shows the active session

#### Scenario: Pending sale blocks the close action

- **WHEN** `POST /caixa/:id/fechar` responds with `PENDING_SALE_IN_SESSION`
- **THEN** the UI blocks closing and shows an "há venda aberta" warning
