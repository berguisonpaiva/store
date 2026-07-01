import { Result } from '@repo/shared'
import { RegistrarMovimentacaoInputDTO } from '../dto'
import { CaixaError } from '../errors'
import { MovimentacaoCaixa, TipoMovimentacaoCaixa } from '../model'
import { CaixaRepository } from '../provider'

/// Shared flow for the manual movement use cases (`SUPRIMENTO`/`SANGRIA`):
/// the session must exist, and the movement `valor` must be `> 0`.
export abstract class RegistrarMovimentacaoBase {
  protected constructor(protected readonly repository: CaixaRepository) {}

  protected async registrar(
    tipo: TipoMovimentacaoCaixa.SUPRIMENTO | TipoMovimentacaoCaixa.SANGRIA,
    input: RegistrarMovimentacaoInputDTO,
  ): Promise<Result<MovimentacaoCaixa>> {
    const sessao = await this.repository.findSessaoById(input.sessaoId)
    if (sessao.isFailure) {
      return sessao.withFail
    }
    if (!sessao.instance) {
      return Result.fail(CaixaError.CASH_SESSION_NOT_FOUND)
    }

    const movimentacao = MovimentacaoCaixa.criar(tipo, {
      sessaoId: sessao.instance.id,
      valor: input.valor,
      observacao: input.observacao,
    })
    if (movimentacao.isFailure) {
      return movimentacao.withFail
    }

    return this.repository.registrarMovimentacao(movimentacao.instance)
  }
}
