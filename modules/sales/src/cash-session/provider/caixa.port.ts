import { Result, TransactionContext } from '@repo/shared'
import { SessaoCaixaDTO } from '../dto'

/// Cash port consumed by `vendas`. The only surface through which a cash sale is
/// recorded or reversed — there is no public manual `VENDA` command/route. Mirrors
/// the `inventory-sales-port` (`EstoquePort`) pattern (design decision D3/D4).
export interface CaixaPort {
  /// Returns the operator's `ABERTA` session, or `null` when none is open.
  caixaAbertoDoOperador(usuarioId: string): Promise<Result<SessaoCaixaDTO | null>>

  /// `true` when the given session is currently `ABERTA`. Used by `cancelar-venda`
  /// to block cancellation after the session has closed (RN08).
  isSessaoAberta(sessaoId: string): Promise<Result<boolean>>

  /// Records a `VENDA` movement of `valor` (cents) against the open session, inside
  /// the passed transactional context so it commits/rolls back with the sale (RN09).
  registrarVenda(sessaoId: string, valor: number, tx?: TransactionContext): Promise<Result<void>>

  /// Reverses a prior `VENDA` movement of `valor` (cents) against the session, inside
  /// the passed transactional context. Used on cancel and on finalize rollback.
  estornarVenda(sessaoId: string, valor: number, tx?: TransactionContext): Promise<Result<void>>
}
