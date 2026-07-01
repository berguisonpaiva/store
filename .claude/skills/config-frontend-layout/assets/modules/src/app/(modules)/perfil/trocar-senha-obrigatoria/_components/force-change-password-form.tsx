'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { httpClient } from '@/lib/http-client';
import { translateError } from '@/lib/error-translator';

const forceChangeSchema = z
  .object({
    oldPassword: z.string().min(1, 'Informe a senha temporária recebida do administrador.'),
    newPassword: z
      .string()
      .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
      .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula.')
      .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula.')
      .regex(/[0-9]/, 'Inclua pelo menos um número.')
      .regex(/[^A-Za-z0-9]/, 'Inclua pelo menos um símbolo (ex.: !@#$%).'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas digitadas não coincidem.',
    path: ['confirmPassword'],
  });

type ForceChangeInput = z.infer<typeof forceChangeSchema>;

export interface ForceChangePasswordFormProps {
  userEmail: string;
}

export function ForceChangePasswordForm({ userEmail }: ForceChangePasswordFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ForceChangeInput>({
    resolver: zodResolver(forceChangeSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  function onSubmit(values: ForceChangeInput) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await httpClient({
          path: '/auth/change-password',
          options: {
            method: 'POST',
            body: JSON.stringify({
              oldPassword: values.oldPassword,
              newPassword: values.newPassword,
              confirmPassword: values.confirmPassword,
            }),
          },
        });

        // Força refresh da sessão para que `mustChangePassword=false`
        // chegue ao frontend e o gate do proxy libere a navegação.
        await update();

        toast.success('Senha atualizada.', {
          description: 'Você já pode acessar a plataforma normalmente.',
        });
        router.replace('/home');
      } catch (err) {
        const code =
          err instanceof Error && 'code' in err
            ? String((err as { code?: string }).code ?? err.message)
            : 'UNKNOWN_ERROR';
        const message = translateError(code);
        setSubmitError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Conta: <span className="font-medium">{userEmail}</span>
        </div>
        <FormField
          control={form.control}
          name="oldPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha temporária</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="A senha definida pelo administrador"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" placeholder="Sua nova senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar nova senha</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" placeholder="Repita a nova senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Atualizando senha…' : 'Definir nova senha'}
        </Button>
      </form>
    </Form>
  );
}
