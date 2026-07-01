import { FormaPagamento, VendaError } from '../../src/venda'
import { Pagamento } from '../../src/venda/model/pagamento.entity'

describe('Pagamento', () => {
  test('creates a payment with forma and valor', () => {
    const result = Pagamento.tryCreate({
      forma: FormaPagamento.DINHEIRO,
      valor: 1500,
    })
    expect(result.isOk).toBe(true)
    expect(result.instance.forma).toBe(FormaPagamento.DINHEIRO)
    expect(result.instance.valor).toBe(1500)
  })

  test('rejects a non-positive value', () => {
    const result = Pagamento.tryCreate({
      forma: FormaPagamento.PIX,
      valor: 0,
    })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_PAYMENT)
  })

  test('rejects an unknown forma', () => {
    const result = Pagamento.tryCreate({
      forma: 'BOLETO' as FormaPagamento,
      valor: 100,
    })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_PAYMENT)
  })
})
