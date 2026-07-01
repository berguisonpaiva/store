import { CreateItemVendaProps, CreatePagamentoProps, DescontoProps, StatusVenda, Venda } from '../../src/venda'

export const USUARIO_ID = '11111111-1111-1111-1111-111111111111'
export const SESSAO_ID = '22222222-2222-2222-2222-222222222222'
export const VARIACAO_A = '33333333-3333-3333-3333-333333333333'
export const VARIACAO_B = '44444444-4444-4444-4444-444444444444'

export type BuildVendaInput = Partial<{
  id: string
  numero: number | null
  status: StatusVenda
  usuarioId: string
  sessaoCaixaId: string
  itens: CreateItemVendaProps[]
  pagamentos: CreatePagamentoProps[]
  desconto: DescontoProps | null
}>

/// Builds a fully-formed `Venda` aggregate via the `hydrate` factory, for seeding
/// the in-memory repository in use-case tests.
export function buildVenda(input: BuildVendaInput = {}): Venda {
  return Venda.hydrate({
    id: input.id,
    numero: input.numero ?? null,
    status: input.status ?? StatusVenda.ABERTA,
    usuarioId: input.usuarioId ?? USUARIO_ID,
    sessaoCaixaId: input.sessaoCaixaId ?? SESSAO_ID,
    itens: input.itens ?? [{ variacaoId: VARIACAO_A, quantidade: 1, precoUnitario: 1000 }],
    pagamentos: input.pagamentos ?? [],
    desconto: input.desconto ?? null,
  }).instance
}
