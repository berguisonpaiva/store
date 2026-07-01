import { Result } from '@repo/shared'
import { SessaoCaixaDTO } from '../dto'

/// Cash port consumed by `vendas`. The only surface through which a cash sale is
/// recorded — there is no public manual `VENDA` command/route. Mirrors the
/// `inventory-sales-port` (`EstoquePort`) pattern (design decision D4).
export interface CaixaPort {
  /// Returns the operator's `ABERTO` session, or `null` when none is open.
  caixaAbertoDoOperador(usuarioId: string): Promise<Result<SessaoCaixaDTO | null>>
  /// Records a `VENDA` movement of `valor` (cents) against the open session,
  /// transactionally (RF-CX-05).
  registrarVenda(sessaoId: string, valor: number): Promise<Result<void>>
}
