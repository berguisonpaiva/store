import { Result, UseCase } from '@repo/shared'
import { BuscarVendaInputDTO, VendaDTO } from '../dto'
import { VendaError } from '../errors'
import { VendasQuery } from '../provider'

/// Finds a sale by id with its items and payments. Unknown id → `SALE_NOT_FOUND`
/// (RF-VND-12).
export class BuscarVenda implements UseCase<BuscarVendaInputDTO, VendaDTO> {
  constructor(private readonly query: VendasQuery) {}

  async execute(input: BuscarVendaInputDTO): Promise<Result<VendaDTO>> {
    const found = await this.query.buscarPorId(input.vendaId)
    if (found.isFailure) {
      return found.withFail
    }
    if (!found.instance) {
      return Result.fail(VendaError.SALE_NOT_FOUND)
    }
    return Result.ok(found.instance)
  }
}
