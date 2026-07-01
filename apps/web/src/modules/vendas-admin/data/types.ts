/**
 * ADMIN read-only "Vendas" panel DTOs, as seen at the HTTP edge. Money crosses
 * the boundary in **reais** (plain numbers) — the backend converts to/from cents,
 * so this layer never deals with cents. These mirror the backend response shapes
 * from `apps/backend/src/modules/sales` (`VendaOutDTO`) consumed by the read
 * pages.
 *
 * This module is distinct from the operator-facing PDV: it is ADMIN-only and
 * read-only (design.md Decision 7 — web is read-only admin). It mirrors the
 * sibling `caixas-admin` module.
 */

export type VendaStatus = 'ABERTA' | 'CONCLUIDA' | 'CANCELADA';

export type CanalVenda = 'PDV' | 'ONLINE';

export type FormaPagamento =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_DEBITO'
  | 'CARTAO_CREDITO';

export type VendaItemDTO = {
  id: string;
  variacaoId: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
};

export type VendaPagamentoDTO = {
  id: string;
  forma: FormaPagamento;
  valor: number;
};

/** One item from `GET /vendas` (ADMIN sees all operators' sales). */
export type VendaOutDTO = {
  id: string;
  numero: number | null;
  canal: string;
  status: VendaStatus;
  usuarioId: string;
  sessaoCaixaId: string;
  subtotal: number;
  desconto: number;
  total: number;
  itens: VendaItemDTO[];
  pagamentos: VendaPagamentoDTO[];
  concluidaEm?: string | null;
  canceladaEm?: string | null;
  criadoEm?: string;
};

export type PaginationMetaDTO = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResultDTO<T> = {
  data: T[];
  meta: PaginationMetaDTO;
};

/** Parsed filters for the sales list (mirrors the `nuqs` URL state). */
export type ListVendasParams = {
  page: number;
  pageSize: number;
  usuarioId?: string;
  sessaoCaixaId?: string;
  status?: VendaStatus;
  startDate?: string;
  endDate?: string;
};

/** Operator (usuario) option used in the operator filter and name lookups. */
export type OperatorOption = {
  id: string;
  name: string;
};
