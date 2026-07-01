import {
  EstoqueError,
  EstoquePolicyService,
  TipoMovimentacao,
} from '../../src/movimentacao'

describe('EstoquePolicyService', () => {
  test('rejects a manual exit that would make the balance negative', () => {
    const result = EstoquePolicyService.assertSaldoSuficiente(2, 3)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(EstoqueError.ESTOQUE_INSUFICIENTE)
  })

  test('computes adjustment delta and direction from an absolute target balance', () => {
    const result = EstoquePolicyService.calculateAdjustment(3, 8)

    expect(result.isOk).toBe(true)
    expect(result.instance.tipo).toBe(TipoMovimentacao.ENTRADA)
    expect(result.instance.quantidade).toBe(5)
  })
})
