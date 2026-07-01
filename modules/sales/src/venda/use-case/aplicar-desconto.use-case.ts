import { Result, UseCase } from '@repo/shared'
import { AplicarDescontoInputDTO, toVendaDTO, VendaDTO } from '../dto'
import { VendasRepository } from '../provider'
import { VendaUseCaseBase } from './venda-use-case.base'

/// Applies a discount (valor or percentual) to an `ABERTA` sale; the resulting
/// amount never exceeds the subtotal (RF-VND-05).
export class AplicarDesconto extends VendaUseCaseBase implements UseCase<AplicarDescontoInputDTO, VendaDTO> {
  constructor(repository: VendasRepository) {
    super(repository)
  }

  async execute(input: AplicarDescontoInputDTO): Promise<Result<VendaDTO>> {
    const venda = await this.loadVenda(input.vendaId)
    if (venda.isFailure) {
      return venda.withFail
    }

    const updated = await this.applyAndSave(
      venda.instance.aplicarDesconto({ tipo: input.tipo, valor: input.valor }),
    )
    if (updated.isFailure) {
      return updated.withFail
    }

    return Result.ok(toVendaDTO(updated.instance))
  }
}
