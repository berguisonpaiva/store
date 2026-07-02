## ADDED Requirements

### Requirement: Cash-session history and detail screens

The system SHALL provide the mobile operator a history of their own cash sessions (route `/caixa/historico`) listing status, `valorAbertura`, and open/close timestamps, and a read-only session detail (route `/caixa/historico/:id`) showing the session data, the resumo (`valorAbertura`, `totalVendas`, `qtdVendas`, `totalPorForma`, `sangrias`, `suprimentos`, `saldoEsperado`), and the session's movements. Only the operator's own sessions are reachable (RN03).

#### Scenario: Operator browses own session history

- **WHEN** the operator opens the caixa history view
- **THEN** only their own sessions are listed with status and open/close data

#### Scenario: Closed-session detail is read-only

- **WHEN** the operator opens the detail of one of their `FECHADA` sessions
- **THEN** the resumo and movements are shown with no controls to alter the session

### Requirement: Preventive UI guards backed by the API

The system SHALL apply preventive guards in the mobile UI while keeping the backend authoritative: the open-caixa screen checks for an existing open session and blocks/redirects before submitting (still handling `CAIXA_JA_ABERTO` from the API), and the close-caixa flow surfaces `VENDA_PENDENTE_NO_FECHAMENTO` as an explicit state pointing the operator to the pending sale.

#### Scenario: Open screen redirects when a session is already open

- **WHEN** the operator navigates to the open-caixa screen while a session is already `ABERTA`
- **THEN** the app blocks the form and leads to the active session instead of submitting

#### Scenario: Pending sale is an explicit close-blocked state

- **WHEN** the close attempt fails with `VENDA_PENDENTE_NO_FECHAMENTO`
- **THEN** the app shows a dedicated blocked state with a path to resolve the open sale, and the session stays open
