/** BRL display formatting for read-only sale values (reais). */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/** Localized date/time for sale timestamps. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

/** Receipt number display: `#000123`, or a dash until the sale is finalized. */
export function saleNumberLabel(numero: number | null): string {
  if (numero === null || numero === undefined) {
    return '—';
  }
  return `#${String(numero).padStart(6, '0')}`;
}

/** Number of items (line count) in a sale. */
export function itemCount(itens: { quantidade: number }[]): number {
  return itens.reduce((sum, item) => sum + item.quantidade, 0);
}

const SALE_STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export function saleStatusLabel(status: string): string {
  return SALE_STATUS_LABELS[status] ?? status;
}

const PAYMENT_FORM_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  CARTAO_DEBITO: 'Cartão de débito',
  CARTAO_CREDITO: 'Cartão de crédito',
};

export function paymentFormLabel(forma: string): string {
  return PAYMENT_FORM_LABELS[forma] ?? forma;
}
