/**
 * ADMIN read-only "Caixas" panel DTOs, as seen at the HTTP edge. Money crosses
 * the boundary in **reais** (plain numbers) — the backend converts to/from cents,
 * so this layer never deals with cents. These mirror the backend response shapes
 * from `apps/backend/src/modules/sales` (`SessaoOutDTO`, `ResumoSessaoOutDTO`,
 * `MovimentacaoOutDTO`, `VendaOutDTO`) consumed by the read pages.
 *
 * This module is distinct from the operator-facing `caixa` module (the PDV): it
 * is ADMIN-only and read-only (design.md Decision 7 — web is read-only admin).
 */

export type SessaoCaixaStatus = 'ABERTA' | 'FECHADA';

export type MovimentacaoTipo =
  | 'ABERTURA'
  | 'SUPRIMENTO'
  | 'SANGRIA'
  | 'VENDA'
  | 'FECHAMENTO';

export type VendaStatus = 'ABERTA' | 'CONCLUIDA' | 'CANCELADA';

export type FormaPagamento =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_DEBITO'
  | 'CARTAO_CREDITO';

/** `GET /caixa` item and `GET /caixa/aberto` → a cash session. */
export type SessaoOutDTO = {
  id: string;
  operadorId: string;
  status: SessaoCaixaStatus;
  valorAbertura: number;
  valorFechamento: number | null;
  abertaEm: string;
  fechadaEm: string | null;
};

/**
 * `GET /caixa/:id/resumo` → the automatic session resumo (RN05). `esperado` is
 * the RN05 `saldoEsperado`; `contado`/`divergencia` stay null until close.
 */
export type ResumoSessaoDTO = {
  abertura: number;
  suprimentos: number;
  vendasDinheiro: number;
  sangrias: number;
  esperado: number;
  contado: number | null;
  divergencia: number | null;
  totalVendas: number;
  qtdVendas: number;
  totalPorForma: Record<string, number>;
};

/** One item from `GET /caixa/:id/movimentacoes`. */
export type MovimentacaoDTO = {
  id: string;
  tipo: MovimentacaoTipo;
  valor: number;
  observacao?: string | null;
  criadaEm: string;
};

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

/** A sale linked to the session (from `GET /vendas?sessaoCaixaId=<id>`). */
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

/** Parsed filters for the sessions list (mirrors the `nuqs` URL state). */
export type ListSessoesParams = {
  page: number;
  pageSize: number;
  usuarioId?: string;
  status?: SessaoCaixaStatus;
  from?: string;
  to?: string;
};

/** Operator (usuario) option used in the operator filter and name lookups. */
export type OperatorOption = {
  id: string;
  name: string;
};
