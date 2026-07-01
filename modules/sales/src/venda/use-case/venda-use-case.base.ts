import { Result } from '@repo/shared'
import { VendaError } from '../errors'
import { Venda } from '../model'
import { VendasRepository } from '../provider'

/// Shared machinery for write use cases that load a `Venda`, apply one domain
/// mutation, and persist it. Maps a missing sale to `SALE_NOT_FOUND`.
export abstract class VendaUseCaseBase {
  protected constructor(protected readonly repository: VendasRepository) {}

  protected async loadVenda(vendaId: string): Promise<Result<Venda>> {
    const found = await this.repository.findById(vendaId)
    if (found.isFailure) {
      return found.withFail
    }
    if (!found.instance) {
      return Result.fail(VendaError.SALE_NOT_FOUND)
    }
    return Result.ok(found.instance)
  }

  protected async applyAndSave(mutation: Result<Venda>): Promise<Result<Venda>> {
    if (mutation.isFailure) {
      return mutation.withFail
    }
    const saved = await this.repository.update(mutation.instance)
    if (saved.isFailure) {
      return saved.withFail
    }
    return Result.ok(mutation.instance)
  }
}
