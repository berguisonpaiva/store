import { Result } from '@repo/shared'
import {
  AplicarMovimentacaoOptions,
  EstoqueRepository,
  EstoqueSaldo,
  MovimentacaoEstoque,
} from '../../src/movimentacao'

export class InMemoryEstoqueRepository implements EstoqueRepository {
  readonly saldos = new Map<string, EstoqueSaldo>()
  readonly movimentacoes: MovimentacaoEstoque[] = []
  failApplyWith: string | null = null
  rollbackAfterMovement = false
  lastOptions: AplicarMovimentacaoOptions | undefined

  async findSaldoByVariacaoId(variacaoId: string): Promise<Result<EstoqueSaldo | null>> {
    return Result.ok(this.saldos.get(variacaoId) ?? null)
  }

  async aplicarMovimentacao(
    movimentacao: MovimentacaoEstoque,
    novoSaldo: EstoqueSaldo,
    options?: AplicarMovimentacaoOptions,
  ): Promise<Result<void>> {
    this.lastOptions = options

    if (this.failApplyWith) {
      return Result.fail(this.failApplyWith)
    }

    const previousSaldo = this.saldos.get(novoSaldo.variacaoId) ?? null
    this.movimentacoes.push(movimentacao)

    if (this.rollbackAfterMovement) {
      this.movimentacoes.pop()
      if (previousSaldo) {
        this.saldos.set(previousSaldo.variacaoId, previousSaldo)
      } else {
        this.saldos.delete(novoSaldo.variacaoId)
      }
      return Result.fail('TX_ROLLED_BACK')
    }

    this.saldos.set(novoSaldo.variacaoId, novoSaldo)
    return Result.ok()
  }

  seedSaldo(saldo: EstoqueSaldo): void {
    this.saldos.set(saldo.variacaoId, saldo)
  }
}
