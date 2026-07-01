import { AbrirCaixa, CaixaError, StatusSessaoCaixa } from '../../src/cash-session'
import { buildSessao, OPERADOR_A } from '../mock/caixa.builder'
import { InMemoryCaixaRepository } from '../mock/in-memory-caixa.repository'

function setup() {
  const repository = new InMemoryCaixaRepository()
  const useCase = new AbrirCaixa(repository)
  return { repository, useCase }
}

describe('AbrirCaixa (RN01)', () => {
  test('opens the first session in ABERTA with the opening value', async () => {
    const { repository, useCase } = setup()

    const result = await useCase.execute({ operadorId: OPERADOR_A, valorAbertura: 5000 })

    expect(result.isOk).toBe(true)
    expect(result.instance.status).toBe(StatusSessaoCaixa.ABERTA)
    expect(result.instance.operadorId).toBe(OPERADOR_A)
    expect(result.instance.valorAbertura).toBe(5000)
    expect(repository.sessoes.size).toBe(1)
  })

  test('rejects a second open session for the same operator with CAIXA_JA_ABERTO', async () => {
    const { repository, useCase } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A }))

    const result = await useCase.execute({ operadorId: OPERADOR_A, valorAbertura: 5000 })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.CAIXA_JA_ABERTO)
    expect(repository.sessoes.size).toBe(1)
  })

  test('rejects a negative opening value with VALOR_INVALIDO', async () => {
    const { useCase } = setup()

    const result = await useCase.execute({ operadorId: OPERADOR_A, valorAbertura: -1 })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.VALOR_INVALIDO)
  })
})
