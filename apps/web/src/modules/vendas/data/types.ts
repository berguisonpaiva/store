/**
 * PDV sale (vendas) DTOs as seen at the HTTP edge. Money is exposed in **reais**
 * (decimal numbers, 2 decimals) — the backend's `venda.mapper` is the boundary
 * where domain cents become reais — matching the `caixa` sibling module. The
 * web layer never juggles cents: it sends/receives reais directly.
 */

export type VendaStatus = 'ABERTA' | 'CONCLUIDA' | 'CANCELADA';

export type FormaPagamento =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_DEBITO'
  | 'CARTAO_CREDITO';

export type VendaItemDTO = {
  id: string;
  variacaoId: string;
  quantidade: number;
  precoUnitario: number; // reais — snapshot at add time
  total: number; // reais
};

export type VendaPagamentoDTO = {
  id: string;
  forma: FormaPagamento;
  valor: number; // reais
};

/** `VendaOutDTO` returned by every `/vendas` mutation and `GET /vendas/:id`. */
export type VendaOutDTO = {
  id: string;
  /** Sequential receipt number — null until the sale is finalized. */
  numero: number | null;
  canal: string;
  status: VendaStatus;
  usuarioId: string;
  sessaoCaixaId: string;
  subtotal: number; // reais
  desconto: number; // reais
  total: number; // reais
  itens: VendaItemDTO[];
  pagamentos: VendaPagamentoDTO[];
  concluidaEm?: string | null;
  canceladaEm?: string | null;
  criadoEm?: string;
};

/** `GET /vendas/resumo`. */
export type ResumoVendasOutDTO = {
  quantidade: number;
  subtotal: number;
  desconto: number;
  total: number;
};

/** Inputs for the add-item action (`POST /vendas/:id/itens`). */
export type AddItemInput = {
  variacaoId?: string;
  sku?: string;
  codigoBarras?: string;
  quantidade: number;
};

export type DescontoInput = {
  tipo: 'valor' | 'percentual';
  valor: number;
};

export type PagamentoInput = {
  forma: FormaPagamento;
  valor: number; // reais
};

export type FinalizarInput = {
  pagamentos: PagamentoInput[];
};

/**
 * An active variation offered as an autocomplete option in the item-entry
 * `Combobox`. Derived from catalog data on the server and passed to the screen.
 */
export type VariationOption = {
  variacaoId: string;
  sku: string;
  barcode: string | null;
  label: string; // "Produto · SKU"
  /** Catalog price reference (catalog exposes integer cents); not displayed as money here. */
  price: number;
};
