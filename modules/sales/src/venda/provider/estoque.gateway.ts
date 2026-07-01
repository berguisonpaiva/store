import { Result, TransactionContext } from '@repo/shared'

/// Port CONSUMED by `vendas` to orchestrate stock during finalize/cancel. Declared
/// here in the domain (design D2); the backend adapter binds it to the `estoque`
/// sales port (`EstoquePort.darBaixa/estornar`). The domain never imports `estoque`.
export interface EstoqueGateway {
  /// Validates that `variacaoId` has at least `quantidade` available balance.
  /// Returns `Result.fail(INSUFFICIENT_STOCK)` (or the adapter's stock error) when not.
  validarSaldoDisponivel(variacaoId: string, quantidade: number): Promise<Result<void>>

  /// Takes stock down: one `SAIDA` with motivo `VENDA_PDV`, carrying `origemVendaId`.
  /// Runs inside the passed transactional context so it commits/rolls back with the sale.
  darBaixa(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    tx?: TransactionContext,
  ): Promise<Result<void>>

  /// Reverses a prior take-down: one `ENTRADA` with motivo `DEVOLUCAO`, carrying
  /// `origemVendaId`. Used on cancel and on finalize rollback. `usuarioId` is the
  /// operator responsible for the sale (RF20 traceability).
  estornar(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    tx?: TransactionContext,
  ): Promise<Result<void>>
}
