import { VendaError } from '../../src/venda'
import { Desconto } from '../../src/venda/model/desconto.vo'
import { TipoDesconto } from '../../src/venda/model/tipo-desconto'

describe('Desconto', () => {
  test('absolute discount returns the value capped at subtotal', () => {
    const result = Desconto.tryCreate({ tipo: TipoDesconto.VALOR, valor: 500 })
    expect(result.isOk).toBe(true)
    expect(result.instance.amountFor(2000)).toBe(500)
  })

  test('percentage discount computes amount over the subtotal', () => {
    const result = Desconto.tryCreate({ tipo: TipoDesconto.PERCENTUAL, valor: 10 })
    expect(result.isOk).toBe(true)
    // 10% of 2000 cents = 200 cents
    expect(result.instance.amountFor(2000)).toBe(200)
  })

  test('percentage discount rounds to nearest cent', () => {
    const desconto = Desconto.create({ tipo: TipoDesconto.PERCENTUAL, valor: 10 })
    // 10% of 1999 = 199.9 -> 200
    expect(desconto.amountFor(1999)).toBe(200)
  })

  test('zero discount produces zero amount', () => {
    const desconto = Desconto.zero()
    expect(desconto.amountFor(2000)).toBe(0)
  })

  test('rejects negative absolute value', () => {
    const result = Desconto.tryCreate({ tipo: TipoDesconto.VALOR, valor: -1 })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_DISCOUNT)
  })

  test('rejects percentage above 100', () => {
    const result = Desconto.tryCreate({ tipo: TipoDesconto.PERCENTUAL, valor: 101 })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_DISCOUNT)
  })

  test('rejects negative percentage', () => {
    expect(Desconto.tryCreate({ tipo: TipoDesconto.PERCENTUAL, valor: -5 }).isFailure).toBe(true)
  })

  test('absolute discount amount never exceeds the subtotal', () => {
    const desconto = Desconto.create({ tipo: TipoDesconto.VALOR, valor: 5000 })
    expect(desconto.amountFor(2000)).toBe(2000)
  })

  test('exceedsSubtotal flags an absolute discount larger than subtotal', () => {
    const desconto = Desconto.create({ tipo: TipoDesconto.VALOR, valor: 5000 })
    expect(desconto.exceedsSubtotal(2000)).toBe(true)
    expect(desconto.exceedsSubtotal(6000)).toBe(false)
  })

  test('percentage discount can never exceed subtotal so it never flags', () => {
    const desconto = Desconto.create({ tipo: TipoDesconto.PERCENTUAL, valor: 100 })
    expect(desconto.exceedsSubtotal(2000)).toBe(false)
    expect(desconto.amountFor(2000)).toBe(2000)
  })
})
