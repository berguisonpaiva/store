import {
  AjustarSaldo,
  EstoqueError,
  EstoqueSaldo,
  MotivoMovimentacaoEstoque,
  RegistrarEntrada,
  RegistrarSaida,
  TipoMovimentacao,
} from '../../src/movimentacao'
import { buildCatalogVariation } from '../mock/catalog-variation.builder'
import { InMemoryCatalogVariationReader } from '../mock/in-memory-catalog-variation.reader'
import { InMemoryEstoqueRepository } from '../mock/in-memory-estoque.repository'

describe('RegistrarEntrada', () => {
  test('creates the first balance projection from catalog minStock and records the ledger entry', async () => {
    const repository = new InMemoryEstoqueRepository()
    const catalogReader = new InMemoryCatalogVariationReader()
    const variation = buildCatalogVariation({ minStock: 3 })
    catalogReader.register(variation)
    const useCase = new RegistrarEntrada(repository, catalogReader)

    const result = await useCase.execute({
      variacaoId: variation.id,
      quantidade: 5,
      motivo: MotivoMovimentacaoEstoque.COMPRA,
      usuarioId: '99999999-9999-9999-9999-999999999999',
    })

    expect(result.isOk).toBe(true)
    expect(repository.movimentacoes).toHaveLength(1)
    expect(repository.movimentacoes[0]!.tipo).toBe(TipoMovimentacao.ENTRADA)
    expect(repository.movimentacoes[0]!.usuarioId).toBe('99999999-9999-9999-9999-999999999999')
    expect(repository.saldos.get(variation.id)!.saldoAtual).toBe(5)
    expect(repository.saldos.get(variation.id)!.estoqueMinimo).toBe(3)
  })

  test('returns VARIACAO_NAO_ENCONTRADA when the variation does not exist', async () => {
    const useCase = new RegistrarEntrada(
      new InMemoryEstoqueRepository(),
      new InMemoryCatalogVariationReader(),
    )

    const result = await useCase.execute({
      variacaoId: '22222222-2222-2222-2222-222222222222',
      quantidade: 2,
      motivo: MotivoMovimentacaoEstoque.COMPRA,
      usuarioId: '99999999-9999-9999-9999-999999999999',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(EstoqueError.VARIACAO_NAO_ENCONTRADA)
  })
})

describe('RegistrarSaida', () => {
  test('blocks a manual exit when the current balance is insufficient', async () => {
    const repository = new InMemoryEstoqueRepository()
    const catalogReader = new InMemoryCatalogVariationReader()
    const variation = buildCatalogVariation()
    catalogReader.register(variation)
    repository.seedSaldo(EstoqueSaldo.createFromCatalogVariation(variation, { saldoAtual: 1 }))
    const useCase = new RegistrarSaida(repository, catalogReader)

    const result = await useCase.execute({
      variacaoId: variation.id,
      quantidade: 2,
      motivo: MotivoMovimentacaoEstoque.PERDA,
      usuarioId: '99999999-9999-9999-9999-999999999999',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(EstoqueError.ESTOQUE_INSUFICIENTE)
    expect(repository.movimentacoes).toHaveLength(0)
  })
})

describe('AjustarSaldo', () => {
  test('sets an absolute target balance and records only the delta as AJUSTE', async () => {
    const repository = new InMemoryEstoqueRepository()
    const catalogReader = new InMemoryCatalogVariationReader()
    const variation = buildCatalogVariation({ minStock: 4 })
    catalogReader.register(variation)
    repository.seedSaldo(EstoqueSaldo.createFromCatalogVariation(variation, { saldoAtual: 2 }))
    const useCase = new AjustarSaldo(repository, catalogReader)

    const result = await useCase.execute({
      variacaoId: variation.id,
      novoSaldo: 7,
      observacao: 'inventario',
      usuarioId: '99999999-9999-9999-9999-999999999999',
    })

    expect(result.isOk).toBe(true)
    expect(repository.movimentacoes).toHaveLength(1)
    expect(repository.movimentacoes[0]!.motivo).toBe(MotivoMovimentacaoEstoque.AJUSTE)
    expect(repository.movimentacoes[0]!.quantidade).toBe(5)
    expect(repository.saldos.get(variation.id)!.saldoAtual).toBe(7)
  })

  test('does not persist partial changes when the transaction fails mid-write', async () => {
    const repository = new InMemoryEstoqueRepository()
    repository.rollbackAfterMovement = true
    const catalogReader = new InMemoryCatalogVariationReader()
    const variation = buildCatalogVariation()
    catalogReader.register(variation)
    repository.seedSaldo(EstoqueSaldo.createFromCatalogVariation(variation, { saldoAtual: 10 }))
    const useCase = new AjustarSaldo(repository, catalogReader)

    const result = await useCase.execute({
      variacaoId: variation.id,
      novoSaldo: 8,
      usuarioId: '99999999-9999-9999-9999-999999999999',
    })

    expect(result.isFailure).toBe(true)
    expect(repository.movimentacoes).toHaveLength(0)
    expect(repository.saldos.get(variation.id)!.saldoAtual).toBe(10)
  })
})
