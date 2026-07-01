import { Result, TransactionContext } from '@repo/shared'
import { CaixaGateway, SessaoCaixaResumo } from '../../src/venda'

export class FakeCaixaGateway implements CaixaGateway {
  /// Open session returned by `caixaAbertoDoOperador`. `null` simulates no session.
  sessaoAberta: SessaoCaixaResumo | null = null
  /// Whether `isSessaoAberta` reports the session as open.
  sessaoStillOpen = true

  failRegistrarVendaWith: string | null = null
  failEstornarVendaWith: string | null = null

  readonly vendasRegistradas: Array<{ sessaoCaixaId: string; valor: number }> = []
  readonly vendasEstornadas: Array<{ sessaoCaixaId: string; valor: number }> = []

  /// Last transaction context seen by `registrarVenda`/`estornarVenda`. Lets tests
  /// assert cash and stock ran on the SAME `tx` (RN09).
  lastTx: TransactionContext | undefined

  async caixaAbertoDoOperador(_usuarioId: string): Promise<Result<SessaoCaixaResumo | null>> {
    return Result.ok(this.sessaoAberta)
  }

  async isSessaoAberta(_sessaoCaixaId: string): Promise<Result<boolean>> {
    return Result.ok(this.sessaoStillOpen)
  }

  async registrarVenda(sessaoCaixaId: string, valor: number, tx?: TransactionContext): Promise<Result<void>> {
    this.lastTx = tx
    if (this.failRegistrarVendaWith) {
      return Result.fail(this.failRegistrarVendaWith)
    }
    this.vendasRegistradas.push({ sessaoCaixaId, valor })
    return Result.ok()
  }

  async estornarVenda(sessaoCaixaId: string, valor: number, tx?: TransactionContext): Promise<Result<void>> {
    this.lastTx = tx
    if (this.failEstornarVendaWith) {
      return Result.fail(this.failEstornarVendaWith)
    }
    this.vendasEstornadas.push({ sessaoCaixaId, valor })
    return Result.ok()
  }

  withOpenSession(sessaoCaixaId: string): this {
    this.sessaoAberta = { sessaoCaixaId, aberta: true }
    this.sessaoStillOpen = true
    return this
  }
}
