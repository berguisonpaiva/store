import { PaginatedResultDTO, Result, UseCase } from '@repo/shared'
import { ListarMovimentacoesInputDTO, MovimentacaoEstoqueDTO } from '../dto'
import { EstoqueQuery } from '../provider'

export class ListarMovimentacoes
  implements UseCase<ListarMovimentacoesInputDTO, PaginatedResultDTO<MovimentacaoEstoqueDTO>>
{
  constructor(private readonly estoqueQuery: EstoqueQuery) {}

  async execute(input: ListarMovimentacoesInputDTO): Promise<Result<PaginatedResultDTO<MovimentacaoEstoqueDTO>>> {
    return this.estoqueQuery.listarMovimentacoes(input)
  }
}
