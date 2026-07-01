import { Result, UseCase } from '@repo/shared'
import { FecharCaixaInputDTO, FecharCaixaResultDTO } from '../dto'
import { CaixaError } from '../errors'
import { CaixaQuery, CaixaRepository, PendingSalePredicate } from '../provider'

/// Closes an `ABERTO` session with a counted `valorFechamento`, computing the
/// divergence against the expected balance. Blocked while a sale is still
/// `ABERTA` in the session (RF-CX-07/RF-CX-08).
export class FecharCaixa implements UseCase<FecharCaixaInputDTO, FecharCaixaResultDTO> {
  constructor(
    private readonly repository: CaixaRepository,
    private readonly query: CaixaQuery,
    private readonly pendingSale: PendingSalePredicate,
  ) {}

  async execute(input: FecharCaixaInputDTO): Promise<Result<FecharCaixaResultDTO>> {
    const sessao = await this.repository.findSessaoById(input.sessaoId)
    if (sessao.isFailure) {
      return sessao.withFail
    }
    if (!sessao.instance) {
      return Result.fail(CaixaError.CASH_SESSION_NOT_FOUND)
    }
    if (!sessao.instance.aberta) {
      return Result.fail(CaixaError.CASH_SESSION_ALREADY_CLOSED)
    }

    const pending = await this.pendingSale.hasPendingSale(sessao.instance.id)
    if (pending.isFailure) {
      return pending.withFail
    }
    if (pending.instance) {
      return Result.fail(CaixaError.PENDING_SALE_IN_SESSION)
    }

    const resumo = await this.query.resumoSessao(sessao.instance.id)
    if (resumo.isFailure) {
      return resumo.withFail
    }
    if (!resumo.instance) {
      return Result.fail(CaixaError.CASH_SESSION_NOT_FOUND)
    }

    const closed = sessao.instance.fechar(input.valorFechamento)
    if (closed.isFailure) {
      return closed.withFail
    }

    const persisted = await this.repository.fecharSessao(closed.instance)
    if (persisted.isFailure) {
      return persisted.withFail
    }

    const esperado = resumo.instance.esperado
    const contado = closed.instance.valorFechamento ?? 0

    return Result.ok({
      sessaoId: persisted.instance.id,
      esperado,
      contado,
      divergencia: contado - esperado,
    })
  }
}
