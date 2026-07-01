import { TransactionContext } from '@repo/shared'
import { CaixaError, CaixaPortService, TipoMovimentacaoCaixa } from '../../src/cash-session'
import { buildSessao, SESSAO_ID } from '../mock/caixa.builder'
import { InMemoryCaixaQuery } from '../mock/in-memory-caixa.query'
import { InMemoryCaixaRepository } from '../mock/in-memory-caixa.repository'

function setup() {
  const repository = new InMemoryCaixaRepository()
  const query = new InMemoryCaixaQuery()
  const port = new CaixaPortService(repository, query)
  return { repository, query, port }
}

describe('CaixaPortService.isSessaoAberta', () => {
  test('true for an open session', async () => {
    const { repository, port } = setup()
    repository.seed(buildSessao())
    const result = await port.isSessaoAberta(SESSAO_ID)
    expect(result.isOk).toBe(true)
    expect(result.instance).toBe(true)
  })

  test('false for a closed session', async () => {
    const { repository, port } = setup()
    repository.seed(buildSessao({ fechada: true }))
    const result = await port.isSessaoAberta(SESSAO_ID)
    expect(result.isOk).toBe(true)
    expect(result.instance).toBe(false)
  })

  test('CAIXA_NAO_ENCONTRADO for an unknown session', async () => {
    const { port } = setup()
    const result = await port.isSessaoAberta(SESSAO_ID)
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.CAIXA_NAO_ENCONTRADO)
  })
})

describe('CaixaPortService.registrarVenda', () => {
  test('appends a VENDA movement on an open session, threading tx', async () => {
    const { repository, port } = setup()
    repository.seed(buildSessao())
    const tx = {} as TransactionContext

    const result = await port.registrarVenda(SESSAO_ID, 2500, tx)

    expect(result.isOk).toBe(true)
    expect(repository.movimentacoes).toHaveLength(1)
    expect(repository.movimentacoes[0].tipo).toBe(TipoMovimentacaoCaixa.VENDA)
    expect(repository.movimentacoes[0].valor).toBe(2500)
  })

  test('CAIXA_JA_FECHADO on a closed session (RN06)', async () => {
    const { repository, port } = setup()
    repository.seed(buildSessao({ fechada: true }))

    const result = await port.registrarVenda(SESSAO_ID, 2500)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.CAIXA_JA_FECHADO)
    expect(repository.movimentacoes).toHaveLength(0)
  })
})

describe('CaixaPortService.estornarVenda', () => {
  test('reverses a VENDA on an open session', async () => {
    const { repository, port } = setup()
    repository.seed(buildSessao())

    const result = await port.estornarVenda(SESSAO_ID, 2500)

    expect(result.isOk).toBe(true)
    expect(repository.estornos).toEqual([{ sessaoId: SESSAO_ID, valor: 2500 }])
  })

  test('CAIXA_JA_FECHADO on a closed session (RN06)', async () => {
    const { repository, port } = setup()
    repository.seed(buildSessao({ fechada: true }))

    const result = await port.estornarVenda(SESSAO_ID, 2500)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.CAIXA_JA_FECHADO)
    expect(repository.estornos).toHaveLength(0)
  })
})
