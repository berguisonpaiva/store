'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { AppLogo } from '@/components/branding/app-logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { loginAction } from './actions';

type FormValues = {
  email: string;
  password: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { email: '', password: '' } });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const result = await loginAction(values);
    // On success the action redirects to /dashboard; only failures return here.
    if (result?.error) {
      toast.error('Email ou senha inválidos.');
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary),transparent_45%)] opacity-10" />

      <Card className="relative w-full max-w-md border-border bg-card/80 p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6">
          <AppLogo size="lg" priority />

          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold">Entrar</h1>
            <p className="text-sm text-muted-foreground">
              Acesse com seu email e senha.
            </p>
          </div>

          <form
            className="flex w-full flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                aria-invalid={!!errors.email}
                {...register('email', {
                  required: 'Informe o email.',
                  pattern: {
                    value: EMAIL_PATTERN,
                    message: 'Email inválido.',
                  },
                })}
              />
              {errors.email && (
                <FormErrorMessage className="mt-1.5">
                  {errors.email.message}
                </FormErrorMessage>
              )}
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                {...register('password', { required: 'Informe a senha.' })}
              />
              {errors.password && (
                <FormErrorMessage className="mt-1.5">
                  {errors.password.message}
                </FormErrorMessage>
              )}
            </div>

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
