import {
  EstoqueError,
  EstoquePortService,
  EstoqueSaldo,
  MotivoMovimentacaoEstoque,
  TipoMovimentacao,
} from '../../src/movimentacao'
import { buildCatalogVariation } from '../mock/catalog-variation.builder'
import { InMemoryCatalogVariationReader } from '../mock/in-memory-catalog-variation.reader'
import { InMemoryEstoqueRepository } from '../mock/in-memory-estoque.repository'

describe('EstoquePortService', () => {
  test('darBaixa validates available balance and records a sale-driven exit', async () => {
    const repository = new InMemoryEstoqueRepository()
    const catalogReader = new InMemoryCatalogVariationReader()
    const variation = buildCatalogVariation()
    catalogReader.register(variation)
    repository.seedSaldo(
      EstoqueSaldo.createFromCatalogVariation(variation, {
        saldoAtual: 10,
        quantidadeReservada: 3,
      }),
    )
    const port = new EstoquePortService(repository, catalogReader)

    const result = await port.darBaixa(
      variation.id,
      2,
      'sale-1',
      '99999999-9999-9999-9999-999999999999',
      MotivoMovimentacaoEstoque.VENDA_PDV,
    )

    expect(result.isOk).toBe(true)
    expect(repository.movimentacoes).toHaveLength(1)
    expect(repository.movimentacoes[0]!.tipo).toBe(TipoMovimentacao.SAIDA)
    expect(repository.movimentacoes[0]!.motivo).toBe(MotivoMovimentacaoEstoque.VENDA_PDV)
    expect(repository.movimentacoes[0]!.origemVendaId).toBe('sale-1')
    expect(repository.movimentacoes[0]!.usuarioId).toBe('99999999-9999-9999-9999-999999999999')
    expect(repository.saldos.get(variation.id)!.saldoAtual).toBe(8)
  })

  test('darBaixa fails when available balance is insufficient', async () => {
    const repository = new InMemoryEstoqueRepository()
    const catalogReader = new InMemoryCatalogVariationReader()
    const variation = buildCatalogVariation()
    catalogReader.register(variation)
    repository.seedSaldo(
      EstoqueSaldo.createFromCatalogVariation(variation, {
        saldoAtual: 4,
        quantidadeReservada: 4,
      }),
    )
    const port = new EstoquePortService(repository, catalogReader)

    const result = await port.darBaixa(variation.id, 1, 'sale-2', '99999999-9999-9999-9999-999999999999')

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(EstoqueError.ESTOQUE_INSUFICIENTE)
    expect(repository.movimentacoes).toHaveLength(0)
  })

  test('estornar records a compensating entry linked to the same origemVendaId', async () => {
    const repository = new InMemoryEstoqueRepository()
    const catalogReader = new InMemoryCatalogVariationReader()
    const variation = buildCatalogVariation()
    catalogReader.register(variation)
    repository.seedSaldo(EstoqueSaldo.createFromCatalogVariation(variation, { saldoAtual: 5 }))
    const port = new EstoquePortService(repository, catalogReader)

    await port.darBaixa(variation.id, 2, 'sale-3', '99999999-9999-9999-9999-999999999999', MotivoMovimentacaoEstoque.VENDA_ONLINE)
    const result = await port.estornar(
      variation.id,
      2,
      'sale-3',
      '99999999-9999-9999-9999-999999999999',
      MotivoMovimentacaoEstoque.VENDA_ONLINE,
    )

    expect(result.isOk).toBe(true)
    expect(repository.movimentacoes).toHaveLength(2)
    expect(repository.movimentacoes[1]!.tipo).toBe(TipoMovimentacao.ENTRADA)
    expect(repository.movimentacoes[1]!.origemVendaId).toBe('sale-3')
    expect(repository.saldos.get(variation.id)!.saldoAtual).toBe(5)
  })
})
