// Module: sales — PDV counter-sale + cash-session domain (business rules only).
// Aggregates:
//   - `venda`        (Venda root owning ItemVenda and Pagamento)
//   - `cash-session` (SessaoCaixa + MovimentacaoCaixa — the PDV cash drawer)
// Cash session was formerly the standalone `@repo/caixa` module; it now lives
// inside `sales` because cash and sales share the same PDV bounded context.

export * from './venda'
export * from './cash-session'
