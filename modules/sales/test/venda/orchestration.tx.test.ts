import {
  CancelarVenda,
  FinalizarVenda,
  FormaPagamento,
  StatusVenda,
  VendaError,
} from '../../src/venda'
import { FakeCaixaGateway } from '../mock/fake-caixa.gateway'
import { FakeEstoqueGateway } from '../mock/fake-estoque.gateway'
import { FakeTransactionManager, TX_SENTINEL } from '../mock/fake-transaction-manager'
import { InMemoryVendasRepository } from '../mock/in-memory-vendas.repository'
import { buildVenda, SESSAO_ID, VARIACAO_A, VARIACAO_B } from '../mock/venda.builder'

// Two items: 2x1000 + 1x500 = 2500
const ITENS = [
  { variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 },
  { variacaoId: VARIACAO_B, quantidade: 1, precoUnitario: 500 },
]

function setup() {
  const repository = new InMemoryVendasRepository()
  const estoque = new FakeEstoqueGateway()
  const caixa = new FakeCaixaGateway().withOpenSession(SESSAO_ID)
  const txManager = new FakeTransactionManager()
  const finalizar = new FinalizarVenda(repository, estoque, caixa, txManager)
  const cancelar = new CancelarVenda(repository, estoque, caixa, txManager)
  return { repository, estoque, caixa, txManager, finalizar, cancelar }
}

describe('FinalizarVenda — single transaction (RN09)', () => {
  test('stock and cash run on the SAME tx context', async () => {
    const { repository, estoque, caixa, txManager, finalizar } = setup()
    const venda = buildVenda({ itens: ITENS })
    repository.seed(venda)

    const result = await finalizar.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2500 }],
    })

    expect(result.isOk).toBe(true)
    expect(txManager.runs).toBe(1)
    // Both gateways observed the exact same transaction context.
    expect(estoque.lastTx).toBe(TX_SENTINEL)
    expect(caixa.lastTx).toBe(TX_SENTINEL)
    expect(estoque.lastTx).toBe(caixa.lastTx)
  })

  test('cash failure rolls back stock; sale stays ABERTA (same tx used for estorno)', async () => {
    const { repository, estoque, caixa, finalizar } = setup()
    const venda = buildVenda({ itens: ITENS })
    repository.seed(venda)
    caixa.failRegistrarVendaWith = 'CASH_FAILURE'

    const result = await finalizar.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2500 }],
    })

    expect(result.isFailure).toBe(true)
    expect(estoque.baixas).toHaveLength(2)
    expect(estoque.estornos).toHaveLength(2)
    expect(caixa.vendasRegistradas).toHaveLength(0)
    expect(estoque.lastTx).toBe(TX_SENTINEL)
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.ABERTA)
  })

  test('stock failure aborts before cash; sale stays ABERTA', async () => {
    const { repository, estoque, caixa, finalizar } = setup()
    const venda = buildVenda({ itens: ITENS })
    repository.seed(venda)
    estoque.failDarBaixaWith = 'INSUFFICIENT_STOCK'

    const result = await finalizar.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2500 }],
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INSUFFICIENT_STOCK)
    expect(estoque.baixas).toHaveLength(0)
    expect(caixa.vendasRegistradas).toHaveLength(0)
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.ABERTA)
  })

  test('PAYMENT_MISMATCH aborts before any side effect and before opening a tx', async () => {
    const { repository, estoque, caixa, txManager, finalizar } = setup()
    const venda = buildVenda({ itens: ITENS })
    repository.seed(venda)

    const result = await finalizar.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2000 }],
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.PAYMENT_MISMATCH)
    expect(txManager.runs).toBe(0)
    expect(estoque.baixas).toHaveLength(0)
    expect(caixa.vendasRegistradas).toHaveLength(0)
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.ABERTA)
  })
})

describe('FinalizarVenda — write-block (RN11)', () => {
  test('a CONCLUIDA sale cannot be finalized again', async () => {
    const { repository, finalizar } = setup()
    const venda = buildVenda({ status: StatusVenda.CONCLUIDA, itens: ITENS })
    repository.seed(venda)

    const result = await finalizar.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2500 }],
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_ALREADY_FINALIZED)
  })
})

describe('CancelarVenda — single transaction + closed-session guard', () => {
  test('cancel of a CONCLUIDA sale reverses stock and cash on the SAME tx', async () => {
    const { repository, estoque, caixa, txManager, cancelar } = setup()
    const venda = buildVenda({ status: StatusVenda.CONCLUIDA, itens: ITENS })
    repository.seed(venda)

    const result = await cancelar.execute({ vendaId: venda.id })

    expect(result.isOk).toBe(true)
    expect(txManager.runs).toBe(1)
    expect(estoque.estornos).toHaveLength(2)
    expect(caixa.vendasEstornadas).toHaveLength(1)
    expect(estoque.lastTx).toBe(TX_SENTINEL)
    expect(caixa.lastTx).toBe(TX_SENTINEL)
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.CANCELADA)
  })

  test('cancel is blocked when the cash session is closed (CASH_SESSION_CLOSED)', async () => {
    const { repository, caixa, cancelar } = setup()
    const venda = buildVenda({ status: StatusVenda.CONCLUIDA, itens: ITENS })
    repository.seed(venda)
    caixa.sessaoStillOpen = false

    const result = await cancelar.execute({ vendaId: venda.id })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.CASH_SESSION_CLOSED)
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.CONCLUIDA)
  })
})
