## MODIFIED Requirements

### Requirement: Consult balance by variation

The system SHALL provide a private screen to consult, for a variation selected by SKU/nome search, its `saldoAtual` and `estoqueMinimo`, read server-side from the backend. No `saldoDisponivel`/reservation value is shown.

#### Scenario: Show balance

- **WHEN** the user selects a variation
- **THEN** the screen reads from the consultar-saldo query endpoint and shows `saldoAtual` and `estoqueMinimo` (RF-EST-06)

#### Scenario: Unknown variation

- **WHEN** the backend returns 404 `VARIACAO_NAO_ENCONTRADA`
- **THEN** an empty/not-found state is shown for that variation

#### Scenario: Unauthenticated access blocked

- **WHEN** an unauthenticated user requests the saldo route
- **THEN** the proxy guard redirects to `/join`

## ADDED Requirements

### Requirement: ADMIN-only inventory navigation and page guard

The system SHALL surface the inventory (Estoque) area in the private layout sidebar only for users with the ADMIN role, and each private inventory route SHALL perform a server-side permission check on load, redirecting non-ADMIN users to the main route. Hiding the sidebar entry is UX reinforcement; the backend `RolesGuard` remains authoritative (RN04).

#### Scenario: ADMIN sees the Estoque entry

- **WHEN** an authenticated ADMIN loads the private layout
- **THEN** the Estoque sidebar entry is visible and its routes are reachable

#### Scenario: Non-ADMIN does not see the entry

- **WHEN** an authenticated non-ADMIN user loads the private layout
- **THEN** the Estoque sidebar entry is not rendered

#### Scenario: Non-ADMIN is redirected from an inventory route

- **WHEN** a non-ADMIN user navigates directly to a private inventory route
- **THEN** the page's permission check redirects them to the main route
