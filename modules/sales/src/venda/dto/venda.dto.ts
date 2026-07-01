import { PaginatedInputDTO } from '@repo/shared'
import { CanalVenda } from '../model/canal-venda'
import { FormaPagamento } from '../model/forma-pagamento'
import { StatusVenda } from '../model/status-venda'
import { TipoDesconto } from '../model/tipo-desconto'
import { Venda } from '../model/venda.entity'

// --- input DTOs (write) ----------------------------------------------------

/// Identity (`usuarioId`/`sessaoCaixaId`) comes from the authenticated context, not
/// the body (design D7). The use case binds `sessaoCaixaId` from the open session.
export type CriarVendaInputDTO = {
  usuarioId: string
}

export type AdicionarItemInputDTO = {
  vendaId: string
  variacaoId: string
  quantidade: number
  /// Price snapshot (cents) resolved at the edge from the catalog at add time.
  precoUnitario: number
}

export type RemoverItemInputDTO = {
  vendaId: string
  itemId: string
}

export type AplicarDescontoInputDTO = {
  vendaId: string
  tipo: TipoDesconto
  /// Cents for `VALOR`; percentage (0..100) for `PERCENTUAL`.
  valor: number
}

export type PagamentoInputDTO = {
  forma: FormaPagamento
  valor: number
}

export type FinalizarVendaInputDTO = {
  vendaId: string
  pagamentos: PagamentoInputDTO[]
}

export type CancelarVendaInputDTO = {
  vendaId: string
}

export type BuscarVendaInputDTO = {
  vendaId: string
}

export type VendasFiltroDTO = {
  startDate?: Date
  endDate?: Date
  usuarioId?: string
  sessaoCaixaId?: string
  status?: StatusVenda
}

export type ListarVendasInputDTO = PaginatedInputDTO & VendasFiltroDTO

export type ResumoVendasInputDTO = VendasFiltroDTO

// --- output DTOs (read) ----------------------------------------------------

export type ItemVendaDTO = {
  id: string
  variacaoId: string
  quantidade: number
  precoUnitario: number
  total: number
}

export type PagamentoDTO = {
  id: string
  forma: FormaPagamento
  valor: number
}

export type VendaDTO = {
  id: string
  numero: number | null
  canal: CanalVenda
  status: StatusVenda
  usuarioId: string
  sessaoCaixaId: string
  subtotal: number
  desconto: number
  total: number
  itens: ItemVendaDTO[]
  pagamentos: PagamentoDTO[]
  concluidaEm: Date | null
  canceladaEm: Date | null
  criadoEm: Date
}

/// Total sold per payment method within a session/period (RF30). Used by the
/// cash-drawer close screen to reconcile the drawer against each tender type.
export type PagamentoPorFormaDTO = {
  forma: FormaPagamento
  total: number
  quantidade: number
}

export type ResumoVendasDTO = {
  quantidade: number
  subtotal: number
  desconto: number
  total: number
  /// One entry per `FormaPagamento`, always all four (zero when unused), so the
  /// close screen can render a complete, predictable breakdown (RF30).
  porFormaPagamento: PagamentoPorFormaDTO[]
}

/// Zero-filled breakdown covering every payment method, in a stable order.
export function emptyPorFormaPagamento(): PagamentoPorFormaDTO[] {
  return [
    FormaPagamento.DINHEIRO,
    FormaPagamento.CARTAO_DEBITO,
    FormaPagamento.CARTAO_CREDITO,
    FormaPagamento.PIX,
  ].map((forma) => ({ forma, total: 0, quantidade: 0 }))
}

export function toVendaDTO(venda: Venda): VendaDTO {
  return {
    id: venda.id,
    numero: venda.numero,
    canal: venda.canal,
    status: venda.status,
    usuarioId: venda.usuarioId,
    sessaoCaixaId: venda.sessaoCaixaId,
    subtotal: venda.subtotal,
    desconto: venda.desconto,
    total: venda.total,
    itens: venda.itens.map((item) => ({
      id: item.id,
      variacaoId: item.variacaoId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      total: item.total,
    })),
    pagamentos: venda.pagamentos.map((pagamento) => ({
      id: pagamento.id,
      forma: pagamento.forma,
      valor: pagamento.valor,
    })),
    concluidaEm: venda.concluidaEm,
    canceladaEm: venda.canceladaEm,
    criadoEm: venda.createdAt,
  }
}
