import { PaginatedResultDTO, Result, UseCase } from '@repo/shared'
import { ListarVendasInputDTO, VendaDTO } from '../dto'
import { VendasQuery } from '../provider'

/// Lists sales filterable by period, operator, session, and status (RF-VND-12).
export class ListarVendas implements UseCase<ListarVendasInputDTO, PaginatedResultDTO<VendaDTO>> {
  constructor(private readonly query: VendasQuery) {}

  async execute(input: ListarVendasInputDTO): Promise<Result<PaginatedResultDTO<VendaDTO>>> {
    return this.query.listar(input)
  }
}
