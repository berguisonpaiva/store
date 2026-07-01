import { VendaError } from '../../src/venda'
import { Dinheiro } from '../../src/venda/model/dinheiro.vo'

describe('Dinheiro', () => {
  test('accepts non-negative integer cents', () => {
    const result = Dinheiro.tryCreate(1000)
    expect(result.isOk).toBe(true)
    expect(result.instance.cents).toBe(1000)
  })

  test('accepts zero', () => {
    const result = Dinheiro.tryCreate(0)
    expect(result.isOk).toBe(true)
    expect(result.instance.cents).toBe(0)
  })

  test('rejects negative value', () => {
    const result = Dinheiro.tryCreate(-1)
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_PRICE)
  })

  test('rejects non-integer value', () => {
    const result = Dinheiro.tryCreate(10.5)
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_PRICE)
  })

  test('rejects NaN / non-finite', () => {
    expect(Dinheiro.tryCreate(Number.NaN).isFailure).toBe(true)
    expect(Dinheiro.tryCreate(Number.POSITIVE_INFINITY).isFailure).toBe(true)
  })

  test('uses provided error code', () => {
    const result = Dinheiro.tryCreate(-1, VendaError.INVALID_PAYMENT)
    expect(result.errors).toContain(VendaError.INVALID_PAYMENT)
  })

  test('zero factory returns a zero Dinheiro', () => {
    expect(Dinheiro.zero().cents).toBe(0)
  })

  test('adds two amounts', () => {
    expect(Dinheiro.create(1000).add(Dinheiro.create(500)).cents).toBe(1500)
  })

  test('subtracts two amounts', () => {
    expect(Dinheiro.create(1000).subtract(Dinheiro.create(400)).cents).toBe(600)
  })

  test('multiplies by an integer factor', () => {
    expect(Dinheiro.create(1000).multiply(3).cents).toBe(3000)
  })

  test('compares amounts', () => {
    expect(Dinheiro.create(1000).isGreaterThan(Dinheiro.create(500))).toBe(true)
    expect(Dinheiro.create(1000).equals(Dinheiro.create(1000))).toBe(true)
  })
})
