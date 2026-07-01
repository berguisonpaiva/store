import { CancelarVenda, FormaPagamento, StatusVenda, VendaError } from '../../src/venda'
import { FakeCaixaGateway } from '../mock/fake-caixa.gateway'
import { FakeEstoqueGateway } from '../mock/fake-estoque.gateway'
import { InMemoryVendasRepository } from '../mock/in-memory-vendas.repository'
import { buildVenda, SESSAO_ID, VARIACAO_A } from '../mock/venda.builder'

function setup() {
  const repository = new InMemoryVendasRepository()
  const estoque = new FakeEstoqueGateway()
  const caixa = new FakeCaixaGateway().withOpenSession(SESSAO_ID)
  const useCase = new CancelarVenda(repository, estoque, caixa)
  return { repository, estoque, caixa, useCase }
}

describe('CancelarVenda', () => {
  test('reverses stock and cash for a CONCLUIDA sale while the session is open', async () => {
    const { repository, estoque, caixa, useCase } = setup()
    const venda = buildVenda({
      status: StatusVenda.CONCLUIDA,
      itens: [{ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }],
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 2000 }],
    })
    repository.seed(venda)

    const result = await useCase.execute({ vendaId: venda.id })

    expect(result.isOk).toBe(true)
    expect(result.instance.status).toBe(StatusVenda.CANCELADA)
    expect(estoque.estornos).toHaveLength(1)
    expect(estoque.estornos[0]!.origemVendaId).toBe(venda.id)
    expect(caixa.vendasEstornadas).toEqual([{ sessaoCaixaId: SESSAO_ID, valor: 2000 }])
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.CANCELADA)
  })

  test('cancels an ABERTA sale without touching stock/cash', async () => {
    const { repository, estoque, caixa, useCase } = setup()
    const venda = buildVenda({ status: StatusVenda.ABERTA })
    repository.seed(venda)

    const result = await useCase.execute({ vendaId: venda.id })

    expect(result.isOk).toBe(true)
    expect(result.instance.status).toBe(StatusVenda.CANCELADA)
    expect(estoque.estornos).toHaveLength(0)
    expect(caixa.vendasEstornadas).toHaveLength(0)
  })

  test('blocked after the session has closed', async () => {
    const { repository, caixa, useCase } = setup()
    const venda = buildVenda({ status: StatusVenda.CONCLUIDA })
    repository.seed(venda)
    caixa.sessaoStillOpen = false

    const result = await useCase.execute({ vendaId: venda.id })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.CASH_SESSION_CLOSED)
    expect(repository.get(venda.id)!.status).toBe(StatusVenda.CONCLUIDA)
  })

  test('SALE_NOT_FOUND for a missing sale', async () => {
    const { useCase } = setup()
    const result = await useCase.execute({ vendaId: '99999999-9999-9999-9999-999999999999' })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_NOT_FOUND)
  })
})
