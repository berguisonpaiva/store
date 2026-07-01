/**
 * Money + filter helpers. The backend stores/returns integer cents (matching
 * the domain `Price`); the UI edits/show decimals. Centralized here so the
 * `> 0` rule and rounding live in one place.
 */

/** Decimal (e.g. `5.9`) → integer cents (`590`). */
export function toCents(value: number): number {
  return Math.round(value * 100);
}

/** Integer cents (`590`) → decimal number (`5.9`). */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Integer cents → display string (`"5.90"`), for inputs/tables. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Integer cents → localized BRL string for read-only display. */
export function formatPriceBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/** Coerce an unknown search-param value to a positive integer with a default. */
export function parsePositiveInt(
  value: string | string[] | undefined,
  fallback: number,
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}

/** Coerce an unknown search-param value to an optional trimmed string. */
export function parseString(
  value: string | string[] | undefined,
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** Coerce `"true"`/`"false"` (or undefined) to an optional boolean. */
export function parseBool(
  value: string | string[] | undefined,
): boolean | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}
