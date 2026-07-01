import { PaginatedResultDTO, Result, UseCase } from '@repo/shared'
import { ListarMovimentacoesInputDTO, MovimentacaoCaixaDTO, PapelCaixa } from '../dto'
import { CaixaError } from '../errors'
import { CaixaQuery, CaixaRepository } from '../provider'

/// Returns the movements of a session (`SUPRIMENTO`, `SANGRIA`, `VENDA`).
///
/// Read-scope (RN03/RN04): a non-`ADMIN` actor may only read a session it owns;
/// otherwise the read fails with `ACESSO_NEGADO`. `ADMIN` bypasses the check.
export class ListarMovimentacoes
  implements UseCase<ListarMovimentacoesInputDTO, PaginatedResultDTO<MovimentacaoCaixaDTO>>
{
  constructor(
    private readonly query: CaixaQuery,
    private readonly repository: CaixaRepository,
  ) {}

  async execute(
    input: ListarMovimentacoesInputDTO,
  ): Promise<Result<PaginatedResultDTO<MovimentacaoCaixaDTO>>> {
    const sessao = await this.repository.findSessaoById(input.sessaoId)
    if (sessao.isFailure) {
      return sessao.withFail
    }
    if (!sessao.instance) {
      return Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO)
    }
    if (input.ator.papel !== PapelCaixa.ADMIN && sessao.instance.operadorId !== input.ator.usuarioId) {
      return Result.fail(CaixaError.ACESSO_NEGADO)
    }

    return this.query.listarMovimentacoes(input)
  }
}
