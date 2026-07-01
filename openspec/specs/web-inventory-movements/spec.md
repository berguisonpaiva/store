# web-inventory-movements Specification

## Purpose
TBD - created by archiving change estoque-web. Update Purpose after archive.
## Requirements
### Requirement: Register stock entry (Entrada de Estoque)

The system SHALL provide a private route with a form (React Hook Form + Zod) to register a stock entry, selecting a `variacaoId` via SKU/nome search, a `quantidade > 0`, a `motivo` (COMPRA/DEVOLUCAO/AJUSTE), and an optional `observacao`, submitting via a Server Action.

#### Scenario: Valid entry

- **WHEN** the form is submitted with an existing variation, `quantidade > 0`, and a valid `motivo`
- **THEN** the Server Action calls the entrada command endpoint (`POST /api/inventory/entrada`) and on success shows a success toast and refreshes the saldo (RF-EST-01)

#### Scenario: Inline validation

- **WHEN** no variation is selected, `quantidade ≤ 0`, or `motivo` is empty
- **THEN** inline field errors are shown and no request is sent (RF-EST-01)

#### Scenario: Unknown variation surfaced

- **WHEN** the backend returns 404 `VARIACAO_NAO_ENCONTRADA`
- **THEN** the error is surfaced on the variação field and the user stays on the form

#### Scenario: Unauthenticated access blocked

- **WHEN** an unauthenticated user requests the entrada route
- **THEN** the proxy guard redirects to `/join`

### Requirement: Register manual exit (Saída Manual)

The system SHALL provide a private form to register a manual exit, selecting a `variacaoId` via SKU/nome search, a `quantidade > 0` and `≤ saldo`, a `motivo` (PERDA/AJUSTE), and an optional `observacao`, submitting via a Server Action.

#### Scenario: Valid exit

- **WHEN** the form is submitted with an existing variation, `0 < quantidade ≤ saldo`, and a valid `motivo`
- **THEN** the Server Action calls the saida command endpoint (`POST /api/inventory/saida`) and on success shows a success toast and refreshes the saldo (RF-EST-02)

#### Scenario: Insufficient stock surfaced

- **WHEN** the backend returns 409 `ESTOQUE_INSUFICIENTE`
- **THEN** a field-level error is shown on the quantidade input (or a toast if not locatable) and the user stays on the form (RF-EST-05)

#### Scenario: Inline validation

- **WHEN** `quantidade ≤ 0` or `motivo` is empty
- **THEN** inline field errors are shown and no request is sent

### Requirement: Adjust balance (Ajuste de Saldo)

The system SHALL provide a private form to set an absolute balance for inventory correction, selecting a `variacaoId` via SKU/nome search, a `novoSaldo ≥ 0`, and a required `observacao` (justificativa), submitting via a Server Action.

#### Scenario: Valid adjustment

- **WHEN** the form is submitted with an existing variation, `novoSaldo ≥ 0`, and a non-empty `observacao`
- **THEN** the Server Action calls the ajuste command endpoint (`POST /api/inventory/ajuste`) and on success shows a success toast and refreshes the saldo (RF-EST-04)

#### Scenario: Required justification

- **WHEN** `observacao` is empty or `novoSaldo < 0`
- **THEN** inline field errors are shown and no request is sent (RF-EST-04)

### Requirement: Stock operation mutations data layer

The system SHALL implement the three stock operations as Server Actions calling the backend with `apiFetch` (Bearer from the session), mapping backend error codes to user feedback and revalidating affected reads on success.

#### Scenario: Error code mapping

- **WHEN** the backend returns 409 `ESTOQUE_INSUFICIENTE`, 404 `VARIACAO_NAO_ENCONTRADA`, or 400 `QUANTIDADE_INVALIDA`
- **THEN** the Server Action maps each to a field-level error or `sonner` toast and keeps the user on the form

#### Scenario: Authenticated mutation

- **WHEN** a stock operation Server Action runs
- **THEN** the request carries the session Bearer token and a 401 is treated as an auth failure

