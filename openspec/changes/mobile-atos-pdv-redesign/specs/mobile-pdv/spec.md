## ADDED Requirements

### Requirement: Caixa hub home screen

The system SHALL provide a caixa hub home screen (Atos layout) as the operator landing surface when a session is open: an ink session card showing the session number, opening time, turno total vendido, number of sales, and fundo de troco; a primary "Nova venda" call to action; and secondary shortcuts to caixa atual, vendas do caixa (current session), sangria/suprimento, and fechar caixa. When no session is open, the hub SHALL show the "sem caixa aberto" empty state with an "Abrir caixa" action.

#### Scenario: Hub with an open session

- **WHEN** the operator lands on the hub with an open session (from `GET /api/caixa/aberto`)
- **THEN** the session card, turno totals, "Nova venda" CTA, and the caixa/vendas/sangria/fechar shortcuts are shown

#### Scenario: Hub with no open session

- **WHEN** the operator lands on the hub with no open session
- **THEN** the empty "sem caixa aberto" state is shown with an "Abrir caixa" action and the sale shortcuts are hidden

### Requirement: Venda concluída recibo screen

The system SHALL, after a sale is finalized, present a recibo (venda concluída) screen showing a success confirmation, the sale number and date, the item lines, the total, the registered payments, and any troco, with actions to start a "Nova venda" or view the session resumo.

#### Scenario: Recibo after finalize

- **WHEN** a sale is finalized successfully
- **THEN** the recibo screen shows the sale number, items, total, payments, and troco (when the tendered amount exceeds the total), with "Nova venda" and "Ver resumo" actions

## MODIFIED Requirements

### Requirement: Open and manage the cash session (RN01)

The system SHALL let a mobile operator open a cash session with a `valorAbertura` through the Atos "Abrir caixa" screen (large currency input plus quick fundo-de-troco chips), blocked when one is already open (RN01, surfaced from the API `CAIXA_JA_ABERTO`), and record sangria/suprimento against the open session through the Atos sangria/suprimento screen (retirada/entrada toggle, value, observação). A successful open routes the operator to the caixa hub.

#### Scenario: Open when none is open

- **WHEN** an operator with no open session opens a caixa with `valorAbertura`
- **THEN** the session opens and the operator is routed to the caixa hub with the PDV available

#### Scenario: Open blocked when one exists

- **WHEN** an operator with an open session tries to open another
- **THEN** the app shows the "caixa já aberto" state and does not open a second session

#### Scenario: Record sangria/suprimento

- **WHEN** the operator submits a sangria or suprimento with a positive value on the open session
- **THEN** the movement is recorded and reflected in the session and its resumo

### Requirement: PDV sale flow with split payments (RN09/RN12)

The system SHALL provide the Atos PDV sale flow across two surfaces wired to the existing `vendas` routes: a **Nova venda** screen with a sticky search field plus a scan action, product search results, a cart of line items with quantity steppers, an inline desconto field, a sticky totals bar (subtotal, desconto, total), and a per-item stock-shortage indicator that disables finalize; and a **Pagamento** screen with a payment-method grid, an amount input with a "Restante" fill helper, add/remove split payments, and a pago/restante/troco summary. Finalize decrements stock (RN09). The app SHALL surface `INSUFFICIENT_STOCK`, `PAYMENT_MISMATCH`, and inactive-variation errors from the API without finalizing.

#### Scenario: Build and finalize a sale

- **WHEN** the operator adds items on Nova venda, optionally applies a discount, registers payments summing to the total on Pagamento, then finalizes
- **THEN** the sale is concluded, stock is decremented, and the recibo screen is shown

#### Scenario: Split payment across forms

- **WHEN** the operator registers payments in more than one `FormaPagamento` that together equal the total
- **THEN** finalize succeeds and the troco (if any) is shown

#### Scenario: Payment mismatch is surfaced

- **WHEN** the operator attempts to finalize with payments not equal to the total
- **THEN** the app shows a `PAYMENT_MISMATCH` error and the sale stays open

#### Scenario: Stock shortage guards finalize

- **WHEN** a cart line exceeds available stock (`INSUFFICIENT_STOCK`)
- **THEN** the shortage is shown on the line and in the totals bar, and finalize is disabled until quantities are adjusted

#### Scenario: Cancel reverses stock

- **WHEN** the operator cancels a sale whose session is still open
- **THEN** the sale is cancelled and stock is restored

### Requirement: Close the session showing the resumo (RN05)

The system SHALL, before confirming a close, display the automatic resumo (`totalVendas`, `qtdVendas`, `totalPorForma`, `sangrias`, `suprimentos`, `saldoEsperado`) and, on the Atos "Fechar caixa" screen, a divergência card that takes the counted cash (`valor contado`) and shows abertura, vendas em dinheiro, esperado em gaveta, and the resulting divergência (over/short, color-coded). The close SHALL be blocked when a sale is still pending (`VENDA_PENDENTE_NO_FECHAMENTO`).

#### Scenario: Resumo and divergência before confirming

- **WHEN** the operator initiates close on a session with no pending sale and enters the counted cash
- **THEN** the resumo and the divergência (esperado vs. contado) are displayed and, on confirm, the session closes

#### Scenario: Pending sale blocks close

- **WHEN** the operator initiates close while a sale is still `ABERTA`
- **THEN** the app shows the pending-sale block and does not close the session

### Requirement: Own history only (RN03)

The system SHALL, on the mobile operator surface, expose only the **current open session's** sales — through the hub's "vendas do caixa" and the resumo da sessão — and SHALL NOT provide a standalone cross-session or cross-operator history browser. The resumo da sessão SHALL show total vendido, número de vendas, totals by payment form, and the session's sales list.

#### Scenario: Current-session sales visible

- **WHEN** the operator opens "vendas do caixa" or the resumo da sessão
- **THEN** only the current open session's sales and totals are listed

#### Scenario: No cross-session browser

- **WHEN** the mobile navigation is inspected
- **THEN** there is no standalone sessions/sales history browser beyond the current session's resumo
