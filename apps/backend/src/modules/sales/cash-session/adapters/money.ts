import { Prisma } from '@prisma/client';

/// Money boundary helpers for the caixa adapters.
///
/// The domain (`@repo/sales`) holds money as an INTEGER number of cents; the
/// database stores `Decimal(12,2)` reais. These helpers convert between the two
/// representations exactly — cents are integers and reais carry exactly two
/// decimals, so the round-trip never introduces floating-point drift.

/// Cents (integer) -> persisted `Decimal` reais.
export function centsToDecimal(cents: number): Prisma.Decimal;
export function centsToDecimal(cents: number | null): Prisma.Decimal | null;
export function centsToDecimal(cents: number | null): Prisma.Decimal | null {
  if (cents === null) {
    return null;
  }
  // Build the Decimal from cents / 100 using Decimal arithmetic (no float).
  return new Prisma.Decimal(cents).dividedBy(100);
}

/// Persisted `Decimal` reais -> cents (integer).
export function decimalToCents(value: Prisma.Decimal): number {
  return value.times(100).toNearest(1).toNumber();
}

/// Nullable `Decimal` reais -> nullable cents (integer).
export function nullableDecimalToCents(
  value: Prisma.Decimal | null,
): number | null {
  return value === null ? null : decimalToCents(value);
}

/// HTTP edge: reais (number) -> cents (integer). Rounds to the nearest cent so a
/// `12.34` reais payload becomes exactly `1234` cents without float drift.
export function reaisToCents(reais: number): number {
  return new Prisma.Decimal(reais).times(100).toNearest(1).toNumber();
}

/// HTTP edge: cents (integer) -> reais (number, 2 decimals).
export function centsToReais(cents: number): number;
export function centsToReais(cents: number | null): number | null;
export function centsToReais(cents: number | null): number | null {
  if (cents === null) {
    return null;
  }
  return new Prisma.Decimal(cents).dividedBy(100).toNumber();
}
