import {
  CaixaError,
  RegistrarSangria,
  RegistrarSuprimento,
  TipoMovimentacaoCaixa,
} from '../../src/cash-session'
import { buildSessao, OPERADOR_A, OPERADOR_B, SESSAO_ID } from '../mock/caixa.builder'
import { InMemoryCaixaRepository } from '../mock/in-memory-caixa.repository'

function setup() {
  const repository = new InMemoryCaixaRepository()
  const sangria = new RegistrarSangria(repository)
  const suprimento = new RegistrarSuprimento(repository)
  return { repository, sangria, suprimento }
}

describe('RegistrarSuprimento / RegistrarSangria', () => {
  test('owner appends a SUPRIMENTO movement on an open session', async () => {
    const { repository, suprimento } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A }))

    const result = await suprimento.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_A,
      valor: 2000,
    })

    expect(result.isOk).toBe(true)
    expect(repository.movimentacoes).toHaveLength(1)
    expect(repository.movimentacoes[0].tipo).toBe(TipoMovimentacaoCaixa.SUPRIMENTO)
    expect(repository.movimentacoes[0].valor).toBe(2000)
  })

  test('owner appends a SANGRIA movement on an open session', async () => {
    const { repository, sangria } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A }))

    const result = await sangria.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_A,
      valor: 1500,
    })

    expect(result.isOk).toBe(true)
    expect(repository.movimentacoes[0].tipo).toBe(TipoMovimentacaoCaixa.SANGRIA)
  })

  test('non-owner is blocked with NAO_E_DONO_DO_CAIXA (RN02)', async () => {
    const { repository, sangria } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A }))

    const result = await sangria.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_B,
      valor: 1500,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.NAO_E_DONO_DO_CAIXA)
    expect(repository.movimentacoes).toHaveLength(0)
  })

  test('movement on a FECHADA session is rejected with CAIXA_JA_FECHADO (RN06)', async () => {
    const { repository, suprimento } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A, fechada: true }))

    const result = await suprimento.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_A,
      valor: 2000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.CAIXA_JA_FECHADO)
    expect(repository.movimentacoes).toHaveLength(0)
  })

  test('non-positive value is rejected with VALOR_INVALIDO', async () => {
    const { repository, sangria } = setup()
    repository.seed(buildSessao({ operadorId: OPERADOR_A }))

    const result = await sangria.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_A,
      valor: 0,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.VALOR_INVALIDO)
  })

  test('unknown session is rejected with CAIXA_NAO_ENCONTRADO', async () => {
    const { suprimento } = setup()

    const result = await suprimento.execute({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_A,
      valor: 2000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CaixaError.CAIXA_NAO_ENCONTRADO)
  })
})
