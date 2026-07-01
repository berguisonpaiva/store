import { Result, UseCase } from '@repo/shared'
import { RemoverItemInputDTO, toVendaDTO, VendaDTO } from '../dto'
import { VendasRepository } from '../provider'
import { VendaUseCaseBase } from './venda-use-case.base'

/// Removes an item from an `ABERTA` sale and recomputes totals (RF-VND-04).
export class RemoverItem extends VendaUseCaseBase implements UseCase<RemoverItemInputDTO, VendaDTO> {
  constructor(repository: VendasRepository) {
    super(repository)
  }

  async execute(input: RemoverItemInputDTO): Promise<Result<VendaDTO>> {
    const venda = await this.loadVenda(input.vendaId)
    if (venda.isFailure) {
      return venda.withFail
    }

    const updated = await this.applyAndSave(venda.instance.removerItem(input.itemId))
    if (updated.isFailure) {
      return updated.withFail
    }

    return Result.ok(toVendaDTO(updated.instance))
  }
}
