import { describe, expect, it } from 'vitest';
import {
  computeTotals,
  isSaleReadOnly,
  paymentsMatchTotal,
  resolveDesconto,
} from './sale-view';
import type { VendaOutDTO } from './types';

describe('computeTotals', () => {
  it('computes total as subtotal − desconto (reais)', () => {
    expect(computeTotals(100, 15)).toEqual({ subtotal: 100, desconto: 15, total: 85 });
  });

  it('never lets total go below zero', () => {
    expect(computeTotals(10, 50).total).toBe(0);
  });

  it('treats a missing discount as zero', () => {
    expect(computeTotals(20, 0)).toEqual({ subtotal: 20, desconto: 0, total: 20 });
  });

  it('rounds to 2 decimals (cents precision in reais)', () => {
    expect(computeTotals(10.555, 0).subtotal).toBe(10.56);
  });
});

describe('resolveDesconto', () => {
  it('returns the value (reais) for a "valor" discount', () => {
    expect(resolveDesconto('valor', 15, 100)).toBe(15);
  });

  it('returns a percentage of the subtotal for a "percentual" discount', () => {
    // 10% of 100 reais → 10 reais
    expect(resolveDesconto('percentual', 10, 100)).toBe(10);
  });

  it('clamps a "valor" discount to the subtotal', () => {
    expect(resolveDesconto('valor', 150, 100)).toBe(100);
  });
});

describe('paymentsMatchTotal', () => {
  it('is true when the payments sum (reais) equals the total (reais)', () => {
    expect(paymentsMatchTotal([50, 35], 85)).toBe(true);
  });

  it('absorbs floating-point noise', () => {
    expect(paymentsMatchTotal([0.1, 0.2], 0.3)).toBe(true);
  });

  it('is false when they differ', () => {
    expect(paymentsMatchTotal([50], 85)).toBe(false);
  });
});

describe('isSaleReadOnly', () => {
  const base: VendaOutDTO = {
    id: 'v1',
    numero: 1,
    canal: 'PDV',
    status: 'ABERTA',
    usuarioId: 'u1',
    sessaoCaixaId: 's1',
    subtotal: 10,
    desconto: 0,
    total: 10,
    itens: [],
    pagamentos: [],
  };

  it('is false for an open sale', () => {
    expect(isSaleReadOnly(base)).toBe(false);
  });

  it('is true for a finalized sale', () => {
    expect(isSaleReadOnly({ ...base, status: 'CONCLUIDA' })).toBe(true);
  });

  it('is true for a cancelled sale', () => {
    expect(isSaleReadOnly({ ...base, status: 'CANCELADA' })).toBe(true);
  });
});
