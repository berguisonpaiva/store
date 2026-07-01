import type { DescontoTipo } from '../schemas/vendas.schema';
import type { VendaOutDTO } from './types';

/**
 * Pure helpers for the PDV sale screen so the page, components, and tests share
 * one source of truth for the money math and the read-only branching. All money
 * is in **reais** (matching the wire and the `caixa` module); comparisons round
 * to 2 decimals internally to absorb floating-point noise.
 */

export type Totals = {
  subtotal: number; // reais
  desconto: number; // reais
  total: number; // reais
};

/** Round a reais amount to 2 decimals (integer-cents precision). */
function round2(reais: number): number {
  return Math.round(reais * 100) / 100;
}

/** `total = subtotal − desconto`, never below zero. All values in reais. */
export function computeTotals(subtotal: number, desconto: number): Totals {
  const total = Math.max(0, round2(subtotal - desconto));
  return { subtotal: round2(subtotal), desconto: round2(desconto), total };
}

/**
 * Resolve the discount amount in reais from the form input, clamped to the
 * subtotal. `valor` is reais; `percentual` is a 0–100 percentage of the
 * subtotal. Used for the live preview before the PATCH round-trip.
 */
export function resolveDesconto(
  tipo: DescontoTipo,
  valor: number,
  subtotal: number,
): number {
  if (tipo === 'percentual') {
    return Math.min(subtotal, round2((subtotal * valor) / 100));
  }
  return Math.min(subtotal, round2(valor));
}

/** Whether the payments (reais) sum to the sale `total` (reais). */
export function paymentsMatchTotal(valoresReais: number[], total: number): boolean {
  const sum = valoresReais.reduce((acc, v) => acc + v, 0);
  return Math.abs(round2(sum) - round2(total)) < 0.005;
}

/** A sale is read-only once it is no longer `ABERTA`. */
export function isSaleReadOnly(venda: VendaOutDTO): boolean {
  return venda.status !== 'ABERTA';
}
