## MODIFIED Requirements

### Requirement: Routing with GoRouter

The system SHALL configure navigation using GoRouter declared in the `app/` layer, with the route table trimmed to the **Operador PDV surface**: login, caixa hub (initial authenticated route), abrir caixa, nova venda, pagamento, recibo, sangria/suprimento, fechar caixa, resumo da sessão, and consulta de produto. The inventory-write (entrada/saida/ajuste), product-admin, standalone inventory-read (saldo/history/low-stock), and cross-session caixa-history routes SHALL NOT be registered. The router SHALL gate the PDV routes behind an authenticated session and the caixa hub behind an open session where required.

#### Scenario: Router resolves the PDV surface

- **WHEN** the app launches authenticated
- **THEN** GoRouter renders the caixa hub as the initial authenticated route and the login/abrir/venda/pagamento/recibo/sangria/fechar/resumo/consulta routes resolve

#### Scenario: Removed routes are absent

- **WHEN** the mobile route table is inspected
- **THEN** no routes exist for stock entrada/saida/ajuste, product admin, standalone inventory read screens, or a cross-session caixa history browser
