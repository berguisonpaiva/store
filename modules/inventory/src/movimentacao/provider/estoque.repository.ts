import { Result } from '@repo/shared'
import { EstoqueSaldo } from '../model/estoque-saldo.entity'
import { MovimentacaoEstoque } from '../model/movimentacao-estoque.entity'

export interface AplicarMovimentacaoOptions {
  /**
   * Quando `true`, `novoSaldo.saldoAtual` é o saldo absoluto desejado (correção de
   * inventário via `ajustar-saldo`) e deve ser persistido como tal sob o lock — não
   * recalculado como delta relativo. Quando ausente/`false`, a movimentação é um delta
   * relativo (entrada/saída) e o saldo é recalculado a partir do saldo travado atual.
   */
  saldoAbsoluto?: boolean
}

export interface EstoqueRepository {
  findSaldoByVariacaoId(variacaoId: string): Promise<Result<EstoqueSaldo | null>>
  aplicarMovimentacao(
    movimentacao: MovimentacaoEstoque,
    novoSaldo: EstoqueSaldo,
    options?: AplicarMovimentacaoOptions,
  ): Promise<Result<void>>
}
