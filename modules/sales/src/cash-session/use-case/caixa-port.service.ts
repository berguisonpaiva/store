import { Result, TransactionContext } from '@repo/shared'
import { SessaoCaixaDTO } from '../dto'
import { CaixaError } from '../errors'
import { MovimentacaoCaixa } from '../model'
import { CaixaPort, CaixaQuery, CaixaRepository } from '../provider'

/// Adapter exposing the cash port to `vendas` (design decision D3/D4). The only
/// surface that creates or reverses a `VENDA` movement — there is no public manual
/// command. All writes thread the caller's `tx` so cash joins the sale's
/// transaction (RN09).
export class CaixaPortService implements CaixaPort {
  constructor(
    private readonly repository: CaixaRepository,
    private readonly query: CaixaQuery,
  ) {}

  async caixaAbertoDoOperador(usuarioId: string): Promise<Result<SessaoCaixaDTO | null>> {
    return this.query.caixaAbertoDoOperador(usuarioId)
  }

  async isSessaoAberta(sessaoId: string): Promise<Result<boolean>> {
    const sessao = await this.repository.findSessaoById(sessaoId)
    if (sessao.isFailure) {
      return sessao.withFail
    }
    if (!sessao.instance) {
      return Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO)
    }
    return Result.ok(sessao.instance.aberta)
  }

  async registrarVenda(
    sessaoId: string,
    valor: number,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    const sessao = await this.repository.findSessaoById(sessaoId)
    if (sessao.isFailure) {
      return sessao.withFail
    }
    if (!sessao.instance) {
      return Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO)
    }
    // RN06: no movement can be appended to a closed session.
    if (!sessao.instance.aberta) {
      return Result.fail(CaixaError.CAIXA_JA_FECHADO)
    }

    const movimentacao = MovimentacaoCaixa.criarVenda({
      sessaoId: sessao.instance.id,
      valor,
    })
    if (movimentacao.isFailure) {
      return movimentacao.withFail
    }

    const persisted = await this.repository.registrarMovimentacao(movimentacao.instance, tx)
    if (persisted.isFailure) {
      return persisted.withFail
    }

    return Result.ok()
  }

  async estornarVenda(
    sessaoId: string,
    valor: number,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    const sessao = await this.repository.findSessaoById(sessaoId)
    if (sessao.isFailure) {
      return sessao.withFail
    }
    if (!sessao.instance) {
      return Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO)
    }
    // RN06: no movement can be appended to a closed session.
    if (!sessao.instance.aberta) {
      return Result.fail(CaixaError.CAIXA_JA_FECHADO)
    }

    return this.repository.estornarVenda(sessao.instance.id, valor, tx)
  }
}
