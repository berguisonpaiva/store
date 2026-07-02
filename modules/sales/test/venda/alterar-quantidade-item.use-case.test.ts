import { AlterarQuantidadeItem, StatusVenda, VendaError } from '../../src/venda'
import { FakeEstoqueGateway } from '../mock/fake-estoque.gateway'
import { InMemoryVendasRepository } from '../mock/in-memory-vendas.repository'
import { buildVenda, USUARIO_ID, VARIACAO_A } from '../mock/venda.builder'

const OUTRO_USUARIO = '55555555-5555-5555-5555-555555555555'

function setup() {
  const repository = new InMemoryVendasRepository()
  const estoque = new FakeEstoqueGateway()
  return { repository, estoque, useCase: new AlterarQuantidadeItem(repository, estoque) }
}

describe('AlterarQuantidadeItem', () => {
  test('changes the quantity keeping the price snapshot and recomputes totals', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }] })
    repository.seed(venda)
    const itemId = venda.itens[0]!.id

    const result = await useCase.execute({
      vendaId: venda.id,
      itemId,
      quantidade: 3,
      usuarioId: USUARIO_ID,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.itens[0]!.quantidade).toBe(3)
    expect(result.instance.itens[0]!.precoUnitario).toBe(1000)
    expect(result.instance.subtotal).toBe(3000)
    expect(result.instance.total).toBe(3000)
    expect(repository.get(venda.id)!.total).toBe(3000)
  })

  test('revalidates stock for the NEW quantity (RN09) — INSUFFICIENT_STOCK keeps the line', async () => {
    const { repository, estoque, useCase } = setup()
    const venda = buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }] })
    repository.seed(venda)
    estoque.comSaldo(VARIACAO_A, 2)
    const itemId = venda.itens[0]!.id

    const result = await useCase.execute({
      vendaId: venda.id,
      itemId,
      quantidade: 5,
      usuarioId: USUARIO_ID,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INSUFFICIENT_STOCK)
    expect(repository.get(venda.id)!.itens[0]!.quantidade).toBe(1)
  })

  test('succeeds when the new quantity fits the available stock', async () => {
    const { repository, estoque, useCase } = setup()
    const venda = buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }] })
    repository.seed(venda)
    estoque.comSaldo(VARIACAO_A, 2)
    const itemId = venda.itens[0]!.id

    const result = await useCase.execute({
      vendaId: venda.id,
      itemId,
      quantidade: 2,
      usuarioId: USUARIO_ID,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.itens[0]!.quantidade).toBe(2)
  })

  test('SALE_NOT_FOUND for an unknown sale', async () => {
    const { useCase } = setup()

    const result = await useCase.execute({
      vendaId: '99999999-9999-9999-9999-999999999999',
      itemId: '88888888-8888-8888-8888-888888888888',
      quantidade: 1,
      usuarioId: USUARIO_ID,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_NOT_FOUND)
  })

  test('ACESSO_NEGADO when the actor does not own the sale', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda()
    repository.seed(venda)
    const itemId = venda.itens[0]!.id

    const result = await useCase.execute({
      vendaId: venda.id,
      itemId,
      quantidade: 2,
      usuarioId: OUTRO_USUARIO,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.ACESSO_NEGADO)
    expect(repository.get(venda.id)!.itens[0]!.quantidade).toBe(1)
  })

  test('ITEM_NOT_FOUND for an unknown line', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda()
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      itemId: '99999999-9999-9999-9999-999999999999',
      quantidade: 2,
      usuarioId: USUARIO_ID,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.ITEM_NOT_FOUND)
  })

  test('INVALID_QUANTITY for a non-positive quantity', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda()
    repository.seed(venda)
    const itemId = venda.itens[0]!.id

    const result = await useCase.execute({
      vendaId: venda.id,
      itemId,
      quantidade: 0,
      usuarioId: USUARIO_ID,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_QUANTITY)
  })

  test('SALE_ALREADY_FINALIZED on a CONCLUIDA sale (RN06)', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda({ status: StatusVenda.CONCLUIDA })
    repository.seed(venda)
    const itemId = venda.itens[0]!.id

    const result = await useCase.execute({
      vendaId: venda.id,
      itemId,
      quantidade: 2,
      usuarioId: USUARIO_ID,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_ALREADY_FINALIZED)
    expect(repository.get(venda.id)!.itens[0]!.quantidade).toBe(1)
  })

  test('SALE_NOT_OPEN on a CANCELADA sale', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda({ status: StatusVenda.CANCELADA })
    repository.seed(venda)
    const itemId = venda.itens[0]!.id

    const result = await useCase.execute({
      vendaId: venda.id,
      itemId,
      quantidade: 2,
      usuarioId: USUARIO_ID,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_NOT_OPEN)
  })
})
