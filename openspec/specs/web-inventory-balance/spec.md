# web-inventory-balance Specification

## Purpose
TBD - created by archiving change estoque-web. Update Purpose after archive.
## Requirements
### Requirement: Consult balance by variation

The system SHALL provide a private screen to consult, for a variation selected by SKU/nome search, its `saldoAtual` and `saldoDisponivel` (`saldoAtual − quantidadeReservada`), read server-side from the backend.

#### Scenario: Show balance

- **WHEN** the user selects a variation
- **THEN** the screen reads from the consultar-saldo query endpoint and shows `saldoAtual` and `saldoDisponivel` (RF-EST-06)

#### Scenario: Unknown variation

- **WHEN** the backend returns 404 `VARIACAO_NAO_ENCONTRADA`
- **THEN** an empty/not-found state is shown for that variation

#### Scenario: Unauthenticated access blocked

- **WHEN** an unauthenticated user requests the saldo route
- **THEN** the proxy guard redirects to `/join`

### Requirement: List movement history

The system SHALL provide a private screen listing stock movements (`listar-movimentacoes`) for a variation with a period filter, paginated via URL state (`nuqs`), read server-side.

#### Scenario: Filter and paginate via URL state

- **WHEN** the user selects a variation, sets a period, or changes the page
- **THEN** the list updates and the query (variação, período, page) is reflected in the URL (`nuqs`), fetching from the listar-movimentacoes query endpoint (RF-EST-07)

#### Scenario: Empty history

- **WHEN** the variation has no movements in the period
- **THEN** an empty state is shown

### Requirement: List low-stock alerts

The system SHALL provide a private screen listing variations below their minimum stock (`listar-abaixo-do-minimo`), read server-side, for replenishment.

#### Scenario: Show low-stock list

- **WHEN** the low-stock screen loads
- **THEN** it reads from the listar-abaixo-do-minimo query endpoint and lists variations below `estoqueMinimo` with their current balance (RF-EST-08)

#### Scenario: No low-stock items

- **WHEN** no variation is below its minimum
- **THEN** an empty state is shown

### Requirement: Inventory read data layer

The system SHALL implement the inventory reads with server-side `apiFetch`/`apiJson` (Bearer from the session), so balance, movements, and low-stock screens fetch authenticated and a 401 is treated as an auth failure.

#### Scenario: Authenticated reads

- **WHEN** any inventory read screen loads on the server
- **THEN** the request carries the session Bearer token and a 401 is treated as an auth failure

