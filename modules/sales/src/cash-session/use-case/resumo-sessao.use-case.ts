import { Result, UseCase } from '@repo/shared'
import { ResumoSessaoDTO, ResumoSessaoInputDTO } from '../dto'
import { CaixaError } from '../errors'
import { CaixaQuery } from '../provider'

/// Computes the session summary, including the expected-balance formula
/// `esperado = abertura + Σ suprimentos + Σ vendasDinheiro − Σ sangrias`
/// and, for a closed session, `contado`/`divergencia` (RF-CX-06).
export class ResumoSessao implements UseCase<ResumoSessaoInputDTO, ResumoSessaoDTO> {
  constructor(private readonly query: CaixaQuery) {}

  async execute(input: ResumoSessaoInputDTO): Promise<Result<ResumoSessaoDTO>> {
    const resumo = await this.query.resumoSessao(input.sessaoId)
    if (resumo.isFailure) {
      return resumo.withFail
    }
    if (!resumo.instance) {
      return Result.fail(CaixaError.CASH_SESSION_NOT_FOUND)
    }

    return Result.ok(resumo.instance)
  }
}
