/**
 * Money for vendas crosses the HTTP edge as **reais** (decimal numbers, 2
 * decimals) — the same boundary the `caixa` sibling module uses. The web layer
 * never deals with cents: NumericFormat already stores reais (`floatValue`)
 * which is sent as-is, and responses are reais formatted with `formatBRL`.
 */

/** BRL display formatting for a value in reais. */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const PAYMENT_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO_DEBITO: 'Cartão de débito',
  CARTAO_CREDITO: 'Cartão de crédito',
};

export function paymentLabel(forma: string): string {
  return PAYMENT_LABELS[forma] ?? forma;
}
