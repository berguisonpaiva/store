# mobile-pdv Specification

## Purpose
TBD - created by archiving change sales-module. Update Purpose after archive.
## Requirements
### Requirement: Open and manage the cash session (RN01)

The system SHALL let a mobile operator open a cash session with a `valorAbertura`, blocked when one is already open (RN01, surfaced from the API `CAIXA_JA_ABERTO`), and record sangria/suprimento against the open session.

#### Scenario: Open when none is open

- **WHEN** an operator with no open session opens a caixa with `valorAbertura`
- **THEN** the session opens and the PDV becomes available

#### Scenario: Open blocked when one exists

- **WHEN** an operator with an open session tries to open another
- **THEN** the app shows the "caixa já aberto" state and does not open a second session

#### Scenario: Record sangria/suprimento

- **WHEN** the operator submits a sangria or suprimento with a positive value on the open session
- **THEN** the movement is recorded and reflected in the session

### Requirement: PDV sale flow with split payments (RN09/RN12)

The system SHALL provide a PDV flow: look up a variation (via catalog), add items, apply a discount, see the computed total, register one or more payments (including split), and finalize — which decrements stock (RN09). The app SHALL surface `INSUFFICIENT_STOCK`, `PAYMENT_MISMATCH`, and inactive-variation errors from the API without finalizing.

#### Scenario: Build and finalize a sale

- **WHEN** the operator adds items, optionally applies a discount, and registers payments summing to the total, then finalizes
- **THEN** the sale is concluded and stock is decremented

#### Scenario: Split payment across forms

- **WHEN** the operator registers payments in more than one `FormaPagamento` that together equal the total
- **THEN** finalize succeeds

#### Scenario: Payment mismatch is surfaced

- **WHEN** the operator attempts to finalize with payments not equal to the total
- **THEN** the app shows a `PAYMENT_MISMATCH` error and the sale stays open

#### Scenario: Cancel reverses stock

- **WHEN** the operator cancels a sale whose session is still open
- **THEN** the sale is cancelled and stock is restored

### Requirement: Close the session showing the resumo (RN05)

The system SHALL, before confirming a close, display the automatic resumo (`totalVendas`, `qtdVendas`, `totalPorForma`, `sangrias`, `suprimentos`, `saldoEsperado`) and block the close when a sale is still pending (`VENDA_PENDENTE_NO_FECHAMENTO`).

#### Scenario: Resumo shown before confirming

- **WHEN** the operator initiates close on a session with no pending sale
- **THEN** the resumo is displayed and, on confirm, the session closes

#### Scenario: Pending sale blocks close

- **WHEN** the operator initiates close while a sale is still `ABERTA`
- **THEN** the app shows the pending-sale block and does not close the session

### Requirement: Own history only (RN03)

The system SHALL show the operator only their own sessions and sales history; cross-operator data is not accessible from mobile.

#### Scenario: History scoped to the operator

- **WHEN** the operator opens the history view
- **THEN** only their own sessions and sales are listed

