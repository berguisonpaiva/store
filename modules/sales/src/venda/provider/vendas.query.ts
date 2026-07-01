import { PaginatedResultDTO, Result } from '@repo/shared'
import { ListarVendasInputDTO, ResumoVendasDTO, ResumoVendasInputDTO, VendaDTO } from '../dto'

/// CQRS read side for sales. Returns projection DTOs, never entities.
export interface VendasQuery {
  buscarPorId(vendaId: string): Promise<Result<VendaDTO | null>>
  listar(input: ListarVendasInputDTO): Promise<Result<PaginatedResultDTO<VendaDTO>>>
  resumo(input: ResumoVendasInputDTO): Promise<Result<ResumoVendasDTO>>
}
