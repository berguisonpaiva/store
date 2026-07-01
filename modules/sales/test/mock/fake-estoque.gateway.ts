import { Result, TransactionContext } from '@repo/shared'
import { EstoqueGateway } from '../../src/venda'

export class FakeEstoqueGateway implements EstoqueGateway {
  /// Variations that lack balance: validarSaldoDisponivel fails for these.
  readonly semSaldo = new Set<string>()

  failDarBaixaWith: string | null = null
  failEstornarWith: string | null = null

  readonly baixas: Array<{ variacaoId: string; quantidade: number; origemVendaId: string }> = []
  readonly estornos: Array<{ variacaoId: string; quantidade: number; origemVendaId: string }> = []

  async validarSaldoDisponivel(variacaoId: string, _quantidade: number): Promise<Result<void>> {
    if (this.semSaldo.has(variacaoId)) {
      return Result.fail('INSUFFICIENT_STOCK')
    }
    return Result.ok()
  }

  async darBaixa(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    _tx?: TransactionContext,
  ): Promise<Result<void>> {
    if (this.failDarBaixaWith) {
      return Result.fail(this.failDarBaixaWith)
    }
    this.baixas.push({ variacaoId, quantidade, origemVendaId })
    return Result.ok()
  }

  async estornar(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    _tx?: TransactionContext,
  ): Promise<Result<void>> {
    if (this.failEstornarWith) {
      return Result.fail(this.failEstornarWith)
    }
    this.estornos.push({ variacaoId, quantidade, origemVendaId })
    return Result.ok()
  }

  semSaldoPara(variacaoId: string): this {
    this.semSaldo.add(variacaoId)
    return this
  }
}
