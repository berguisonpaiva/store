import {
  EstoqueError,
  MotivoMovimentacaoEstoque,
  MovimentacaoEstoque,
  TipoMovimentacao,
} from '../../src/movimentacao'

describe('MovimentacaoEstoque', () => {
  test('creates a valid ledger entry and calculates saldo resultante', () => {
    const result = MovimentacaoEstoque.tryCreate({
      variacaoId: '11111111-1111-1111-1111-111111111111',
      tipo: TipoMovimentacao.ENTRADA,
      motivo: MotivoMovimentacaoEstoque.COMPRA,
      quantidade: 5,
      saldoAnterior: 2,
      usuarioId: '99999999-9999-9999-9999-999999999999',
      criadoEm: new Date('2026-06-27T12:00:00.000Z'),
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.saldoResultante).toBe(7)
    expect(result.instance.quantidade).toBe(5)
    expect(result.instance.usuarioId).toBe('99999999-9999-9999-9999-999999999999')
    expect(result.instance.criadoEm.toISOString()).toBe('2026-06-27T12:00:00.000Z')
  })

  test('rejects a non-positive quantity', () => {
    const result = MovimentacaoEstoque.tryCreate({
      variacaoId: '11111111-1111-1111-1111-111111111111',
      tipo: TipoMovimentacao.SAIDA,
      motivo: MotivoMovimentacaoEstoque.PERDA,
      quantidade: 0,
      saldoAnterior: 5,
      usuarioId: '99999999-9999-9999-9999-999999999999',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(EstoqueError.QUANTIDADE_INVALIDA)
  })

  test('rejects a movement without a responsible user (RF20)', () => {
    const result = MovimentacaoEstoque.tryCreate({
      variacaoId: '11111111-1111-1111-1111-111111111111',
      tipo: TipoMovimentacao.ENTRADA,
      motivo: MotivoMovimentacaoEstoque.COMPRA,
      quantidade: 5,
      saldoAnterior: 2,
      usuarioId: '',
    })

    expect(result.isFailure).toBe(true)
  })

  test('does not allow the immutable ledger to be edited after creation', () => {
    const movimento = MovimentacaoEstoque.create({
      variacaoId: '11111111-1111-1111-1111-111111111111',
      tipo: TipoMovimentacao.SAIDA,
      motivo: MotivoMovimentacaoEstoque.PERDA,
      quantidade: 1,
      saldoAnterior: 5,
      usuarioId: '99999999-9999-9999-9999-999999999999',
    })

    const edited = movimento.cloneWith({ saldoResultante: 999 } as never)

    expect(edited.isFailure).toBe(true)
    expect(edited.errors).toContain(EstoqueError.LEDGER_IMUTAVEL)
  })
})
