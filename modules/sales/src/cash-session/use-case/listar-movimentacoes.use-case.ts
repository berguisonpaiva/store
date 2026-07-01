import { PaginatedResultDTO, Result, UseCase } from '@repo/shared'
import { ListarMovimentacoesInputDTO, MovimentacaoCaixaDTO } from '../dto'
import { CaixaQuery } from '../provider'

/// Returns the movements of a session (`SUPRIMENTO`, `SANGRIA`, `VENDA`).
export class ListarMovimentacoes
  implements UseCase<ListarMovimentacoesInputDTO, PaginatedResultDTO<MovimentacaoCaixaDTO>>
{
  constructor(private readonly query: CaixaQuery) {}

  async execute(
    input: ListarMovimentacoesInputDTO,
  ): Promise<Result<PaginatedResultDTO<MovimentacaoCaixaDTO>>> {
    return this.query.listarMovimentacoes(input)
  }
}
