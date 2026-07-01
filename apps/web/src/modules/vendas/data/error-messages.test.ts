import { describe, expect, it } from 'vitest';
import {
  INSUFFICIENT_STOCK,
  messageForCode,
  NO_OPEN_CASH_SESSION,
  PAYMENT_MISMATCH,
  resolveSaleErrorState,
  SALE_ALREADY_FINALIZED,
  SALE_NOT_FOUND,
} from './error-messages';

describe('messageForCode', () => {
  it('maps NO_OPEN_CASH_SESSION to a guidance message about opening the cash drawer', () => {
    expect(messageForCode(NO_OPEN_CASH_SESSION)).toMatch(/caixa/i);
  });

  it('maps INSUFFICIENT_STOCK to a stock message', () => {
    expect(messageForCode(INSUFFICIENT_STOCK)).toMatch(/estoque/i);
  });

  it('maps PAYMENT_MISMATCH to a payment message', () => {
    expect(messageForCode(PAYMENT_MISMATCH)).toMatch(/pagamento/i);
  });

  it('maps SALE_ALREADY_FINALIZED and SALE_NOT_FOUND', () => {
    expect(messageForCode(SALE_ALREADY_FINALIZED)).toMatch(/finalizada|concluída/i);
    expect(messageForCode(SALE_NOT_FOUND)).toMatch(/não foi encontrada|encontrada/i);
  });

  it('falls back to a generic message for unknown codes', () => {
    expect(messageForCode('SOMETHING_ELSE')).toMatch(/não foi possível concluir/i);
  });
});

describe('resolveSaleErrorState', () => {
  it('blocks the screen for NO_OPEN_CASH_SESSION', () => {
    expect(resolveSaleErrorState(NO_OPEN_CASH_SESSION)).toBe('blocked');
  });

  it('marks the sale read-only for SALE_ALREADY_FINALIZED', () => {
    expect(resolveSaleErrorState(SALE_ALREADY_FINALIZED)).toBe('read-only');
  });

  it('highlights the item for INSUFFICIENT_STOCK', () => {
    expect(resolveSaleErrorState(INSUFFICIENT_STOCK)).toBe('highlight-item');
  });

  it('keeps finalize blocked for PAYMENT_MISMATCH', () => {
    expect(resolveSaleErrorState(PAYMENT_MISMATCH)).toBe('payment-mismatch');
  });

  it('returns "toast" for any other code', () => {
    expect(resolveSaleErrorState(SALE_NOT_FOUND)).toBe('toast');
    expect(resolveSaleErrorState('WHATEVER')).toBe('toast');
  });
});
