import { Result, TransactionContext } from '@repo/shared'
import { CaixaRepository, MovimentacaoCaixa, SessaoCaixa } from '../../src/cash-session'

/// In-memory `CaixaRepository` for cash-session use-case tests. Tracks appended
/// movements and reversals so RN06/RN09 assertions can inspect side effects.
export class InMemoryCaixaRepository implements CaixaRepository {
  readonly sessoes = new Map<string, SessaoCaixa>()
  readonly movimentacoes: MovimentacaoCaixa[] = []
  readonly estornos: Array<{ sessaoId: string; valor: number }> = []

  failRegistrarMovimentacaoWith: string | null = null
  failEstornarVendaWith: string | null = null

  async findSessaoAbertaByOperador(operadorId: string): Promise<Result<SessaoCaixa | null>> {
    for (const sessao of this.sessoes.values()) {
      if (sessao.operadorId === operadorId && sessao.aberta) {
        return Result.ok(sessao)
      }
    }
    return Result.ok(null)
  }

  async findSessaoById(sessaoId: string): Promise<Result<SessaoCaixa | null>> {
    return Result.ok(this.sessoes.get(sessaoId) ?? null)
  }

  async abrirSessao(sessao: SessaoCaixa): Promise<Result<SessaoCaixa>> {
    this.sessoes.set(sessao.id, sessao)
    return Result.ok(sessao)
  }

  async fecharSessao(sessao: SessaoCaixa): Promise<Result<SessaoCaixa>> {
    this.sessoes.set(sessao.id, sessao)
    return Result.ok(sessao)
  }

  async registrarMovimentacao(
    movimentacao: MovimentacaoCaixa,
    _tx?: TransactionContext,
  ): Promise<Result<MovimentacaoCaixa>> {
    if (this.failRegistrarMovimentacaoWith) {
      return Result.fail(this.failRegistrarMovimentacaoWith)
    }
    this.movimentacoes.push(movimentacao)
    return Result.ok(movimentacao)
  }

  async estornarVenda(
    sessaoId: string,
    valor: number,
    _tx?: TransactionContext,
  ): Promise<Result<void>> {
    if (this.failEstornarVendaWith) {
      return Result.fail(this.failEstornarVendaWith)
    }
    this.estornos.push({ sessaoId, valor })
    return Result.ok()
  }

  seed(sessao: SessaoCaixa): void {
    this.sessoes.set(sessao.id, sessao)
  }
}
