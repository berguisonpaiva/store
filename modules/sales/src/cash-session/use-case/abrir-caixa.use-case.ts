import { Result, UseCase } from '@repo/shared'
import { AbrirCaixaInputDTO } from '../dto'
import { CaixaError } from '../errors'
import { SessaoCaixa } from '../model'
import { CaixaRepository } from '../provider'

/// Opens a new `ABERTO` session for the operator. At most one open session per
/// operator at any time (RF-CX-01/RF-CX-02).
export class AbrirCaixa implements UseCase<AbrirCaixaInputDTO, SessaoCaixa> {
  constructor(private readonly repository: CaixaRepository) {}

  async execute(input: AbrirCaixaInputDTO): Promise<Result<SessaoCaixa>> {
    const existing = await this.repository.findSessaoAbertaByOperador(input.operadorId)
    if (existing.isFailure) {
      return existing.withFail
    }
    if (existing.instance) {
      return Result.fail(CaixaError.CASH_SESSION_ALREADY_OPEN)
    }

    const sessao = SessaoCaixa.abrir({
      operadorId: input.operadorId,
      valorAbertura: input.valorAbertura,
    })
    if (sessao.isFailure) {
      return sessao.withFail
    }

    return this.repository.abrirSessao(sessao.instance)
  }
}
