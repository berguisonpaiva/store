import { Result, UseCase } from '@repo/shared'
import { FecharCaixaInputDTO, FecharCaixaResultDTO } from '../dto'
import { CaixaError } from '../errors'
import { CaixaQuery, CaixaRepository, PendingSalePredicate } from '../provider'

/// Closes an `ABERTA` session with a counted `valorFechamento`, computing the
/// automatic resumo (RN05) and the divergence against the expected balance.
/// Only the owning operator may close (RN02). Blocked while a sale is still
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
      return Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO)
    }
    // RN02: only the session owner operates it.
    if (!sessao.instance.pertenceAoUsuario(input.usuarioId)) {
      return Result.fail(CaixaError.NAO_E_DONO_DO_CAIXA)
    }
    if (!sessao.instance.isAberta()) {
      return Result.fail(CaixaError.CAIXA_JA_FECHADO)
    }

    const pending = await this.pendingSale.hasPendingSale(sessao.instance.id)
    if (pending.isFailure) {
      return pending.withFail
    }
    if (pending.instance) {
      return Result.fail(CaixaError.VENDA_PENDENTE_NO_FECHAMENTO)
    }

    const resumo = await this.query.resumoSessao(sessao.instance.id)
    if (resumo.isFailure) {
      return resumo.withFail
    }
    if (!resumo.instance) {
      return Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO)
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
      resumo: {
        totalVendas: resumo.instance.totalVendas,
        qtdVendas: resumo.instance.qtdVendas,
        totalPorForma: resumo.instance.totalPorForma,
        sangrias: resumo.instance.sangrias,
        suprimentos: resumo.instance.suprimentos,
        saldoEsperado: esperado,
      },
      contado,
      divergencia: contado - esperado,
    })
  }
}
