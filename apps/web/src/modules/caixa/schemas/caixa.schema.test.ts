import { describe, expect, it } from 'vitest';
import {
  abrirCaixaSchema,
  fecharCaixaSchema,
  movimentacaoSchema,
} from './caixa.schema';

describe('abrirCaixaSchema', () => {
  it('accepts valorAbertura >= 0', () => {
    expect(abrirCaixaSchema.safeParse({ valorAbertura: 0 }).success).toBe(true);
    expect(abrirCaixaSchema.safeParse({ valorAbertura: 150.5 }).success).toBe(true);
  });

  it('rejects a negative valorAbertura', () => {
    const result = abrirCaixaSchema.safeParse({ valorAbertura: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects a missing/non-number valorAbertura', () => {
    expect(abrirCaixaSchema.safeParse({}).success).toBe(false);
    expect(
      abrirCaixaSchema.safeParse({ valorAbertura: 'x' as unknown as number }).success,
    ).toBe(false);
  });
});

describe('movimentacaoSchema', () => {
  it('accepts valor > 0 with a non-empty observacao', () => {
    const result = movimentacaoSchema.safeParse({ valor: 10, observacao: 'reforço' });
    expect(result.success).toBe(true);
  });

  it('rejects valor <= 0', () => {
    expect(movimentacaoSchema.safeParse({ valor: 0, observacao: 'x' }).success).toBe(false);
    expect(movimentacaoSchema.safeParse({ valor: -5, observacao: 'x' }).success).toBe(false);
  });

  it('rejects an empty or whitespace-only observacao', () => {
    expect(movimentacaoSchema.safeParse({ valor: 10, observacao: '' }).success).toBe(false);
    expect(movimentacaoSchema.safeParse({ valor: 10, observacao: '   ' }).success).toBe(false);
  });
});

describe('fecharCaixaSchema', () => {
  it('accepts valorFechamento >= 0', () => {
    expect(fecharCaixaSchema.safeParse({ valorFechamento: 0 }).success).toBe(true);
    expect(fecharCaixaSchema.safeParse({ valorFechamento: 999.99 }).success).toBe(true);
  });

  it('rejects a negative valorFechamento', () => {
    expect(fecharCaixaSchema.safeParse({ valorFechamento: -0.01 }).success).toBe(false);
  });
});
