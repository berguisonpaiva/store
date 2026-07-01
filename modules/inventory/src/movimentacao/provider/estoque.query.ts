import { PaginatedResultDTO, Result } from '@repo/shared'
import { ItemAbaixoDoMinimoDTO, ListarMovimentacoesInputDTO, MovimentacaoEstoqueDTO, SaldoEstoqueDTO } from '../dto'

export interface EstoqueQuery {
  consultarSaldo(variacaoId: string): Promise<Result<SaldoEstoqueDTO | null>>
  listarMovimentacoes(
    input: ListarMovimentacoesInputDTO,
  ): Promise<Result<PaginatedResultDTO<MovimentacaoEstoqueDTO>>>
  listarAbaixoDoMinimo(): Promise<Result<ItemAbaixoDoMinimoDTO[]>>
}
