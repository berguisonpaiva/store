import { PaginatedResultDTO, Result } from '@repo/shared'
import {
  EstoqueQuery,
  ItemAbaixoDoMinimoDTO,
  ListarMovimentacoesInputDTO,
  MovimentacaoEstoqueDTO,
  SaldoEstoqueDTO,
} from '../../src/movimentacao'
import { InMemoryCatalogVariationReader } from './in-memory-catalog-variation.reader'
import { InMemoryEstoqueRepository } from './in-memory-estoque.repository'

export class InMemoryEstoqueQuery implements EstoqueQuery {
  constructor(
    private readonly repository: InMemoryEstoqueRepository,
    private readonly catalogReader: InMemoryCatalogVariationReader,
  ) {}

  async consultarSaldo(variacaoId: string): Promise<Result<SaldoEstoqueDTO | null>> {
    const saldo = this.repository.saldos.get(variacaoId)
    if (saldo) {
      return Result.ok({
        variacaoId,
        saldoAtual: saldo.saldoAtual,
        estoqueMinimo: saldo.estoqueMinimo,
      })
    }

    const variation = this.catalogReader.all().find((item) => item.id === variacaoId)
    if (!variation) {
      return Result.ok(null)
    }

    return Result.ok({
      variacaoId,
      saldoAtual: 0,
      estoqueMinimo: variation.minStock,
    })
  }

  async listarMovimentacoes(
    input: ListarMovimentacoesInputDTO,
  ): Promise<Result<PaginatedResultDTO<MovimentacaoEstoqueDTO>>> {
    const filtered = this.repository.movimentacoes
      .filter((item) => item.variacaoId === input.variacaoId)
      .filter((item) => !input.startDate || item.criadoEm >= input.startDate)
      .filter((item) => !input.endDate || item.criadoEm <= input.endDate)
      .sort((left, right) => right.criadoEm.getTime() - left.criadoEm.getTime())

    const start = (input.page - 1) * input.pageSize
    const data = filtered.slice(start, start + input.pageSize).map((item) => ({
      id: item.id,
      variacaoId: item.variacaoId,
      tipo: item.tipo,
      motivo: item.motivo,
      quantidade: item.quantidade,
      saldoResultante: item.saldoResultante,
      origemVendaId: item.origemVendaId,
      usuarioId: item.usuarioId,
      timestamp: item.criadoEm,
    }))

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

  async listarAbaixoDoMinimo(): Promise<Result<ItemAbaixoDoMinimoDTO[]>> {
    const items = this.catalogReader.all()
      .map((variation) => {
        const saldo = this.repository.saldos.get(variation.id)
        const saldoAtual = saldo?.saldoAtual ?? 0

        return {
          variacaoId: variation.id,
          saldoAtual,
          estoqueMinimo: saldo?.estoqueMinimo ?? variation.minStock,
        }
      })
      .filter((item) => item.saldoAtual < item.estoqueMinimo)

    return Result.ok(items)
  }
}
