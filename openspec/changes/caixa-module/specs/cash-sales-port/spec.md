## ADDED Requirements

### Requirement: Expose the cash port for the sales module

The system SHALL expose a cash port that `vendas` consumes to integrate with the cash session. `vendas` declares the port in its own `provider/`, and the backend binds it to a `caixa` adapter that delegates to the cash-session use cases. The port provides `caixaAbertoDoOperador(usuarioId)` and `registrarVenda(sessaoId, valor)`. Sale-driven cash movements MUST NOT be a public command/route of `caixa`; the only way `vendas` records a cash sale is through this port.

#### Scenario: Read the operator's open session through the port

- **WHEN** `vendas` calls `caixaAbertoDoOperador(usuarioId)`
- **THEN** the operator's `ABERTO` `SessaoCaixa` is returned, or empty when none is open

#### Scenario: Register a cash sale through the port

- **WHEN** `vendas` calls `registrarVenda(sessaoId, valor)` for an open session when a sale is finished
- **THEN** a `MovimentacaoCaixa` of `tipo = VENDA` with the given `valor` is recorded against the session in a single transaction (RF-CX-05)

#### Scenario: No public sale-movement command

- **WHEN** inspecting the public commands/routes of `caixa`
- **THEN** there is no public command/route that creates a `VENDA` movement — only `abrir-caixa`, `fechar-caixa`, `registrar-sangria`, and `registrar-suprimento` are public; cash sales go through the port

### Requirement: Cash sales count toward the expected balance

The system SHALL include `VENDA` movements recorded through the port in the `vendasDinheiro` term of the expected-balance formula, so a sale registered via `registrarVenda` raises the expected cash of the session.

#### Scenario: A registered sale raises expected cash

- **WHEN** `registrarVenda(sessaoId, valor)` records a cash `VENDA`
- **THEN** `resumo-sessao` for that session reflects the `valor` in `vendasDinheiro` and therefore in `esperado`

### Requirement: Pending sale blocks close via the invariant

The system SHALL keep the "cannot close with a pending sale" invariant consistent with the port: while `vendas` holds a sale in `ABERTA` state for the session, `fechar-caixa` returns `PENDING_SALE_IN_SESSION`.

#### Scenario: Close blocked while a port-tracked sale is open

- **WHEN** a sale tracked via the cash integration is still `ABERTA` and `fechar-caixa` is attempted
- **THEN** the close fails with `PENDING_SALE_IN_SESSION` until the sale is finished or cancelled (RF-CX-08)
