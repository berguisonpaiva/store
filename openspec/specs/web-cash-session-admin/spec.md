# web-cash-session-admin Specification

## Purpose
TBD - created by archiving change sales-module. Update Purpose after archive.
## Requirements
### Requirement: ADMIN-only "Caixas" panel (RN04)

The system SHALL add a "Caixas" entry to the web sidebar visible only to ADMIN, with a page-level permission check that redirects non-ADMIN users away. Visibility hiding is reinforcement; the backend `RolesGuard` on `GET /caixa` remains authoritative.

#### Scenario: Admin sees the Caixas entry

- **WHEN** an ADMIN loads the app shell
- **THEN** the "Caixas" sidebar entry is shown and its route is reachable

#### Scenario: Non-admin is redirected

- **WHEN** a non-ADMIN navigates directly to the Caixas route
- **THEN** the page guard redirects them away and no session data is fetched

### Requirement: Session listing with filters

The system SHALL list all cash sessions across operators with filters for operator, period (`from`/`to`), and status (`ABERTA`/`FECHADA`), backed by `GET /caixa`. The list is read-only.

#### Scenario: Filtered listing

- **WHEN** an ADMIN filters by operator and a date range
- **THEN** only sessions matching operator + period are listed

#### Scenario: Status filter

- **WHEN** an ADMIN filters by status `ABERTA`
- **THEN** only currently-open sessions are listed

### Requirement: Session detail with resumo and linked sales (RN05)

The system SHALL show a session detail view with opening/closing data, sangrias/suprimentos, the automatic resumo (`totalVendas`, `qtdVendas`, `totalPorForma`, `sangrias`, `suprimentos`, `saldoEsperado`), and the sales linked to the session, all read-only.

#### Scenario: Detail shows the resumo

- **WHEN** an ADMIN opens a session detail
- **THEN** the resumo, movements, and linked sales are displayed with no edit controls

#### Scenario: Detail is read-only

- **WHEN** an ADMIN views a session (open or closed)
- **THEN** there are no controls to open/close/move the session or alter sales from the web

