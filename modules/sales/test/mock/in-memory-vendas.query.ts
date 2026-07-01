import { PaginatedResultDTO, Result } from '@repo/shared'
import {
  emptyPorFormaPagamento,
  ListarVendasInputDTO,
  ResumoVendasDTO,
  ResumoVendasInputDTO,
  toVendaDTO,
  Venda,
  VendaDTO,
  VendasFiltroDTO,
  VendasQuery,
} from '../../src/venda'
import { InMemoryVendasRepository } from './in-memory-vendas.repository'

export class InMemoryVendasQuery implements VendasQuery {
  constructor(private readonly repository: InMemoryVendasRepository) {}

  async buscarPorId(vendaId: string): Promise<Result<VendaDTO | null>> {
    const venda = this.repository.get(vendaId)
    return Result.ok(venda ? toVendaDTO(venda) : null)
  }

  async listar(input: ListarVendasInputDTO): Promise<Result<PaginatedResultDTO<VendaDTO>>> {
    const filtered = this.applyFilters(input)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())

    const start = (input.page - 1) * input.pageSize
    const data = filtered.slice(start, start + input.pageSize).map(toVendaDTO)

    return Result.ok({
      data,
      meta: {
        page: input.page,
        pageSize: input.pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / input.pageSize)),
      },
    })
  }

  async resumo(input: ResumoVendasInputDTO): Promise<Result<ResumoVendasDTO>> {
    const matched = this.applyFilters(input)

    const porFormaPagamento = emptyPorFormaPagamento()
    for (const venda of matched) {
      for (const pagamento of venda.pagamentos) {
        const entry = porFormaPagamento.find((item) => item.forma === pagamento.forma)
        if (entry) {
          entry.total += pagamento.valor
          entry.quantidade += 1
        }
      }
    }

    const resumo = matched.reduce<ResumoVendasDTO>(
      (acc, venda) => ({
        ...acc,
        quantidade: acc.quantidade + 1,
        subtotal: acc.subtotal + venda.subtotal,
        desconto: acc.desconto + venda.desconto,
        total: acc.total + venda.total,
      }),
      { quantidade: 0, subtotal: 0, desconto: 0, total: 0, porFormaPagamento },
    )

    return Result.ok(resumo)
  }

  private applyFilters(filtro: VendasFiltroDTO): Venda[] {
    return [...this.repository.vendas.values()]
      .filter((venda) => !filtro.startDate || venda.createdAt >= filtro.startDate)
      .filter((venda) => !filtro.endDate || venda.createdAt <= filtro.endDate)
      .filter((venda) => !filtro.usuarioId || venda.usuarioId === filtro.usuarioId)
      .filter((venda) => !filtro.sessaoCaixaId || venda.sessaoCaixaId === filtro.sessaoCaixaId)
      .filter((venda) => !filtro.status || venda.status === filtro.status)
  }
}
