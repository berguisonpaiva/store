import { Result, UseCase } from '@repo/shared'
import { AdicionarItemInputDTO, toVendaDTO, VendaDTO } from '../dto'
import { VendasRepository } from '../provider'
import { VendaUseCaseBase } from './venda-use-case.base'

/// Adds an item to an `ABERTA` sale, capturing `precoUnitario` as a snapshot
/// (RF-VND-03). Rejects writes to a `CONCLUIDA` sale with `SALE_ALREADY_FINALIZED`.
export class AdicionarItem extends VendaUseCaseBase implements UseCase<AdicionarItemInputDTO, VendaDTO> {
  constructor(repository: VendasRepository) {
    super(repository)
  }

  async execute(input: AdicionarItemInputDTO): Promise<Result<VendaDTO>> {
    const venda = await this.loadVenda(input.vendaId)
    if (venda.isFailure) {
      return venda.withFail
    }

    const updated = await this.applyAndSave(
      venda.instance.adicionarItem({
        variacaoId: input.variacaoId,
        quantidade: input.quantidade,
        precoUnitario: input.precoUnitario,
      }),
    )
    if (updated.isFailure) {
      return updated.withFail
    }

    return Result.ok(toVendaDTO(updated.instance))
  }
}
