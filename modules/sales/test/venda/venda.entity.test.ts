import { CanalVenda, FormaPagamento, StatusVenda, TipoDesconto, VendaError } from '../../src/venda'
import { Venda } from '../../src/venda/model/venda.entity'

const USUARIO_ID = '11111111-1111-1111-1111-111111111111'
const SESSAO_ID = '22222222-2222-2222-2222-222222222222'
const VARIACAO_A = '33333333-3333-3333-3333-333333333333'
const VARIACAO_B = '44444444-4444-4444-4444-444444444444'

function novaVenda(): Venda {
  return Venda.abrir({ usuarioId: USUARIO_ID, sessaoCaixaId: SESSAO_ID }).instance
}

describe('Venda — opening', () => {
  test('opens ABERTA on the PDV channel with zeroed totals', () => {
    const result = Venda.abrir({ usuarioId: USUARIO_ID, sessaoCaixaId: SESSAO_ID })
    expect(result.isOk).toBe(true)
    const venda = result.instance
    expect(venda.status).toBe(StatusVenda.ABERTA)
    expect(venda.canal).toBe(CanalVenda.PDV)
    expect(venda.usuarioId).toBe(USUARIO_ID)
    expect(venda.sessaoCaixaId).toBe(SESSAO_ID)
    expect(venda.subtotal).toBe(0)
    expect(venda.desconto).toBe(0)
    expect(venda.total).toBe(0)
    expect(venda.itens).toHaveLength(0)
    expect(venda.pagamentos).toHaveLength(0)
  })

  test('fails without a session', () => {
    const result = Venda.abrir({ usuarioId: USUARIO_ID, sessaoCaixaId: '' })
    expect(result.isFailure).toBe(true)
  })
})

describe('Venda — items and totals', () => {
  test('adding items recomputes subtotal and total', () => {
    let venda = novaVenda()
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }).instance
    venda = venda.adicionarItem({ variacaoId: VARIACAO_B, quantidade: 1, precoUnitario: 500 }).instance

    expect(venda.itens).toHaveLength(2)
    expect(venda.subtotal).toBe(2500)
    expect(venda.total).toBe(2500)
  })

  test('removing an item recomputes totals', () => {
    let venda = novaVenda()
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }).instance
    const itemId = venda.itens[0]!.id
    venda = venda.adicionarItem({ variacaoId: VARIACAO_B, quantidade: 1, precoUnitario: 500 }).instance

    const removed = venda.removerItem(itemId)
    expect(removed.isOk).toBe(true)
    expect(removed.instance.itens).toHaveLength(1)
    expect(removed.instance.subtotal).toBe(500)
  })

  test('removing an unknown item fails', () => {
    const venda = novaVenda()
    const removed = venda.removerItem('99999999-9999-9999-9999-999999999999')
    expect(removed.isFailure).toBe(true)
    expect(removed.errors).toContain(VendaError.ITEM_NOT_FOUND)
  })

  test('price snapshot is immutable to later catalog price changes', () => {
    let venda = novaVenda()
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }).instance
    // adding the same variation again at a different price does not rewrite the first line
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1200 }).instance
    expect(venda.itens[0]!.precoUnitario).toBe(1000)
  })
})

describe('Venda — discount', () => {
  test('absolute discount lowers the total', () => {
    let venda = novaVenda()
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }).instance
    const discounted = venda.aplicarDesconto({ tipo: TipoDesconto.VALOR, valor: 500 })
    expect(discounted.isOk).toBe(true)
    expect(discounted.instance.desconto).toBe(500)
    expect(discounted.instance.total).toBe(1500)
  })

  test('percentage discount lowers the total', () => {
    let venda = novaVenda()
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }).instance
    const discounted = venda.aplicarDesconto({ tipo: TipoDesconto.PERCENTUAL, valor: 10 })
    expect(discounted.isOk).toBe(true)
    expect(discounted.instance.desconto).toBe(200)
    expect(discounted.instance.total).toBe(1800)
  })

  test('discount greater than subtotal is rejected', () => {
    let venda = novaVenda()
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }).instance
    const discounted = venda.aplicarDesconto({ tipo: TipoDesconto.VALOR, valor: 5000 })
    expect(discounted.isFailure).toBe(true)
    expect(discounted.errors).toContain(VendaError.DISCOUNT_EXCEEDS_SUBTOTAL)
  })
})

describe('Venda — lifecycle', () => {
  test('cannot mutate a CONCLUIDA sale', () => {
    let venda = novaVenda()
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }).instance
    venda = venda.adicionarPagamento({ forma: FormaPagamento.DINHEIRO, valor: 1000 }).instance
    const concluded = venda.concluir().instance

    expect(concluded.status).toBe(StatusVenda.CONCLUIDA)
    expect(concluded.adicionarItem({ variacaoId: VARIACAO_B, quantidade: 1, precoUnitario: 100 }).errors).toContain(
      VendaError.SALE_ALREADY_FINALIZED,
    )
    expect(concluded.aplicarDesconto({ tipo: TipoDesconto.VALOR, valor: 1 }).errors).toContain(
      VendaError.SALE_ALREADY_FINALIZED,
    )
    expect(concluded.concluir().errors).toContain(VendaError.SALE_ALREADY_FINALIZED)
  })

  test('payments must equal the total to conclude', () => {
    let venda = novaVenda()
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }).instance
    venda = venda.adicionarPagamento({ forma: FormaPagamento.DINHEIRO, valor: 500 }).instance
    expect(venda.concluir().errors).toContain(VendaError.PAYMENT_MISMATCH)
  })

  test('concluding with no items fails', () => {
    const venda = novaVenda()
    expect(venda.concluir().errors).toContain(VendaError.SALE_HAS_NO_ITEMS)
  })

  test('cancel moves an ABERTA sale to CANCELADA', () => {
    let venda = novaVenda()
    venda = venda.adicionarItem({ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }).instance
    const cancelled = venda.cancelar()
    expect(cancelled.isOk).toBe(true)
    expect(cancelled.instance.status).toBe(StatusVenda.CANCELADA)
    expect(cancelled.instance.canceladaEm).not.toBeNull()
  })

  test('totalPagamentos sums the payment values', () => {
    let venda = novaVenda()
    venda = venda.adicionarPagamento({ forma: FormaPagamento.DINHEIRO, valor: 300 }).instance
    venda = venda.adicionarPagamento({ forma: FormaPagamento.PIX, valor: 700 }).instance
    expect(venda.totalPagamentos).toBe(1000)
  })
})
