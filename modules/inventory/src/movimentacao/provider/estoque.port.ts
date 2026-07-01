import { Result } from '@repo/shared'
import { MotivoMovimentacaoEstoque } from '../model'

export interface EstoquePort {
  darBaixa(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    motivo?: MotivoMovimentacaoEstoque,
  ): Promise<Result<void>>

  estornar(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    motivo?: MotivoMovimentacaoEstoque,
  ): Promise<Result<void>>
}
