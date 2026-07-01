'use client';

import { useMemo, useTransition } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { formatBRL } from '../data/format';
import { paymentsMatchTotal } from '../data/sale-view';
import {
  buildPagamentosSchema,
  pagamentosDefaults,
  type PagamentosFormValues,
} from '../schemas/vendas.schema';
import type { FinalizarInput, FormaPagamento } from '../data/types';
import { MoneyField } from './money-field';

type PagamentoStepProps = {
  /** Sale total in reais — the sum of payments must equal it to finalize. */
  total: number;
  disabled?: boolean;
  /** Finalization is blocked by the backend on PAYMENT_MISMATCH. */
  onFinalize: (input: FinalizarInput) => Promise<void> | void;
};

const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_DEBITO', label: 'Cartão débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão crédito' },
];

/**
 * Payment step. The finalize button stays disabled until the sum of payments
 * equals the sale `total` (Zod refine), and the backend re-checks with
 * PAYMENT_MISMATCH. All money is in reais and sent to the backend as-is.
 */
export function PagamentoStep({ total, disabled, onFinalize }: PagamentoStepProps) {
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(() => buildPagamentosSchema(total), [total]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PagamentosFormValues>({
    resolver: zodResolver(schema),
    defaultValues: pagamentosDefaults(total),
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'pagamentos' });
  const pagamentos = useWatch({ control, name: 'pagamentos' });
  const somaReais = (pagamentos ?? []).reduce((acc, p) => acc + (p?.valor ?? 0), 0);
  const faltaReais = Math.max(0, Math.round((total - somaReais) * 100) / 100);
  // Gate finalize on a live reais comparison so it's correct on first render
  // (before RHF has run validation once). The backend re-checks PAYMENT_MISMATCH.
  const matchesTotal =
    fields.length > 0 && paymentsMatchTotal((pagamentos ?? []).map((p) => p?.valor ?? 0), total);

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      await onFinalize({ pagamentos: values.pagamentos });
    });
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {fields.map((fieldItem, index) => (
          <div key={fieldItem.id} className="flex items-end gap-2">
            <Controller
              control={control}
              name={`pagamentos.${index}.forma`}
              render={({ field }) => (
                <select
                  aria-label={`Forma de pagamento ${index + 1}`}
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled || isPending}
                >
                  {FORMAS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <div className="flex-1">
              <MoneyField
                control={control}
                name={`pagamentos.${index}.valor`}
                id={`pagamento-${index}`}
                label="Valor"
                disabled={disabled || isPending}
              />
            </div>
            {fields.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover pagamento ${index + 1}`}
                disabled={disabled || isPending}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled || isPending}
        onClick={() => append({ forma: 'DINHEIRO', valor: faltaReais })}
      >
        <Plus className="size-4" />
        Adicionar pagamento
      </Button>

      <dl className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-semibold tabular-nums">{formatBRL(total)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Pago</dt>
          <dd className="font-semibold tabular-nums">{formatBRL(somaReais)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Falta</dt>
          <dd className="font-semibold tabular-nums">{formatBRL(faltaReais)}</dd>
        </div>
      </dl>

      {errors.pagamentos?.root || errors.pagamentos?.message ? (
        <FormErrorMessage>
          {errors.pagamentos.root?.message ?? errors.pagamentos.message}
        </FormErrorMessage>
      ) : null}

      <Button type="submit" disabled={disabled || isPending || !matchesTotal}>
        <CheckCircle2 className="size-4" />
        Finalizar venda
      </Button>
    </form>
  );
}
