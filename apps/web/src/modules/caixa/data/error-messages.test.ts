import { describe, expect, it } from 'vitest';
import {
  CASH_SESSION_ALREADY_CLOSED,
  CASH_SESSION_ALREADY_OPEN,
  CASH_SESSION_NOT_FOUND,
  messageForCode,
  PENDING_SALE_IN_SESSION,
} from './error-messages';

describe('messageForCode', () => {
  it('maps CASH_SESSION_ALREADY_OPEN to a blocking message', () => {
    expect(messageForCode(CASH_SESSION_ALREADY_OPEN)).toMatch(/caixa aberto/i);
  });

  it('maps PENDING_SALE_IN_SESSION to the "há venda aberta" warning', () => {
    expect(messageForCode(PENDING_SALE_IN_SESSION)).toMatch(/venda aberta/i);
  });

  it('maps CASH_SESSION_NOT_FOUND and CASH_SESSION_ALREADY_CLOSED', () => {
    expect(messageForCode(CASH_SESSION_NOT_FOUND)).toMatch(/não foi encontrada/i);
    expect(messageForCode(CASH_SESSION_ALREADY_CLOSED)).toMatch(/já foi fechado/i);
  });

  it('falls back to a generic message for unknown codes', () => {
    expect(messageForCode('SOMETHING_ELSE')).toMatch(/não foi possível concluir/i);
  });
});
