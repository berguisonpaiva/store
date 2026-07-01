/** BRL display formatting for read-only summary/movement values (reais). */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/** Localized date/time for movement timestamps. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
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
