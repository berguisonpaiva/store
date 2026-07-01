import {
  BuscarVenda,
  FormaPagamento,
  ListarVendas,
  ResumoVendas,
  StatusVenda,
  VendaError,
} from '../../src/venda'
import { InMemoryVendasQuery } from '../mock/in-memory-vendas.query'
import { InMemoryVendasRepository } from '../mock/in-memory-vendas.repository'
import { buildVenda, SESSAO_ID, USUARIO_ID, VARIACAO_A } from '../mock/venda.builder'

const OTHER_USER = '55555555-5555-5555-5555-555555555555'
const OTHER_SESSION = '66666666-6666-6666-6666-666666666666'

function setup() {
  const repository = new InMemoryVendasRepository()
  const query = new InMemoryVendasQuery(repository)
  return { repository, query }
}

describe('BuscarVenda', () => {
  test('returns an existing sale with items', async () => {
    const { repository, query } = setup()
    const venda = buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }] })
    repository.seed(venda)
    const useCase = new BuscarVenda(query)

    const result = await useCase.execute({ vendaId: venda.id })

    expect(result.isOk).toBe(true)
    expect(result.instance.id).toBe(venda.id)
    expect(result.instance.itens).toHaveLength(1)
    expect(result.instance.total).toBe(2000)
  })

  test('SALE_NOT_FOUND for an unknown id', async () => {
    const { query } = setup()
    const useCase = new BuscarVenda(query)

    const result = await useCase.execute({ vendaId: '99999999-9999-9999-9999-999999999999' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(VendaError.SALE_NOT_FOUND)
  })
})

describe('ListarVendas', () => {
  test('filters by operator', async () => {
    const { repository, query } = setup()
    repository.seed(buildVenda({ usuarioId: USUARIO_ID }))
    repository.seed(buildVenda({ usuarioId: OTHER_USER }))
    const useCase = new ListarVendas(query)

    const result = await useCase.execute({ page: 1, pageSize: 10, usuarioId: USUARIO_ID })

    expect(result.isOk).toBe(true)
    expect(result.instance.data).toHaveLength(1)
    expect(result.instance.data[0]!.usuarioId).toBe(USUARIO_ID)
    expect(result.instance.meta.total).toBe(1)
  })

  test('filters by status', async () => {
    const { repository, query } = setup()
    repository.seed(buildVenda({ status: StatusVenda.ABERTA }))
    repository.seed(buildVenda({ status: StatusVenda.CONCLUIDA }))
    repository.seed(buildVenda({ status: StatusVenda.CONCLUIDA }))
    const useCase = new ListarVendas(query)

    const result = await useCase.execute({ page: 1, pageSize: 10, status: StatusVenda.CONCLUIDA })

    expect(result.instance.data).toHaveLength(2)
    expect(result.instance.data.every((venda) => venda.status === StatusVenda.CONCLUIDA)).toBe(true)
  })
})

describe('ResumoVendas', () => {
  test('sums totals over the matching sales by session', async () => {
    const { repository, query } = setup()
    repository.seed(
      buildVenda({
        sessaoCaixaId: SESSAO_ID,
        itens: [{ variacaoId: VARIACAO_A, quantidade: 2, precoUnitario: 1000 }],
      }),
    )
    repository.seed(
      buildVenda({
        sessaoCaixaId: SESSAO_ID,
        itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 500 }],
      }),
    )
    repository.seed(
      buildVenda({
        sessaoCaixaId: OTHER_SESSION,
        itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 9999 }],
      }),
    )
    const useCase = new ResumoVendas(query)

    const result = await useCase.execute({ sessaoCaixaId: SESSAO_ID })

    expect(result.isOk).toBe(true)
    expect(result.instance.quantidade).toBe(2)
    expect(result.instance.subtotal).toBe(2500)
    expect(result.instance.total).toBe(2500)
  })

  test('breaks totals down per payment method within the session (RF30)', async () => {
    const { repository, query } = setup()
    repository.seed(
      buildVenda({
        sessaoCaixaId: SESSAO_ID,
        status: StatusVenda.CONCLUIDA,
        itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 3000 }],
        pagamentos: [
          { forma: FormaPagamento.DINHEIRO, valor: 1000 },
          { forma: FormaPagamento.PIX, valor: 2000 },
        ],
      }),
    )
    repository.seed(
      buildVenda({
        sessaoCaixaId: SESSAO_ID,
        status: StatusVenda.CONCLUIDA,
        itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1500 }],
        pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 1500 }],
      }),
    )
    const useCase = new ResumoVendas(query)

    const result = await useCase.execute({ sessaoCaixaId: SESSAO_ID })

    const porForma = result.instance.porFormaPagamento
    const find = (forma: FormaPagamento) => porForma.find((p) => p.forma === forma)!

    expect(porForma).toHaveLength(4)
    expect(find(FormaPagamento.DINHEIRO)).toEqual({ forma: FormaPagamento.DINHEIRO, total: 2500, quantidade: 2 })
    expect(find(FormaPagamento.PIX)).toEqual({ forma: FormaPagamento.PIX, total: 2000, quantidade: 1 })
    expect(find(FormaPagamento.CARTAO_DEBITO).total).toBe(0)
    expect(find(FormaPagamento.CARTAO_CREDITO).total).toBe(0)
  })

  test('sums totals over a period', async () => {
    const { repository, query } = setup()
    repository.seed(buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }] }))
    repository.seed(buildVenda({ itens: [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 2000 }] }))
    const useCase = new ResumoVendas(query)

    const result = await useCase.execute({
      startDate: new Date(Date.now() - 60_000),
      endDate: new Date(Date.now() + 60_000),
    })

    expect(result.instance.quantidade).toBe(2)
    expect(result.instance.total).toBe(3000)
  })
})
