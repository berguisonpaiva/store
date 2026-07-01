'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fecharCaixa } from '../data/caixa.actions';
import {
  messageForCode,
  PENDING_SALE_IN_SESSION,
} from '../data/error-messages';
import { formatBRL } from '../data/format';
import {
  fecharCaixaDefaults,
  fecharCaixaSchema,
  type FecharCaixaFormValues,
} from '../schemas/caixa.schema';
import { MoneyField } from './money-field';

type FecharCaixaFormProps = {
  sessaoId: string;
  /** Expected cash from the session resumo (reais). */
  esperado: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function FecharCaixaForm({
  sessaoId,
  esperado,
  onSuccess,
  onCancel,
}: FecharCaixaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FecharCaixaFormValues>({
    resolver: zodResolver(fecharCaixaSchema),
    defaultValues: fecharCaixaDefaults(),
  });

  // Live divergence: contado (typed) − esperado (from resumo), recomputed on
  // every keystroke before the operator confirms (RF-CX-07).
  const contado = useWatch({ control, name: 'valorFechamento' }) ?? 0;
  const divergencia = contado - esperado;
  const divergenciaTone =
    divergencia === 0
      ? 'text-muted-foreground'
      : divergencia > 0
        ? 'text-emerald-500'
        : 'text-red-500';

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await fecharCaixa(sessaoId, values);
      if (result.ok) {
        toast.success('Caixa fechado com sucesso.');
        router.refresh();
        onSuccess?.();
        return;
      }
      if (result.code === PENDING_SALE_IN_SESSION) {
        toast.error(messageForCode(result.code));
        return;
      }
      toast.error(messageForCode(result.code));
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <MoneyField
        control={control}
        name="valorFechamento"
        id="valor-fechamento"
        label="Valor contado"
        error={errors.valorFechamento?.message}
        disabled={isPending}
      />

      <dl className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Esperado</dt>
          <dd className="font-semibold tabular-nums">{formatBRL(esperado)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Contado</dt>
          <dd className="font-semibold tabular-nums">{formatBRL(contado)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Divergência</dt>
          <dd className={cn('font-semibold tabular-nums', divergenciaTone)}>
            {formatBRL(divergencia)}
          </dd>
        </div>
      </dl>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-red-600 text-white hover:bg-red-600 hover:opacity-90"
          disabled={isPending}
        >
          Fechar caixa
        </Button>
      </div>
    </form>
  );
}
