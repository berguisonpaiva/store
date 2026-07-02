import { AdicionarPagamento, FormaPagamento, StatusVenda, VendaError } from '../../src/venda'
import { InMemoryVendasRepository } from '../mock/in-memory-vendas.repository'
import { buildVenda, USUARIO_ID, VARIACAO_A } from '../mock/venda.builder'

const OUTRO_USUARIO = '55555555-5555-5555-5555-555555555555'

function setup() {
  const repository = new InMemoryVendasRepository()
  return { repository, useCase: new AdicionarPagamento(repository) }
}

describe('AdicionarPagamento', () => {
  test('accepts a partial payment on an ABERTA sale (no Σ == total here)', async () => {
    const { repository, useCase } = setup()
    // total = 2000; a single 500 payment is fine — RN07 only applies at finalize.
    const venda = buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }] })
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      usuarioId: USUARIO_ID,
      forma: FormaPagamento.DINHEIRO,
      valor: 500,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.status).toBe(StatusVenda.ABERTA)
    expect(result.instance.pagamentos).toHaveLength(1)
    expect(result.instance.pagamentos[0]!.valor).toBe(500)
    expect(repository.get(venda.id)!.totalPagamentos).toBe(500)
  })

  test('appends incrementally across successive calls', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }] })
    repository.seed(venda)

    const primeiro = await useCase.execute({
      vendaId: venda.id,
      usuarioId: USUARIO_ID,
      forma: FormaPagamento.DINHEIRO,
      valor: 500,
    })
    expect(primeiro.isOk).toBe(true)

    const segundo = await useCase.execute({
      vendaId: venda.id,
      usuarioId: USUARIO_ID,
      forma: FormaPagamento.PIX,
      valor: 1500,
    })

    expect(segundo.isOk).toBe(true)
    expect(segundo.instance.pagamentos).toHaveLength(2)
    expect(repository.get(venda.id)!.totalPagamentos).toBe(2000)
  })

  test('SALE_NOT_FOUND for an unknown sale', async () => {
    const { useCase } = setup()

    const result = await useCase.execute({
      vendaId: '99999999-9999-9999-9999-999999999999',
      usuarioId: USUARIO_ID,
      forma: FormaPagamento.DINHEIRO,
      valor: 500,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_NOT_FOUND)
  })

  test('ACESSO_NEGADO when the actor does not own the sale', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda()
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      usuarioId: OUTRO_USUARIO,
      forma: FormaPagamento.DINHEIRO,
      valor: 500,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.ACESSO_NEGADO)
    expect(repository.get(venda.id)!.pagamentos).toHaveLength(0)
  })

  test('INVALID_PAYMENT for a non-positive valor', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda()
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      usuarioId: USUARIO_ID,
      forma: FormaPagamento.DINHEIRO,
      valor: 0,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_PAYMENT)
  })

  test('INVALID_PAYMENT for an unknown forma', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda()
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      usuarioId: USUARIO_ID,
      forma: 'CHEQUE' as FormaPagamento,
      valor: 500,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.INVALID_PAYMENT)
  })

  test('SALE_ALREADY_FINALIZED on a CONCLUIDA sale, and no payment is added', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda({
      status: StatusVenda.CONCLUIDA,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 1000 }],
    })
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      usuarioId: USUARIO_ID,
      forma: FormaPagamento.PIX,
      valor: 500,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_ALREADY_FINALIZED)
    expect(repository.get(venda.id)!.pagamentos).toHaveLength(1)
  })

  test('SALE_NOT_OPEN on a CANCELADA sale, and no payment is added', async () => {
    const { repository, useCase } = setup()
    const venda = buildVenda({ status: StatusVenda.CANCELADA })
    repository.seed(venda)

    const result = await useCase.execute({
      vendaId: venda.id,
      usuarioId: USUARIO_ID,
      forma: FormaPagamento.DINHEIRO,
      valor: 500,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_NOT_OPEN)
    expect(repository.get(venda.id)!.pagamentos).toHaveLength(0)
  })
})
