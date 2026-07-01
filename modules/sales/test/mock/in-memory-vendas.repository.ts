import { Result, TransactionContext } from '@repo/shared'
import { Venda, VendasRepository } from '../../src/venda'

export class InMemoryVendasRepository implements VendasRepository {
  readonly vendas = new Map<string, Venda>()
  private sequence = 0

  failCreateWith: string | null = null
  failUpdateWith: string | null = null

  async create(venda: Venda, _tx?: TransactionContext): Promise<Result<void>> {
    if (this.failCreateWith) {
      return Result.fail(this.failCreateWith)
    }
    this.vendas.set(venda.id, venda)
    return Result.ok()
  }

  async update(venda: Venda, _tx?: TransactionContext): Promise<Result<void>> {
    if (this.failUpdateWith) {
      return Result.fail(this.failUpdateWith)
    }
    this.vendas.set(venda.id, venda)
    return Result.ok()
  }

  async findById(id: string): Promise<Result<Venda | null>> {
    return Result.ok(this.vendas.get(id) ?? null)
  }

  async proximoNumero(_tx?: TransactionContext): Promise<Result<number>> {
    this.sequence += 1
    return Result.ok(this.sequence)
  }

  seed(venda: Venda): void {
    this.vendas.set(venda.id, venda)
  }

  get(id: string): Venda | undefined {
    return this.vendas.get(id)
  }
}
