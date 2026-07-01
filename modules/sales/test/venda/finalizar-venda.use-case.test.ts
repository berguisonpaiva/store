import { FinalizarVenda, FormaPagamento, StatusVenda, VendaError } from '../../src/venda'
import { FakeCaixaGateway } from '../mock/fake-caixa.gateway'
import { FakeEstoqueGateway } from '../mock/fake-estoque.gateway'
import { InMemoryVendasRepository } from '../mock/in-memory-vendas.repository'
import { buildVenda, SESSAO_ID, VARIACAO_A, VARIACAO_B } from '../mock/venda.builder'

function setup() {
  const repository = new InMemoryVendasRepository()
  const estoque = new FakeEstoqueGateway()
  const caixa = new FakeCaixaGateway().withOpenSession(SESSAO_ID)
  const useCase = new FinalizarVenda(repository, estoque, caixa)
  return { repository, estoque, caixa, useCase }
}

// Two items: 2x1000 + 1x500 = 2500
const ITENS = [
  { variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 },
  { variacaoId: VARIACAO_B, quantidade: 1, precoUnitario: 500 },
]

describe('FinalizarVenda — happy path (steps 1→5)', () => {
  test('validates stock, takes it down per item, records cash, and concludes', async () => {
    const { repository, estoque, caixa, useCase } = setup()
    const venda = buildVenda({ itens: ITENS })
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2500 }],
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.status).toBe(StatusVenda.CONCLUIDA)

    // Step 2: one take-down per item, carrying origemVendaId = venda.id.
    expect(estoque.baixas).toHaveLength(2)
    expect(estoque.baixas.map((b) => b.variacaoId).sort()).toEqual([VARIACAO_A, VARIACAO_B].sort())
    expect(estoque.baixas.every((b) => b.origemVendaId === venda.id)).toBe(true)

    // Step 4: a single VENDA cash movement equal to total.
    expect(caixa.vendasRegistradas).toEqual([{ sessaoCaixaId: SESSAO_ID, valor: 2500 }])

    // Persisted aggregate is CONCLUIDA.
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.CONCLUIDA)
  })
})

describe('FinalizarVenda — error paths', () => {
  test('INSUFFICIENT_STOCK aborts everything and keeps the sale ABERTA', async () => {
    const { repository, estoque, caixa, useCase } = setup()
    const venda = buildVenda({ itens: ITENS })
    repository.seed(venda)
    estoque.semSaldoPara(VARIACAO_B)

    const result = await useCase.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2500 }],
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INSUFFICIENT_STOCK)
    expect(estoque.baixas).toHaveLength(0)
    expect(caixa.vendasRegistradas).toHaveLength(0)
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.ABERTA)
  })

  test('PAYMENT_MISMATCH when payments do not equal the total', async () => {
    const { repository, estoque, caixa, useCase } = setup()
    const venda = buildVenda({ itens: ITENS })
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2000 }],
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.PAYMENT_MISMATCH)
    expect(estoque.baixas).toHaveLength(0)
    expect(caixa.vendasRegistradas).toHaveLength(0)
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.ABERTA)
  })

  test('SALE_NOT_FOUND for an unknown sale', async () => {
    const { useCase } = setup()
    const result = await useCase.execute({
      vendaId: '99999999-9999-9999-9999-999999999999',
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 100 }],
    })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_NOT_FOUND)
  })

  test('SALE_ALREADY_FINALIZED when the sale is already CONCLUIDA', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda({ status: StatusVenda.CONCLUIDA, itens: ITENS })
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2500 }],
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_ALREADY_FINALIZED)
  })
})

describe('FinalizarVenda — rollback on a later step failure', () => {
  test('cash-step failure reverts stock take-down and keeps the sale ABERTA', async () => {
    const { repository, estoque, caixa, useCase } = setup()
    const venda = buildVenda({ itens: ITENS })
    repository.seed(venda)
    caixa.failRegistrarVendaWith = 'CASH_FAILURE'

    const result = await useCase.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2500 }],
    })

    expect(result.isFailure).toBe(true)
    // Stock take-downs were applied then fully reversed (one estorno per baixa).
    expect(estoque.baixas).toHaveLength(2)
    expect(estoque.estornos).toHaveLength(2)
    // Cash movement never landed.
    expect(caixa.vendasRegistradas).toHaveLength(0)
    // Sale reverted to ABERTA.
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.ABERTA)
  })

  test('payment/status persist failure reverts stock take-down', async () => {
    const { repository, estoque, useCase } = setup()
    const venda = buildVenda({ itens: ITENS })
    repository.seed(venda)
    repository.failUpdateWith = 'DB_FAILURE'

    const result = await useCase.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2500 }],
    })

    expect(result.isFailure).toBe(true)
    expect(estoque.baixas).toHaveLength(2)
    expect(estoque.estornos).toHaveLength(2)
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.ABERTA)
  })
})
