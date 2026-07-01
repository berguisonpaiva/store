'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { registrarSangria, registrarSuprimento } from '../data/caixa.actions';
import { messageForCode } from '../data/error-messages';
import {
  movimentacaoDefaults,
  movimentacaoSchema,
  type MovimentacaoFormValues,
} from '../schemas/caixa.schema';
import { MoneyField } from './money-field';

type MovimentacaoKind = 'sangria' | 'suprimento';

type MovimentacaoFormProps = {
  sessaoId: string;
  kind: MovimentacaoKind;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const COPY: Record<MovimentacaoKind, { action: string; success: string }> = {
  sangria: { action: 'Registrar sangria', success: 'Sangria registrada com sucesso.' },
  suprimento: { action: 'Registrar suprimento', success: 'Suprimento registrado com sucesso.' },
};

export function MovimentacaoForm({
  sessaoId,
  kind,
  onSuccess,
  onCancel,
}: MovimentacaoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: movimentacaoDefaults(),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const submit = kind === 'sangria' ? registrarSangria : registrarSuprimento;
      const result = await submit(sessaoId, values);
      if (result.ok) {
        toast.success(COPY[kind].success);
        router.refresh();
        onSuccess?.();
        return;
      }
      toast.error(messageForCode(result.code));
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <MoneyField
        control={control}
        name="valor"
        id={`${kind}-valor`}
        label="Valor"
        error={errors.valor?.message}
        disabled={isPending}
      />

      <div>
        <Label htmlFor={`${kind}-observacao`}>Observação</Label>
        <Textarea
          id={`${kind}-observacao`}
          {...register('observacao')}
          aria-invalid={!!errors.observacao}
          placeholder={
            kind === 'sangria'
              ? 'Explique o motivo da retirada de dinheiro.'
              : 'Explique o motivo do reforço de caixa.'
          }
          disabled={isPending}
        />
        {errors.observacao ? (
          <FormErrorMessage className="mt-1.5">
            {errors.observacao.message}
          </FormErrorMessage>
        ) : null}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {COPY[kind].action}
        </Button>
      </div>
    </form>
  );
}
