import { EstoqueError, QuantidadeMovimentada } from '../../src/movimentacao'

describe('QuantidadeMovimentada', () => {
  test('accepts a positive integer quantity', () => {
    const result = QuantidadeMovimentada.tryCreate(3)

    expect(result.isOk).toBe(true)
    expect(result.instance.value).toBe(3)
  })

  test('rejects zero or negative values with QUANTIDADE_INVALIDA', () => {
    expect(QuantidadeMovimentada.tryCreate(0).errors).toContain(EstoqueError.QUANTIDADE_INVALIDA)
    expect(QuantidadeMovimentada.tryCreate(-1).errors).toContain(EstoqueError.QUANTIDADE_INVALIDA)
  })
})
