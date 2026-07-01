'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { registerEntry } from '../data/inventory.actions';
import {
  messageForCode,
  QUANTITY_FIELD_CODE,
  VARIATION_FIELD_CODE,
} from '../data/error-messages';
import type { InventoryVariationOption } from '../data/types';
import {
  ENTRY_REASON_OPTIONS,
  entryInventoryDefaults,
  entryInventorySchema,
  type EntryInventoryFormInput,
  type EntryInventoryFormValues,
} from '../schemas/inventory.schema';
import { VariationLookupField } from './variation-lookup-field';

type InventoryEntryFormProps = {
  variationOptions: InventoryVariationOption[];
  /** When rendered inside a dialog: hide the page header and, on success, call
   * `onSuccess` (close the dialog) in addition to refreshing the data. */
  embedded?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function InventoryEntryForm({
  variationOptions,
  embedded = false,
  onSuccess,
  onCancel,
}: InventoryEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EntryInventoryFormInput, undefined, EntryInventoryFormValues>({
    resolver: zodResolver(entryInventorySchema),
    defaultValues: entryInventoryDefaults(),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await registerEntry(values);
      if (result.ok) {
        toast.success('Entrada registrada com sucesso.');
        router.refresh();
        onSuccess?.();
        return;
      }

      if (result.code === VARIATION_FIELD_CODE) {
        setError('variacaoId', { message: messageForCode(result.code) });
      }
      if (result.code === QUANTITY_FIELD_CODE) {
        setError('quantidade', { message: messageForCode(result.code) });
      }
      toast.error(messageForCode(result.code));
    });
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {embedded ? null : (
        <PageSectionHeader
          title="Entrada de estoque"
          subtitle="Registre compras, devolucoes e reforcos de saldo para uma variacao."
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
            <Label htmlFor="entry-quantity">Quantidade</Label>
            <Input
              id="entry-quantity"
              type="number"
              min={1}
              step={1}
              {...register('quantidade')}
              aria-invalid={!!errors.quantidade}
            />
            {errors.quantidade ? (
              <FormErrorMessage className="mt-1.5">
                {errors.quantidade.message}
              </FormErrorMessage>
            ) : null}
          </div>

          <div>
            <Label htmlFor="entry-reason">Motivo</Label>
            <select
              id="entry-reason"
              {...register('motivo')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {ENTRY_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
          <ArrowDownToLine className="size-4" />
          Registrar entrada
        </Button>
      </div>
    </form>
  );
}
