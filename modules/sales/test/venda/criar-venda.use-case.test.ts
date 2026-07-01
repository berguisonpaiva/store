import { CanalVenda, CriarVenda, StatusVenda, VendaError } from '../../src/venda'
import { FakeCaixaGateway } from '../mock/fake-caixa.gateway'
import { InMemoryVendasRepository } from '../mock/in-memory-vendas.repository'
import { SESSAO_ID, USUARIO_ID } from '../mock/venda.builder'

function setup() {
  const repository = new InMemoryVendasRepository()
  const caixa = new FakeCaixaGateway()
  const useCase = new CriarVenda(repository, caixa)
  return { repository, caixa, useCase }
}

describe('CriarVenda', () => {
  test('creates an ABERTA PDV sale bound to the open session', async () => {
    const { repository, caixa, useCase } = setup()
    caixa.withOpenSession(SESSAO_ID)

    const result = await useCase.execute({ usuarioId: USUARIO_ID })

    expect(result.isOk).toBe(true)
    expect(result.instance.status).toBe(StatusVenda.ABERTA)
    expect(result.instance.canal).toBe(CanalVenda.PDV)
    expect(result.instance.sessaoCaixaId).toBe(SESSAO_ID)
    expect(result.instance.total).toBe(0)
    expect(repository.vendas.size).toBe(1)
  })

  test('fails with NO_OPEN_CASH_SESSION and persists nothing', async () => {
    const { repository, useCase } = setup()

    const result = await useCase.execute({ usuarioId: USUARIO_ID })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.NO_OPEN_CASH_SESSION)
    expect(repository.vendas.size).toBe(0)
  })
})
