import { Desconto } from '../model/desconto.vo'
import { ItemVenda } from '../model/item-venda.entity'
import { Pagamento } from '../model/pagamento.entity'

export interface VendaTotals {
  subtotal: number
  desconto: number
  total: number
}

/// Pure, stateless calculation of sale totals. Keeps the `Venda` entity free of
/// arithmetic. All values are integer cents. Rule: `total = Σ itens − desconto`
/// (RF-VND-06), with the discount amount capped at the subtotal (RF-VND-05).
export class VendaCalculatorService {
  static subtotal(itens: ItemVenda[]): number {
    return itens.reduce((acc, item) => acc + item.total, 0)
  }

  static totals(itens: ItemVenda[], desconto: Desconto): VendaTotals {
    const subtotal = VendaCalculatorService.subtotal(itens)
    const descontoAmount = desconto.amountFor(subtotal)
    const total = Math.max(0, subtotal - descontoAmount)

    return { subtotal, desconto: descontoAmount, total }
  }

  static totalPagamentos(pagamentos: Pagamento[]): number {
    return pagamentos.reduce((acc, pagamento) => acc + pagamento.valor, 0)
  }
}
