import { Desconto, ItemVenda, Pagamento, FormaPagamento, TipoDesconto } from '../../src/venda'
import { VendaCalculatorService } from '../../src/venda/service/venda-calculator.service'

const VARIACAO = '33333333-3333-3333-3333-333333333333'

function itens() {
  return [
    ItemVenda.create({ variacaoId: VARIACAO, quantidade: 2, precoUnitario: 1000 }),
    ItemVenda.create({ variacaoId: VARIACAO, quantidade: 1, precoUnitario: 500 }),
  ]
}

describe('VendaCalculatorService', () => {
  test('subtotal sums line totals', () => {
    expect(VendaCalculatorService.subtotal(itens())).toBe(2500)
  })

  test('totals with absolute discount', () => {
    const totals = VendaCalculatorService.totals(itens(), Desconto.create({ tipo: TipoDesconto.VALOR, valor: 500 }))
    expect(totals).toEqual({ subtotal: 2500, desconto: 500, total: 2000 })
  })

  test('totals with percentage discount', () => {
    const totals = VendaCalculatorService.totals(
      itens(),
      Desconto.create({ tipo: TipoDesconto.PERCENTUAL, valor: 10 }),
    )
    expect(totals).toEqual({ subtotal: 2500, desconto: 250, total: 2250 })
  })

  test('discount is capped so total never goes negative', () => {
    const totals = VendaCalculatorService.totals(itens(), Desconto.create({ tipo: TipoDesconto.VALOR, valor: 99999 }))
    expect(totals.desconto).toBe(2500)
    expect(totals.total).toBe(0)
  })

  test('totalPagamentos sums payment values', () => {
    const pagamentos = [
      Pagamento.create({ forma: FormaPagamento.DINHEIRO, valor: 300 }),
      Pagamento.create({ forma: FormaPagamento.PIX, valor: 700 }),
    ]
    expect(VendaCalculatorService.totalPagamentos(pagamentos)).toBe(1000)
  })
})
