import { Result, UseCase } from '@repo/shared'
import { PapelCaixa, ResumoSessaoDTO, ResumoSessaoInputDTO } from '../dto'
import { CaixaError } from '../errors'
import { CaixaQuery, CaixaRepository } from '../provider'

/// Computes the session summary, including the expected-balance formula
/// `esperado = abertura + Σ suprimentos + Σ vendasDinheiro − Σ sangrias`
/// and, for a closed session, `contado`/`divergencia` (RF-CX-06).
///
/// Read-scope (RN03/RN04): a non-`ADMIN` actor may only read a session it owns;
/// otherwise the read fails with `ACESSO_NEGADO`. `ADMIN` bypasses the check.
export class ResumoSessao implements UseCase<ResumoSessaoInputDTO, ResumoSessaoDTO> {
  constructor(
    private readonly query: CaixaQuery,
    private readonly repository: CaixaRepository,
  ) {}

  async execute(input: ResumoSessaoInputDTO): Promise<Result<ResumoSessaoDTO>> {
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

    const resumo = await this.query.resumoSessao(input.sessaoId)
    if (resumo.isFailure) {
      return resumo.withFail
    }
    if (!resumo.instance) {
      return Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO)
    }

    return Result.ok(resumo.instance)
  }
}
