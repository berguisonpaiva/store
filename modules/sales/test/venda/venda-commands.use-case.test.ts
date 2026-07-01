import {
  AdicionarItem,
  AplicarDesconto,
  RemoverItem,
  StatusVenda,
  TipoDesconto,
  VendaError,
} from '../../src/venda'
import { InMemoryVendasRepository } from '../mock/in-memory-vendas.repository'
import { buildVenda, VARIACAO_A, VARIACAO_B } from '../mock/venda.builder'

function setup() {
  const repository = new InMemoryVendasRepository()
  return { repository }
}

describe('AdicionarItem', () => {
  test('adds an item with a price snapshot and recomputes totals', async () => {
    const { repository } = setup()
    const venda = buildVenda({ itens: [] })
    repository.seed(venda)
    const useCase = new AdicionarItem(repository)

    const result = await useCase.execute({
      vendaId: venda.id,
      variacaoId: VARIACAO_A,
      quantidade: 2,
      precoUnitario: 1000,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.itens).toHaveLength(1)
    expect(result.instance.itens[0]!.precoUnitario).toBe(1000)
    expect(result.instance.total).toBe(2000)
    expect(repository.get(venda.id)!.subtotal).toBe(2000)
  })

  test('rejects a non-positive quantity', async () => {
    const { repository } = setup()
    const venda = buildVenda({ itens: [] })
    repository.seed(venda)
    const useCase = new AdicionarItem(repository)

    const result = await useCase.execute({
      vendaId: venda.id,
      variacaoId: VARIACAO_A,
      quantidade: 0,
      precoUnitario: 1000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_QUANTITY)
  })

  test('SALE_NOT_FOUND for an unknown sale', async () => {
    const { repository } = setup()
    const useCase = new AdicionarItem(repository)

    const result = await useCase.execute({
      vendaId: '99999999-9999-9999-9999-999999999999',
      variacaoId: VARIACAO_A,
      quantidade: 1,
      precoUnitario: 1000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_NOT_FOUND)
  })

  test('SALE_ALREADY_FINALIZED when the sale is CONCLUIDA', async () => {
    const { repository } = setup()
    const venda = buildVenda({
      status: StatusVenda.CONCLUIDA,
      itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }],
    })
    repository.seed(venda)
    const useCase = new AdicionarItem(repository)

    const result = await useCase.execute({
      vendaId: venda.id,
      variacaoId: VARIACAO_B,
      quantidade: 1,
      precoUnitario: 500,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_ALREADY_FINALIZED)
  })
})

describe('RemoverItem', () => {
  test('removes an item and recomputes totals', async () => {
    const { repository } = setup()
    const venda = buildVenda({
      itens: [
        { variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 },
        { variacaoId: VARIACAO_B, quantidade: 1, precoUnitario: 500 },
      ],
    })
    repository.seed(venda)
    const itemId = venda.itens[0]!.id
    const useCase = new RemoverItem(repository)

    const result = await useCase.execute({ vendaId: venda.id, itemId })

    expect(result.isOk).toBe(true)
    expect(result.instance.itens).toHaveLength(1)
    expect(result.instance.subtotal).toBe(500)
  })

  test('ITEM_NOT_FOUND for an unknown line', async () => {
    const { repository } = setup()
    const venda = buildVenda()
    repository.seed(venda)
    const useCase = new RemoverItem(repository)

    const result = await useCase.execute({
      vendaId: venda.id,
      itemId: '99999999-9999-9999-9999-999999999999',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.ITEM_NOT_FOUND)
  })

  test('SALE_ALREADY_FINALIZED on a CONCLUIDA sale', async () => {
    const { repository } = setup()
    const venda = buildVenda({ status: StatusVenda.CONCLUIDA })
    repository.seed(venda)
    const itemId = venda.itens[0]!.id
    const useCase = new RemoverItem(repository)

    const result = await useCase.execute({ vendaId: venda.id, itemId })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_ALREADY_FINALIZED)
  })
})

describe('AplicarDesconto', () => {
  test('applies an absolute discount', async () => {
    const { repository } = setup()
    const venda = buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }] })
    repository.seed(venda)
    const useCase = new AplicarDesconto(repository)

    const result = await useCase.execute({ vendaId: venda.id, tipo: TipoDesconto.VALOR, valor: 500 })

    expect(result.isOk).toBe(true)
    expect(result.instance.desconto).toBe(500)
    expect(result.instance.total).toBe(1500)
  })

  test('applies a percentage discount', async () => {
    const { repository } = setup()
    const venda = buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }] })
    repository.seed(venda)
    const useCase = new AplicarDesconto(repository)

    const result = await useCase.execute({ vendaId: venda.id, tipo: TipoDesconto.PERCENTUAL, valor: 10 })

    expect(result.isOk).toBe(true)
    expect(result.instance.desconto).toBe(200)
    expect(result.instance.total).toBe(1800)
  })

  test('DISCOUNT_EXCEEDS_SUBTOTAL when the discount is larger than the subtotal', async () => {
    const { repository } = setup()
    const venda = buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }] })
    repository.seed(venda)
    const useCase = new AplicarDesconto(repository)

    const result = await useCase.execute({ vendaId: venda.id, tipo: TipoDesconto.VALOR, valor: 5000 })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.DISCOUNT_EXCEEDS_SUBTOTAL)
  })

  test('SALE_ALREADY_FINALIZED on a CONCLUIDA sale', async () => {
    const { repository } = setup()
    const venda = buildVenda({ status: StatusVenda.CONCLUIDA })
    repository.seed(venda)
    const useCase = new AplicarDesconto(repository)

    const result = await useCase.execute({ vendaId: venda.id, tipo: TipoDesconto.VALOR, valor: 1 })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_ALREADY_FINALIZED)
  })
})
