import {
  CaixaError,
  ListarMovimentacoes,
  PapelCaixa,
  ResumoSessao,
  ResumoSessaoDTO,
  StatusSessaoCaixa,
} from '../../src/cash-session'
import { ADMIN_ID, buildSessao, OPERADOR_A, OPERADOR_B, SESSAO_ID } from '../mock/caixa.builder'
import { InMemoryCaixaQuery } from '../mock/in-memory-caixa.query'
import { InMemoryCaixaRepository } from '../mock/in-memory-caixa.repository'

function resumoDTO(): ResumoSessaoDTO {
  return {
    sessaoId: SESSAO_ID,
    status: StatusSessaoCaixa.ABERTA,
    abertura: 10000,
    suprimentos: 0,
    vendasDinheiro: 0,
    sangrias: 0,
    esperado: 10000,
    contado: null,
    divergencia: null,
    totalVendas: 0,
    qtdVendas: 0,
    totalPorForma: {},
  }
}

function setup() {
  const repository = new InMemoryCaixaRepository()
  const query = new InMemoryCaixaQuery()
  repository.seed(buildSessao({ operadorId: OPERADOR_A }))
  query.resumos.set(SESSAO_ID, resumoDTO())
  const resumo = new ResumoSessao(query, repository)
  const listar = new ListarMovimentacoes(query, repository)
  return { repository, query, resumo, listar }
}

describe('ResumoSessao — read-scope (RN03/RN04)', () => {
  test('owner reads their own session resumo', async () => {
    const { resumo } = setup()
    const result = await resumo.execute({
      sessaoId: SESSAO_ID,
      ator: { usuarioId: OPERADOR_A, papel: PapelCaixa.OPERADOR },
    })
    expect(result.isOk).toBe(true)
  })

  test('ADMIN reads any session resumo (RN04 bypass)', async () => {
    const { resumo } = setup()
    const result = await resumo.execute({
      sessaoId: SESSAO_ID,
      ator: { usuarioId: ADMIN_ID, papel: PapelCaixa.ADMIN },
    })
    expect(result.isOk).toBe(true)
  })

  test('non-owner non-ADMIN is denied with ACESSO_NEGADO (RN03)', async () => {
    const { resumo } = setup()
    const result = await resumo.execute({
      sessaoId: SESSAO_ID,
      ator: { usuarioId: OPERADOR_B, papel: PapelCaixa.OPERADOR },
    })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.ACESSO_NEGADO)
  })
})

describe('ListarMovimentacoes — read-scope (RN03/RN04)', () => {
  test('owner lists their own session movements', async () => {
    const { listar } = setup()
    const result = await listar.execute({
      sessaoId: SESSAO_ID,
      page: 1,
      pageSize: 20,
      ator: { usuarioId: OPERADOR_A, papel: PapelCaixa.OPERADOR },
    })
    expect(result.isOk).toBe(true)
  })

  test('ADMIN lists any session movements (RN04 bypass)', async () => {
    const { listar } = setup()
    const result = await listar.execute({
      sessaoId: SESSAO_ID,
      page: 1,
      pageSize: 20,
      ator: { usuarioId: ADMIN_ID, papel: PapelCaixa.ADMIN },
    })
    expect(result.isOk).toBe(true)
  })

  test('non-owner non-ADMIN is denied with ACESSO_NEGADO (RN03)', async () => {
    const { listar } = setup()
    const result = await listar.execute({
      sessaoId: SESSAO_ID,
      page: 1,
      pageSize: 20,
      ator: { usuarioId: OPERADOR_B, papel: PapelCaixa.OPERADOR },
    })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.ACESSO_NEGADO)
  })
})
