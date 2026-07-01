import { Result, UseCase } from '@repo/shared'
import { ResumoVendasDTO, ResumoVendasInputDTO } from '../dto'
import { VendasQuery } from '../provider'

/// Aggregated totals of sales matching the period/operator/session/status filters
/// (RF-VND-12).
export class ResumoVendas implements UseCase<ResumoVendasInputDTO, ResumoVendasDTO> {
  constructor(private readonly query: VendasQuery) {}

  async execute(input: ResumoVendasInputDTO): Promise<Result<ResumoVendasDTO>> {
    return this.query.resumo(input)
  }
}
