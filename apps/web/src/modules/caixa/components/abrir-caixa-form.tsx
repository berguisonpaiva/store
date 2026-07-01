'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { abrirCaixa } from '../data/caixa.actions';
import { CASH_SESSION_ALREADY_OPEN, messageForCode } from '../data/error-messages';
import {
  abrirCaixaDefaults,
  abrirCaixaSchema,
  type AbrirCaixaFormValues,
} from '../schemas/caixa.schema';
import { MoneyField } from './money-field';

type AbrirCaixaFormProps = {
  /** Whether the current operator may open a cash session. */
  canOperate?: boolean;
};

export function AbrirCaixaForm({ canOperate = true }: AbrirCaixaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AbrirCaixaFormValues>({
    resolver: zodResolver(abrirCaixaSchema),
    defaultValues: abrirCaixaDefaults(),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await abrirCaixa(values);
      if (result.ok) {
        toast.success('Caixa aberto com sucesso.');
        router.refresh();
        return;
      }

      // ALREADY_OPEN means another tab/operator already opened: refresh so the
      // page refetches `/caixa/aberto` and swaps to the active-session panel.
      if (result.code === CASH_SESSION_ALREADY_OPEN) {
        toast.error(messageForCode(result.code));
        router.refresh();
        return;
      }
      toast.error(messageForCode(result.code));
    });
  });

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        title="Abrir caixa"
        subtitle="Informe o valor inicial em dinheiro para abrir a sessão de caixa."
      />

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
            <div className="max-w-xs">
              <MoneyField
                control={control}
                name="valorAbertura"
                id="valor-abertura"
                label="Valor de abertura"
                error={errors.valorAbertura?.message}
                disabled={!canOperate || isPending}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!canOperate || isPending}>
                <LockOpen className="size-4" />
                Abrir caixa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
