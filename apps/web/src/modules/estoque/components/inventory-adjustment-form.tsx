'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { Textarea } from '@/components/ui/textarea';
import { adjustBalance } from '../data/inventory.actions';
import {
  messageForCode,
  QUANTITY_FIELD_CODE,
  VARIATION_FIELD_CODE,
} from '../data/error-messages';
import type { InventoryVariationOption } from '../data/types';
import {
  adjustInventoryDefaults,
  adjustInventorySchema,
  type AdjustInventoryFormInput,
  type AdjustInventoryFormValues,
} from '../schemas/inventory.schema';
import { VariationLookupField } from './variation-lookup-field';

type InventoryAdjustmentFormProps = {
  variationOptions: InventoryVariationOption[];
  /** When rendered inside a dialog: hide the page header and, on success, call
   * `onSuccess` (close the dialog) in addition to refreshing the data. */
  embedded?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function InventoryAdjustmentForm({
  variationOptions,
  embedded = false,
  onSuccess,
  onCancel,
}: InventoryAdjustmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AdjustInventoryFormInput, undefined, AdjustInventoryFormValues>({
    resolver: zodResolver(adjustInventorySchema),
    defaultValues: adjustInventoryDefaults(),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await adjustBalance(values);
      if (result.ok) {
        toast.success('Ajuste registrado com sucesso.');
        router.refresh();
        onSuccess?.();
        return;
      }

      if (result.code === VARIATION_FIELD_CODE) {
        setError('variacaoId', { message: messageForCode(result.code) });
      }
      if (result.code === QUANTITY_FIELD_CODE) {
        setError('novoSaldo', { message: messageForCode(result.code) });
      }
      toast.error(messageForCode(result.code));
    });
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {embedded ? null : (
        <PageSectionHeader
          title="Ajuste de saldo"
          subtitle="Corrija o saldo absoluto de uma variacao com justificativa obrigatoria."
        />
      )}

      <Card className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Controller
              control={control}
              name="variacaoId"
              render={({ field }) => (
                <VariationLookupField
                  value={field.value}
                  onChange={field.onChange}
                  options={variationOptions}
                  error={errors.variacaoId?.message}
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="adjust-balance">Novo saldo</Label>
            <Input
              id="adjust-balance"
              type="number"
              min={0}
              step={1}
              {...register('novoSaldo')}
              aria-invalid={!!errors.novoSaldo}
            />
            {errors.novoSaldo ? (
              <FormErrorMessage className="mt-1.5">
                {errors.novoSaldo.message}
              </FormErrorMessage>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="adjust-note">Justificativa</Label>
            <Textarea
              id="adjust-note"
              {...register('observacao')}
              aria-invalid={!!errors.observacao}
              placeholder="Explique por que o saldo esta sendo corrigido."
            />
            {errors.observacao ? (
              <FormErrorMessage className="mt-1.5">
                {errors.observacao.message}
              </FormErrorMessage>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        {embedded ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending}>
          <Scale className="size-4" />
          Registrar ajuste
        </Button>
      </div>
    </form>
  );
}
