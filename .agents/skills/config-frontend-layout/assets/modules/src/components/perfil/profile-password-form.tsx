'use client';

import { useActionState } from 'react';
import { KeyRound } from 'lucide-react';

import { changePasswordAction, type ChangePasswordState } from '@/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: ChangePasswordState = {};

export function ProfilePasswordForm({ disabled }: { disabled?: boolean }) {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initial);

  const formKey = state.success ?? 'pending';

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-muted-foreground" role="status">
          {state.success}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="senha-atual">Senha atual</Label>
        <Input
          id="senha-atual"
          name="oldPassword"
          type="password"
          required
          autoComplete="current-password"
          defaultValue=""
          disabled={disabled || isPending}
          className="h-10 rounded-xl border border-input bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha-nova">Nova senha</Label>
        <Input
          id="senha-nova"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          defaultValue=""
          disabled={disabled || isPending}
          className="h-10 rounded-xl border border-input bg-background"
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo (regra alinhada à API).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha-confirmar">Confirmar nova senha</Label>
        <Input
          id="senha-confirmar"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          defaultValue=""
          disabled={disabled || isPending}
          className="h-10 rounded-xl border border-input bg-background"
        />
      </div>

      <Button type="submit" variant="outline" size="sm" className="w-full rounded-xl" disabled={disabled || isPending}>
        <KeyRound className="size-4" aria-hidden />
        {isPending ? 'A alterar…' : 'Alterar senha'}
      </Button>
    </form>
  );
}
