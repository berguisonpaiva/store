import { Result } from '@repo/shared'
import { SessaoCaixaDTO } from '../dto'
import { CaixaError } from '../errors'
import { MovimentacaoCaixa } from '../model'
import { CaixaPort, CaixaQuery, CaixaRepository } from '../provider'

/// Adapter exposing the cash port to `vendas` (design decision D4). The only
/// surface that creates a `VENDA` movement — there is no public manual command.
export class CaixaPortService implements CaixaPort {
  constructor(
    private readonly repository: CaixaRepository,
    private readonly query: CaixaQuery,
  ) {}

  async caixaAbertoDoOperador(usuarioId: string): Promise<Result<SessaoCaixaDTO | null>> {
    return this.query.caixaAbertoDoOperador(usuarioId)
  }

  async registrarVenda(sessaoId: string, valor: number): Promise<Result<void>> {
    const sessao = await this.repository.findSessaoById(sessaoId)
    if (sessao.isFailure) {
      return sessao.withFail
    }
    if (!sessao.instance) {
      return Result.fail(CaixaError.CASH_SESSION_NOT_FOUND)
    }
    if (!sessao.instance.aberta) {
      return Result.fail(CaixaError.CASH_SESSION_ALREADY_CLOSED)
    }

    const movimentacao = MovimentacaoCaixa.criarVenda({
      sessaoId: sessao.instance.id,
      valor,
    })
    if (movimentacao.isFailure) {
      return movimentacao.withFail
    }

    const persisted = await this.repository.registrarMovimentacao(movimentacao.instance)
    if (persisted.isFailure) {
      return persisted.withFail
    }

    return Result.ok()
  }
}
