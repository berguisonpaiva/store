'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowUpFromLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import type { InventoryBalanceDTO, InventoryVariationOption } from '../data/types';
import { registerExit } from '../data/inventory.actions';
import {
  INSUFFICIENT_STOCK_CODE,
  messageForCode,
  QUANTITY_FIELD_CODE,
  VARIATION_FIELD_CODE,
} from '../data/error-messages';
import {
  EXIT_REASON_OPTIONS,
  exitInventoryDefaults,
  exitInventorySchema,
  type ExitInventoryFormInput,
  type ExitInventoryFormValues,
} from '../schemas/inventory.schema';
import { VariationLookupField } from './variation-lookup-field';

type InventoryExitFormProps = {
  variationOptions: InventoryVariationOption[];
  balancesByVariationId: Record<string, InventoryBalanceDTO | undefined>;
  /** When rendered inside a dialog: hide the page header and, on success, call
   * `onSuccess` (close the dialog) in addition to refreshing the data. */
  embedded?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function InventoryExitForm({
  variationOptions,
  balancesByVariationId,
  embedded = false,
  onSuccess,
  onCancel,
}: InventoryExitFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ExitInventoryFormInput, undefined, ExitInventoryFormValues>({
    resolver: zodResolver(exitInventorySchema),
    defaultValues: exitInventoryDefaults(),
  });

  const variationId = useWatch({ control, name: 'variacaoId' });
  const selectedBalance = variationId ? balancesByVariationId[variationId] : undefined;

  useEffect(() => {
    setValue('saldoDisponivel', selectedBalance?.saldoDisponivel);
  }, [selectedBalance?.saldoDisponivel, setValue]);

  const onSubmit = handleSubmit(({ saldoDisponivel: _saldoDisponivel, ...values }) => {
    startTransition(async () => {
      const result = await registerExit(values);
      if (result.ok) {
        toast.success('Saida registrada com sucesso.');
        router.refresh();
        onSuccess?.();
        return;
      }

      if (result.code === VARIATION_FIELD_CODE) {
        setError('variacaoId', { message: messageForCode(result.code) });
      }
      if (
        result.code === QUANTITY_FIELD_CODE
        || result.code === INSUFFICIENT_STOCK_CODE
      ) {
        setError('quantidade', { message: messageForCode(result.code) });
      }
      toast.error(messageForCode(result.code));
    });
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {embedded ? null : (
        <PageSectionHeader
          title="Saida manual"
          subtitle="Lancamento de perdas ou baixas manuais com validacao de saldo disponivel."
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
                  description="Ao selecionar uma variacao, o saldo disponivel e exibido abaixo."
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="exit-quantity">Quantidade</Label>
            <Input
              id="exit-quantity"
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
            <Label htmlFor="exit-reason">Motivo</Label>
            <select
              id="exit-reason"
              {...register('motivo')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {EXIT_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-border/80 bg-muted/25 p-4 text-sm text-muted-foreground">
          {selectedBalance ? (
            <p>
              Saldo disponivel atual: <span className="font-semibold text-foreground">{selectedBalance.saldoDisponivel}</span>
            </p>
          ) : (
            <p>Selecione uma variacao para consultar o saldo disponivel antes de registrar a saida.</p>
          )}
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        {embedded ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending}>
          <ArrowUpFromLine className="size-4" />
          Registrar saida
        </Button>
      </div>
    </form>
  );
}
