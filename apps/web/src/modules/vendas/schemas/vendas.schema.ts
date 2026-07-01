import { z } from 'zod';

/**
 * PDV sale form schemas. Money values handled by the forms are in REAIS (the
 * value stored is `NumericFormat`'s `floatValue`); the data layer converts to
 * the integer cents the backend expects. A single source of truth for
 * validation + types via `z.infer`.
 */

export type DescontoTipo = 'valor' | 'percentual';

/** Item-entry form: a single term (SKU / barcode / picked variation id) + qty. */
export const addItemSchema = z.object({
  termo: z.string().trim().min(1, 'Informe o SKU, código de barras ou nome do produto.'),
  quantidade: z
    .number({ error: 'Informe a quantidade.' })
    .int('A quantidade deve ser um número inteiro.')
    .positive('A quantidade deve ser maior que zero.'),
});

export type AddItemFormValues = z.output<typeof addItemSchema>;

export function addItemDefaults(): AddItemFormValues {
  return { termo: '', quantidade: 1 };
}

/**
 * Per-line quantity schema, bounded by the known available balance (`saldo`).
 * Pass `null` when the balance is unknown so the upper bound is not enforced.
 */
export function itemQuantidadeSchema(saldo: number | null) {
  return z.object({
    quantidade: z
      .number({ error: 'Informe a quantidade.' })
      .int('A quantidade deve ser um número inteiro.')
      .positive('A quantidade deve ser maior que zero.')
      .refine(
        (value) => saldo == null || value <= saldo,
        saldo == null ? '' : `Quantidade acima do saldo disponível (${saldo}).`,
      ),
  });
}

export type ItemQuantidadeFormValues = { quantidade: number };

/**
 * Discount schema. The discount can never be greater than the subtotal:
 * `valor` is bounded by the subtotal (reais) and `percentual` by 100%.
 */
export function buildDescontoSchema(subtotal: number) {
  return z
    .object({
      tipo: z.enum(['valor', 'percentual']),
      valor: z
        .number({ error: 'Informe o desconto.' })
        .min(0, 'O desconto não pode ser negativo.'),
    })
    .refine(
      (data) => (data.tipo === 'valor' ? data.valor <= subtotal : data.valor <= 100),
      {
        path: ['valor'],
        message: 'O desconto não pode ser maior que o subtotal.',
      },
    );
}

export type DescontoFormValues = z.output<ReturnType<typeof buildDescontoSchema>>;

export function descontoDefaults(): DescontoFormValues {
  return { tipo: 'valor', valor: 0 };
}

/**
 * Payments schema. Finalization is only allowed when the sum of payments equals
 * the sale `total` (reais). A tiny epsilon absorbs floating-point noise.
 */
export function buildPagamentosSchema(total: number) {
  return z
    .object({
      pagamentos: z
        .array(
          z.object({
            forma: z.enum(['DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO']),
            valor: z
              .number({ error: 'Informe o valor do pagamento.' })
              .min(0, 'O valor do pagamento não pode ser negativo.'),
          }),
        )
        .min(1, 'Adicione ao menos uma forma de pagamento.'),
    })
    .refine(
      (data) => {
        const sum = data.pagamentos.reduce((acc, p) => acc + p.valor, 0);
        return Math.abs(sum - total) < 0.005;
      },
      {
        path: ['pagamentos'],
        message: 'A soma dos pagamentos deve ser igual ao total da venda.',
      },
    );
}

export type PagamentosFormValues = z.output<ReturnType<typeof buildPagamentosSchema>>;

export function pagamentosDefaults(total: number): PagamentosFormValues {
  return { pagamentos: [{ forma: 'DINHEIRO', valor: total }] };
}
