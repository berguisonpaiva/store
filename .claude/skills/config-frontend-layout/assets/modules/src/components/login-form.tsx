'use client';

import { useActionState, useEffect, useState } from 'react';
import { ArrowRight, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import { loginAction, type LoginState } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showErrorToast, showWarningToast } from '@/lib/error-toast';

const initialState: LoginState = {};

export function LoginForm({ inactiveNotice = false }: { inactiveNotice?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (!state.error) return;

    showErrorToast(state.error, {
      title: 'Falha no login',
      fallbackMessage: 'Verifique seus dados e tente novamente.',
    });
  }, [state]);

  useEffect(() => {
    if (!inactiveNotice) return;

    showWarningToast('Sua conta está inativa', {
      description: 'Entre em contato com o administrador ou use outro usuário.',
    });
  }, [inactiveNotice]);

  return (
    <form className="mt-8 space-y-4" action={formAction}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          E-mail
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            autoComplete="email"
            required
            className="h-12 rounded-xl border-border/70 bg-background pl-11 pr-4 text-sm shadow-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password" className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Senha
          </Label>
          <Link href="#" className="text-xs text-muted-foreground transition hover:text-foreground">
            Esqueci minha senha
          </Link>
        </div>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite sua senha"
            autoComplete="current-password"
            required
            className="h-12 rounded-xl border-border/70 bg-background pl-11 pr-4 text-sm shadow-none"
          />
        </div>
      </div>

      <Label htmlFor="remember" className="gap-3 pt-1 text-sm font-normal text-muted-foreground">
        <Checkbox id="remember" name="remember" />
        Manter conectado
      </Label>

      <Button
        type="submit"
        size="lg"
        className="mt-2 h-12 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground"
        disabled={isPending}
      >
        {isPending ? 'Entrando...' : 'Entrar'}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
