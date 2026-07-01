import {
  CaixaError,
  FecharCaixa,
  ResumoSessaoDTO,
  StatusSessaoCaixa,
} from '../../src/cash-session'
import { buildSessao, OPERADOR_A, OPERADOR_B, SESSAO_ID } from '../mock/caixa.builder'
import { FakePendingSalePredicate } from '../mock/fake-pending-sale.predicate'
import { InMemoryCaixaQuery } from '../mock/in-memory-caixa.query'
import { InMemoryCaixaRepository } from '../mock/in-memory-caixa.repository'

function resumoDTO(overrides: Partial<ResumoSessaoDTO> = {}): ResumoSessaoDTO {
  return {
    sessaoId: SESSAO_ID,
    status: StatusSessaoCaixa.ABERTA,
    abertura: 10000,
    suprimentos: 2000,
    vendasDinheiro: 3000,
    sangrias: 1000,
    esperado: 14000,
    contado: null,
    divergencia: null,
    totalVendas: 5000,
    qtdVendas: 2,
    totalPorForma: { DINHEIRO: 3000, PIX: 2000 },
    ...overrides,
  }
}

function setup() {
  const repository = new InMemoryCaixaRepository()
  const query = new InMemoryCaixaQuery()
  const pending = new FakePendingSalePredicate()
  const useCase = new FecharCaixa(repository, query, pending)
  return { repository, query, pending, useCase }
}

describe('FecharCaixa', () => {
  test('owner close returns the RN05 resumo and transitions to FECHADA', async () => {
    const { repository, query, useCase } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A }))
    query.resumos.set(SESSAO_ID, resumoDTO())

    const result = await useCase.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_A,
      valorFechamento: 15000,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.resumo).toEqual({
      totalVendas: 5000,
      qtdVendas: 2,
      totalPorForma: { DINHEIRO: 3000, PIX: 2000 },
      sangrias: 1000,
      suprimentos: 2000,
      saldoEsperado: 14000,
    })
    expect(result.instance.contado).toBe(15000)
    expect(result.instance.divergencia).toBe(1000)
    expect(repository.sessoes.get(SESSAO_ID)!.status).toBe(StatusSessaoCaixa.FECHADA)
  })

  test('non-owner is blocked with NAO_E_DONO_DO_CAIXA (RN02)', async () => {
    const { repository, query, useCase } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A }))
    query.resumos.set(SESSAO_ID, resumoDTO())

    const result = await useCase.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_B,
      valorFechamento: 15000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.NAO_E_DONO_DO_CAIXA)
    expect(repository.sessoes.get(SESSAO_ID)!.status).toBe(StatusSessaoCaixa.ABERTA)
  })

  test('pending sale blocks close with VENDA_PENDENTE_NO_FECHAMENTO', async () => {
    const { repository, query, pending, useCase } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A }))
    query.resumos.set(SESSAO_ID, resumoDTO())
    pending.pending = true

    const result = await useCase.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_A,
      valorFechamento: 15000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.VENDA_PENDENTE_NO_FECHAMENTO)
    expect(repository.sessoes.get(SESSAO_ID)!.status).toBe(StatusSessaoCaixa.ABERTA)
  })

  test('unknown session is rejected with CAIXA_NAO_ENCONTRADO', async () => {
    const { useCase } = setup()

    const result = await useCase.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_A,
      valorFechamento: 15000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.CAIXA_NAO_ENCONTRADO)
  })

  test('already-closed session is immutable — CAIXA_JA_FECHADO (RN06)', async () => {
    const { repository, query, useCase } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A, fechada: true }))
    query.resumos.set(SESSAO_ID, resumoDTO({ status: StatusSessaoCaixa.FECHADA }))

    const result = await useCase.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_A,
      valorFechamento: 15000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.CAIXA_JA_FECHADO)
  })
})
