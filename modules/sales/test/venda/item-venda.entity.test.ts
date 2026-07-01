import { VendaError } from '../../src/venda'
import { ItemVenda } from '../../src/venda/model/item-venda.entity'

const VARIACAO_ID = '11111111-1111-1111-1111-111111111111'

describe('ItemVenda', () => {
  test('captures the price snapshot and computes the line total', () => {
    const result = ItemVenda.tryCreate({
      variacaoId: VARIACAO_ID,
      quantidade: 2,
      precoUnitario: 1000,
    })

    expect(result.isOk).toBe(true)
    const item = result.instance
    expect(item.precoUnitario).toBe(1000)
    expect(item.quantidade).toBe(2)
    expect(item.total).toBe(2000)
  })

  test('rejects a non-positive quantity', () => {
    const result = ItemVenda.tryCreate({
      variacaoId: VARIACAO_ID,
      quantidade: 0,
      precoUnitario: 1000,
    })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_QUANTITY)
  })

  test('rejects a negative price', () => {
    const result = ItemVenda.tryCreate({
      variacaoId: VARIACAO_ID,
      quantidade: 1,
      precoUnitario: -1,
    })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_PRICE)
  })

  test('rejects an invalid variation id', () => {
    const result = ItemVenda.tryCreate({
      variacaoId: 'not-a-uuid',
      quantidade: 1,
      precoUnitario: 1000,
    })
    expect(result.isFailure).toBe(true)
  })

  test('changing quantity recomputes the line total but keeps the price snapshot', () => {
    const item = ItemVenda.create({
      variacaoId: VARIACAO_ID,
      quantidade: 2,
      precoUnitario: 1000,
    })

    const changed = item.withQuantidade(3)
    expect(changed.isOk).toBe(true)
    expect(changed.instance.precoUnitario).toBe(1000)
    expect(changed.instance.total).toBe(3000)
  })

  test('changing quantity to a non-positive value fails', () => {
    const item = ItemVenda.create({
      variacaoId: VARIACAO_ID,
      quantidade: 2,
      precoUnitario: 1000,
    })
    expect(item.withQuantidade(0).isFailure).toBe(true)
  })
})
