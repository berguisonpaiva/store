import { VendaError } from '../../src/venda'
import { QuantidadeVendida } from '../../src/venda/model/quantidade-vendida.vo'

describe('QuantidadeVendida', () => {
  test('accepts a positive integer', () => {
    const result = QuantidadeVendida.tryCreate(2)
    expect(result.isOk).toBe(true)
    expect(result.instance.value).toBe(2)
  })

  test('rejects zero', () => {
    const result = QuantidadeVendida.tryCreate(0)
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_QUANTITY)
  })

  test('rejects negative quantity', () => {
    expect(QuantidadeVendida.tryCreate(-3).isFailure).toBe(true)
  })

  test('rejects non-integer quantity', () => {
    expect(QuantidadeVendida.tryCreate(1.5).isFailure).toBe(true)
  })
})
