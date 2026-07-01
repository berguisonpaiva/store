import { Result } from '@repo/shared'
import { EstoquePort, MotivoMovimentacaoEstoque } from '../../src/movimentacao'

export class InMemoryEstoquePort implements EstoquePort {
  readonly baixas: Array<{
    variacaoId: string
    quantidade: number
    origemVendaId: string
    usuarioId: string
    motivo: MotivoMovimentacaoEstoque
  }> = []

  readonly estornos: Array<{
    variacaoId: string
    quantidade: number
    origemVendaId: string
    usuarioId: string
    motivo: MotivoMovimentacaoEstoque
  }> = []

  async darBaixa(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    motivo: MotivoMovimentacaoEstoque = MotivoMovimentacaoEstoque.VENDA_ONLINE,
  ): Promise<Result<void>> {
    this.baixas.push({
      variacaoId,
      quantidade,
      origemVendaId,
      usuarioId,
      motivo,
    })

    return Result.ok()
  }

  async estornar(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    motivo: MotivoMovimentacaoEstoque = MotivoMovimentacaoEstoque.VENDA_ONLINE,
  ): Promise<Result<void>> {
    this.estornos.push({
      variacaoId,
      quantidade,
      origemVendaId,
      usuarioId,
      motivo,
    })

    return Result.ok()
  }
}
