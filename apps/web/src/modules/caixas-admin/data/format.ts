/** BRL display formatting for read-only summary/movement/sale values (reais). */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/** Localized date/time for session/movement/sale timestamps. */
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

const SESSION_STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  FECHADA: 'Fechada',
};

export function sessionStatusLabel(status: string): string {
  return SESSION_STATUS_LABELS[status] ?? status;
}

const MOVEMENT_LABELS: Record<string, string> = {
  ABERTURA: 'Abertura',
  SUPRIMENTO: 'Suprimento',
  SANGRIA: 'Sangria',
  VENDA: 'Venda',
  FECHAMENTO: 'Fechamento',
};

export function movementLabel(tipo: string): string {
  return MOVEMENT_LABELS[tipo] ?? tipo;
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
