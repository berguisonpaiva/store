import {
  AbrirCaixa,
  CaixaError,
  StatusSessaoCaixa,
  TipoMovimentacaoCaixa,
} from '../../src/cash-session'
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

  test('records an ABERTURA movement with the opening value alongside the session', async () => {
    const { repository, useCase } = setup()

    const result = await useCase.execute({ operadorId: OPERADOR_A, valorAbertura: 5000 })

    expect(result.isOk).toBe(true)
    expect(repository.movimentacoes).toHaveLength(1)
    const movimentacao = repository.movimentacoes[0]
    expect(movimentacao.tipo).toBe(TipoMovimentacaoCaixa.ABERTURA)
    expect(movimentacao.valor).toBe(5000)
    expect(movimentacao.sessaoId).toBe(result.instance.id)
    expect(movimentacao.criadaEm).toEqual(result.instance.abertaEm)
  })

  test('records an ABERTURA movement even when the drawer opens empty (valor 0)', async () => {
    const { repository, useCase } = setup()

    const result = await useCase.execute({ operadorId: OPERADOR_A, valorAbertura: 0 })

    expect(result.isOk).toBe(true)
    expect(repository.movimentacoes).toHaveLength(1)
    expect(repository.movimentacoes[0].tipo).toBe(TipoMovimentacaoCaixa.ABERTURA)
    expect(repository.movimentacoes[0].valor).toBe(0)
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
