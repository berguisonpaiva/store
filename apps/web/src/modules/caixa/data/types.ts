/**
 * Cash-session (PDV) DTOs as seen at the HTTP edge. Money is a plain `number`
 * in REAIS here (the backend converts to/from its internal representation), so
 * the web layer never deals with cents — it formats reais with NumericFormat.
 */

export type SessaoCaixaStatus = 'ABERTA' | 'FECHADA';

export type MovimentacaoTipo =
  | 'ABERTURA'
  | 'SUPRIMENTO'
  | 'SANGRIA'
  | 'VENDA'
  | 'FECHAMENTO';

/** `GET /caixa/aberto` and `POST /caixa/abrir` → open session. */
export type SessaoOutDTO = {
  id: string;
  operadorId: string;
  status: SessaoCaixaStatus;
  valorAbertura: number;
  valorFechamento: number | null;
  abertaEm: string;
  fechadaEm: string | null;
};

/** `GET /caixa/:id/resumo`. `contado`/`divergencia` are null until close. */
export type ResumoSessaoDTO = {
  abertura: number;
  suprimentos: number;
  vendasDinheiro: number;
  sangrias: number;
  esperado: number;
  contado: number | null;
  divergencia: number | null;
};

/** One item from `GET /caixa/:id/movimentacoes`. */
export type MovimentacaoDTO = {
  id: string;
  tipo: MovimentacaoTipo;
  valor: number;
  observacao?: string | null;
  criadaEm: string;
};

/** `POST /caixa/:id/fechar` → closing summary. */
export type FecharCaixaResultDTO = {
  esperado: number;
  contado: number;
  divergencia: number;
};
