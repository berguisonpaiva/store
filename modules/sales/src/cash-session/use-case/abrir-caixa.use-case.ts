import { Result, UseCase } from '@repo/shared'
import { AbrirCaixaInputDTO } from '../dto'
import { CaixaError } from '../errors'
import { MovimentacaoCaixa, SessaoCaixa } from '../model'
import { CaixaRepository } from '../provider'

/// Opens a new `ABERTA` session for the operator, recording the automatic
/// `ABERTURA` movement for `valorAbertura` in the same transaction (RN01).
/// At most one open session per operator at any time (RF-CX-01/RF-CX-02).
export class AbrirCaixa implements UseCase<AbrirCaixaInputDTO, SessaoCaixa> {
  constructor(private readonly repository: CaixaRepository) {}

  async execute(input: AbrirCaixaInputDTO): Promise<Result<SessaoCaixa>> {
    const existing = await this.repository.findSessaoAbertaByOperador(input.operadorId)
    if (existing.isFailure) {
      return existing.withFail
    }
    if (existing.instance) {
      return Result.fail(CaixaError.CAIXA_JA_ABERTO)
    }

    const sessao = SessaoCaixa.abrir({
      operadorId: input.operadorId,
      valorAbertura: input.valorAbertura,
    })
    if (sessao.isFailure) {
      return sessao.withFail
    }

    const movimentacaoAbertura = MovimentacaoCaixa.abertura({
      sessaoId: sessao.instance.id,
      valor: sessao.instance.valorAbertura,
      criadaEm: sessao.instance.abertaEm,
    })
    if (movimentacaoAbertura.isFailure) {
      return movimentacaoAbertura.withFail
    }

    return this.repository.abrirSessao(sessao.instance, movimentacaoAbertura.instance)
  }
}
