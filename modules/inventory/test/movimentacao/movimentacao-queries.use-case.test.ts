import {
  ConsultarSaldo,
  EstoqueError,
  EstoqueSaldo,
  ListarAbaixoDoMinimo,
  ListarMovimentacoes,
  MotivoMovimentacaoEstoque,
  MovimentacaoEstoque,
  TipoMovimentacao,
} from '../../src/movimentacao'
import { buildCatalogVariation } from '../mock/catalog-variation.builder'
import { InMemoryCatalogVariationReader } from '../mock/in-memory-catalog-variation.reader'
import { InMemoryEstoqueQuery } from '../mock/in-memory-estoque.query'
import { InMemoryEstoqueRepository } from '../mock/in-memory-estoque.repository'

describe('ConsultarSaldo', () => {
  test('returns current balance and minimum for an existing variation', async () => {
    const repository = new InMemoryEstoqueRepository()
    const catalogReader = new InMemoryCatalogVariationReader()
    const variation = buildCatalogVariation({ minStock: 2 })
    catalogReader.register(variation)
    repository.seedSaldo(
      EstoqueSaldo.createFromCatalogVariation(variation, {
        saldoAtual: 9,
      }),
    )
    const query = new InMemoryEstoqueQuery(repository, catalogReader)
    const useCase = new ConsultarSaldo(query, catalogReader)

    const result = await useCase.execute({ variacaoId: variation.id })

    expect(result.isOk).toBe(true)
    expect(result.instance.saldoAtual).toBe(9)
    expect(result.instance.estoqueMinimo).toBe(2)
  })

  test('returns VARIACAO_NAO_ENCONTRADA for an unknown variation', async () => {
    const useCase = new ConsultarSaldo(
      new InMemoryEstoqueQuery(new InMemoryEstoqueRepository(), new InMemoryCatalogVariationReader()),
      new InMemoryCatalogVariationReader(),
    )

    const result = await useCase.execute({
      variacaoId: '33333333-3333-3333-3333-333333333333',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(EstoqueError.VARIACAO_NAO_ENCONTRADA)
  })
})

describe('ListarMovimentacoes', () => {
  test('lists movements by period in paginated date order', async () => {
    const repository = new InMemoryEstoqueRepository()
    const catalogReader = new InMemoryCatalogVariationReader()
    const variation = buildCatalogVariation()
    catalogReader.register(variation)
    const query = new InMemoryEstoqueQuery(repository, catalogReader)
    const useCase = new ListarMovimentacoes(query)

    repository.movimentacoes.push(
      MovimentacaoEstoque.create({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        variacaoId: variation.id,
        tipo: TipoMovimentacao.ENTRADA,
        motivo: MotivoMovimentacaoEstoque.COMPRA,
        quantidade: 2,
        saldoAnterior: 0,
        usuarioId: '99999999-9999-9999-9999-999999999999',
        criadoEm: new Date('2026-06-25T10:00:00.000Z'),
      }),
    )
    repository.movimentacoes.push(
      MovimentacaoEstoque.create({
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        variacaoId: variation.id,
        tipo: TipoMovimentacao.SAIDA,
        motivo: MotivoMovimentacaoEstoque.PERDA,
        quantidade: 1,
        saldoAnterior: 2,
        usuarioId: '99999999-9999-9999-9999-999999999999',
        criadoEm: new Date('2026-06-26T10:00:00.000Z'),
      }),
    )

    const result = await useCase.execute({
      variacaoId: variation.id,
      page: 1,
      pageSize: 10,
      startDate: new Date('2026-06-24T00:00:00.000Z'),
      endDate: new Date('2026-06-27T00:00:00.000Z'),
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.data).toHaveLength(2)
    expect(result.instance.data[0]!.timestamp.toISOString()).toBe('2026-06-26T10:00:00.000Z')
    expect(result.instance.data[1]!.timestamp.toISOString()).toBe('2026-06-25T10:00:00.000Z')
  })
})

describe('ListarAbaixoDoMinimo', () => {
  test('returns only the variations whose balance is below minimum stock', async () => {
    const repository = new InMemoryEstoqueRepository()
    const catalogReader = new InMemoryCatalogVariationReader()
    const low = buildCatalogVariation({
      id: '44444444-4444-4444-4444-444444444444',
      minStock: 5,
    })
    const healthy = buildCatalogVariation({
      id: '55555555-5555-5555-5555-555555555555',
      minStock: 2,
      sku: 'SKU-EST-2',
    })
    catalogReader.register(low)
    catalogReader.register(healthy)
    repository.seedSaldo(EstoqueSaldo.createFromCatalogVariation(low, { saldoAtual: 3 }))
    repository.seedSaldo(EstoqueSaldo.createFromCatalogVariation(healthy, { saldoAtual: 2 }))
    const useCase = new ListarAbaixoDoMinimo(new InMemoryEstoqueQuery(repository, catalogReader))

    const result = await useCase.execute({})

    expect(result.isOk).toBe(true)
    expect(result.instance).toHaveLength(1)
    expect(result.instance[0]!.variacaoId).toBe(low.id)
  })
})
