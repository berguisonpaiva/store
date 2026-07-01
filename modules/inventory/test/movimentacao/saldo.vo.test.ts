import { Saldo, SaldoResultante } from '../../src/movimentacao'

describe('Saldo', () => {
  test('accepts zero as a valid balance', () => {
    const result = Saldo.tryCreate(0)

    expect(result.isOk).toBe(true)
    expect(result.instance.value).toBe(0)
  })

  test('rejects negative balances', () => {
    expect(Saldo.tryCreate(-1).isFailure).toBe(true)
    expect(SaldoResultante.tryCreate(-1).isFailure).toBe(true)
  })
})
