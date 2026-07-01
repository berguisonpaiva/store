import { describe, expect, it } from 'vitest';
import {
  addItemSchema,
  buildDescontoSchema,
  buildPagamentosSchema,
  itemQuantidadeSchema,
} from './vendas.schema';

describe('addItemSchema', () => {
  it('accepts an entry term with quantidade > 0', () => {
    const result = addItemSchema.safeParse({ termo: '7891234567890', quantidade: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects an empty entry term', () => {
    expect(addItemSchema.safeParse({ termo: '   ', quantidade: 1 }).success).toBe(false);
  });

  it('rejects quantidade <= 0 or non-integer', () => {
    expect(addItemSchema.safeParse({ termo: 'SKU-1', quantidade: 0 }).success).toBe(false);
    expect(addItemSchema.safeParse({ termo: 'SKU-1', quantidade: -2 }).success).toBe(false);
    expect(addItemSchema.safeParse({ termo: 'SKU-1', quantidade: 1.5 }).success).toBe(false);
  });
});

describe('itemQuantidadeSchema (line quantity, bounded by saldo)', () => {
  it('accepts an integer quantity within the available balance', () => {
    const schema = itemQuantidadeSchema(10);
    expect(schema.safeParse({ quantidade: 1 }).success).toBe(true);
    expect(schema.safeParse({ quantidade: 10 }).success).toBe(true);
  });

  it('rejects quantity <= 0', () => {
    const schema = itemQuantidadeSchema(10);
    expect(schema.safeParse({ quantidade: 0 }).success).toBe(false);
    expect(schema.safeParse({ quantidade: -1 }).success).toBe(false);
  });

  it('rejects a non-integer quantity', () => {
    expect(itemQuantidadeSchema(10).safeParse({ quantidade: 2.5 }).success).toBe(false);
  });

  it('rejects a quantity above the available balance', () => {
    const schema = itemQuantidadeSchema(3);
    expect(schema.safeParse({ quantidade: 4 }).success).toBe(false);
  });

  it('does not bound the quantity when saldo is unknown (null)', () => {
    const schema = itemQuantidadeSchema(null);
    expect(schema.safeParse({ quantidade: 9999 }).success).toBe(true);
  });
});

describe('buildDescontoSchema (bounded by subtotal in reais)', () => {
  it('accepts a "valor" discount within the subtotal', () => {
    const schema = buildDescontoSchema(100);
    expect(schema.safeParse({ tipo: 'valor', valor: 0 }).success).toBe(true);
    expect(schema.safeParse({ tipo: 'valor', valor: 100 }).success).toBe(true);
  });

  it('rejects a "valor" discount greater than the subtotal', () => {
    const schema = buildDescontoSchema(100);
    expect(schema.safeParse({ tipo: 'valor', valor: 150 }).success).toBe(false);
  });

  it('rejects a negative discount value', () => {
    const schema = buildDescontoSchema(100);
    expect(schema.safeParse({ tipo: 'valor', valor: -1 }).success).toBe(false);
  });

  it('accepts a "percentual" discount between 0 and 100', () => {
    const schema = buildDescontoSchema(100);
    expect(schema.safeParse({ tipo: 'percentual', valor: 10 }).success).toBe(true);
    expect(schema.safeParse({ tipo: 'percentual', valor: 100 }).success).toBe(true);
  });

  it('rejects a "percentual" discount greater than 100', () => {
    const schema = buildDescontoSchema(100);
    expect(schema.safeParse({ tipo: 'percentual', valor: 120 }).success).toBe(false);
  });
});

describe('buildPagamentosSchema (sum must equal total in reais)', () => {
  it('accepts payments whose sum equals the total', () => {
    const schema = buildPagamentosSchema(90);
    const result = schema.safeParse({
      pagamentos: [
        { forma: 'DINHEIRO', valor: 50 },
        { forma: 'PIX', valor: 40 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects payments whose sum differs from the total', () => {
    const schema = buildPagamentosSchema(90);
    const result = schema.safeParse({
      pagamentos: [{ forma: 'DINHEIRO', valor: 50 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty payments list', () => {
    const schema = buildPagamentosSchema(90);
    expect(schema.safeParse({ pagamentos: [] }).success).toBe(false);
  });

  it('rejects a payment with a negative value', () => {
    const schema = buildPagamentosSchema(50);
    const result = schema.safeParse({
      pagamentos: [{ forma: 'DINHEIRO', valor: -50 }],
    });
    expect(result.success).toBe(false);
  });
});
