'use client';

import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buildDescontoSchema,
  descontoDefaults,
  type DescontoFormValues,
} from '../schemas/vendas.schema';
import type { DescontoInput } from '../data/types';

type DescontoControlProps = {
  /** Sale subtotal in reais — the upper bound for a `valor` discount. */
  subtotal: number;
  disabled?: boolean;
  onApply: (input: DescontoInput) => Promise<void> | void;
};

/**
 * Discount control: pick `valor`/`percentual` and a value `≥ 0`, never greater
 * than the subtotal (Zod-validated against the subtotal in reais).
 */
export function DescontoControl({ subtotal, disabled, onApply }: DescontoControlProps) {
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(() => buildDescontoSchema(subtotal), [subtotal]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DescontoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: descontoDefaults(),
  });

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      await onApply({ tipo: values.tipo, valor: values.valor });
    });
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <Label htmlFor="venda-desconto-valor">Desconto</Label>
      <div className="flex items-start gap-2">
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <select
              aria-label="Tipo de desconto"
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              value={field.value}
              onChange={field.onChange}
              disabled={disabled || isPending}
            >
              <option value="valor">R$</option>
              <option value="percentual">%</option>
            </select>
          )}
        />
        <Input
          id="venda-desconto-valor"
          type="number"
          min={0}
          step="0.01"
          className="w-32"
          disabled={disabled || isPending}
          aria-invalid={!!errors.valor}
          {...register('valor', { valueAsNumber: true })}
        />
        <Button type="submit" variant="outline" disabled={disabled || isPending}>
          Aplicar
        </Button>
      </div>
      {errors.valor ? <FormErrorMessage>{errors.valor.message}</FormErrorMessage> : null}
    </form>
  );
}
