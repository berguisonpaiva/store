import { z } from 'zod';

export const ENTRY_REASON_OPTIONS = [
  { label: 'Compra', value: 'COMPRA' },
  { label: 'Devolucao', value: 'DEVOLUCAO' },
  { label: 'Ajuste', value: 'AJUSTE' },
] as const;

export const EXIT_REASON_OPTIONS = [
  { label: 'Perda', value: 'PERDA' },
  { label: 'Ajuste', value: 'AJUSTE' },
] as const;

export const entryInventorySchema = z.object({
  variacaoId: z.uuid('Selecione uma variacao.'),
  quantidade: z.coerce
    .number({ error: 'Informe uma quantidade valida.' })
    .int('A quantidade deve ser inteira.')
    .positive('A quantidade deve ser maior que zero.'),
  motivo: z.enum(['COMPRA', 'DEVOLUCAO', 'AJUSTE'], {
    error: 'Selecione um motivo.',
  }),
});

export const exitInventorySchema = z
  .object({
    variacaoId: z.uuid('Selecione uma variacao.'),
    quantidade: z.coerce
      .number({ error: 'Informe uma quantidade valida.' })
      .int('A quantidade deve ser inteira.')
      .positive('A quantidade deve ser maior que zero.'),
    motivo: z.enum(['PERDA', 'AJUSTE'], {
      error: 'Selecione um motivo.',
    }),
    saldoDisponivel: z.number().optional(),
  })
  .superRefine((values, ctx) => {
    if (
      typeof values.saldoDisponivel === 'number'
      && values.quantidade > values.saldoDisponivel
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantidade'],
        message: 'A quantidade nao pode exceder o saldo disponivel.',
      });
    }
  });

export const adjustInventorySchema = z.object({
  variacaoId: z.uuid('Selecione uma variacao.'),
  novoSaldo: z.coerce
    .number({ error: 'Informe um saldo valido.' })
    .int('O saldo deve ser inteiro.')
    .min(0, 'O saldo nao pode ser negativo.'),
  observacao: z
    .string()
    .trim()
    .min(1, 'Informe a justificativa do ajuste.'),
});

export const balanceFilterSchema = z.object({
  variacaoId: z.string().trim().optional().default(''),
});

export const movementsFilterSchema = z.object({
  variacaoId: z.string().trim().optional().default(''),
  from: z.string().trim().optional().default(''),
  to: z.string().trim().optional().default(''),
});

export type EntryInventoryFormValues = z.output<typeof entryInventorySchema>;
export type EntryInventoryFormInput = z.input<typeof entryInventorySchema>;
export type ExitInventoryFormValues = z.output<typeof exitInventorySchema>;
export type ExitInventoryFormInput = z.input<typeof exitInventorySchema>;
export type AdjustInventoryFormValues = z.output<typeof adjustInventorySchema>;
export type AdjustInventoryFormInput = z.input<typeof adjustInventorySchema>;
export type BalanceFilterValues = z.output<typeof balanceFilterSchema>;
export type MovementsFilterValues = z.output<typeof movementsFilterSchema>;

export function entryInventoryDefaults(): EntryInventoryFormInput {
  return {
    variacaoId: '',
    quantidade: 1,
    motivo: 'COMPRA',
  };
}

export function exitInventoryDefaults(): ExitInventoryFormInput {
  return {
    variacaoId: '',
    quantidade: 1,
    motivo: 'PERDA',
    saldoDisponivel: undefined,
  };
}

export function adjustInventoryDefaults(): AdjustInventoryFormInput {
  return {
    variacaoId: '',
    novoSaldo: 0,
    observacao: '',
  };
}
