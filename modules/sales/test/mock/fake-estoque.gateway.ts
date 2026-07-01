import { Result, TransactionContext } from '@repo/shared'
import { EstoqueGateway } from '../../src/venda'

export class FakeEstoqueGateway implements EstoqueGateway {
  /// Variations that lack balance: validarSaldoDisponivel fails for these.
  readonly semSaldo = new Set<string>()

  /// Available balance per variation. When a variation has a seeded balance,
  /// `validarSaldoDisponivel` fails once the requested quantity exceeds it.
  readonly saldoDisponivel = new Map<string, number>()

  failDarBaixaWith: string | null = null
  failEstornarWith: string | null = null

  readonly baixas: Array<{ variacaoId: string; quantidade: number; origemVendaId: string }> = []
  readonly estornos: Array<{ variacaoId: string; quantidade: number; origemVendaId: string }> = []

  /// Last transaction context seen by `darBaixa`/`estornar`. Lets tests assert
  /// stock and cash ran on the SAME `tx` (RN09).
  lastTx: TransactionContext | undefined

  async validarSaldoDisponivel(variacaoId: string, quantidade: number): Promise<Result<void>> {
    if (this.semSaldo.has(variacaoId)) {
      return Result.fail('INSUFFICIENT_STOCK')
    }
    const saldo = this.saldoDisponivel.get(variacaoId)
    if (saldo !== undefined && quantidade > saldo) {
      return Result.fail('INSUFFICIENT_STOCK')
    }
    return Result.ok()
  }

  async darBaixa(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    _usuarioId: string,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    this.lastTx = tx
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
    _usuarioId: string,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    this.lastTx = tx
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

  comSaldo(variacaoId: string, quantidade: number): this {
    this.saldoDisponivel.set(variacaoId, quantidade)
    return this
  }
}
