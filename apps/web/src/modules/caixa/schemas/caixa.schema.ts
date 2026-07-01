import { z } from 'zod';

/**
 * Cash-session form schemas. Money is a number in REAIS (the value stored in the
 * form is `NumericFormat`'s `floatValue`, not the formatted string). A single
 * source of truth for validation + types via `z.infer`.
 */

export const abrirCaixaSchema = z.object({
  valorAbertura: z
    .number({ error: 'Informe o valor de abertura.' })
    .min(0, 'O valor de abertura não pode ser negativo.'),
});

export const movimentacaoSchema = z.object({
  valor: z
    .number({ error: 'Informe o valor.' })
    .positive('O valor deve ser maior que zero.'),
  observacao: z
    .string()
    .trim()
    .min(1, 'Informe a observação.'),
});

export const fecharCaixaSchema = z.object({
  valorFechamento: z
    .number({ error: 'Informe o valor contado.' })
    .min(0, 'O valor contado não pode ser negativo.'),
});

export type AbrirCaixaFormValues = z.output<typeof abrirCaixaSchema>;
export type MovimentacaoFormValues = z.output<typeof movimentacaoSchema>;
export type FecharCaixaFormValues = z.output<typeof fecharCaixaSchema>;

export function abrirCaixaDefaults(): AbrirCaixaFormValues {
  return { valorAbertura: 0 };
}

export function movimentacaoDefaults(): MovimentacaoFormValues {
  return { valor: 0, observacao: '' };
}

export function fecharCaixaDefaults(): FecharCaixaFormValues {
  return { valorFechamento: 0 };
}
