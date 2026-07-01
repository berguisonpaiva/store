'use client';

import { useActionState } from 'react';
import { Mail, UserRound } from 'lucide-react';

import { updateProfileNameAction, type ProfileNameState } from '@/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: ProfileNameState = {};

export function ProfileNameForm({
  defaultName,
  email,
  disabled,
}: {
  defaultName: string;
  email: string;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileNameAction, initial);

  return (
    <form action={formAction} className="space-y-4">
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
        <Label htmlFor="perfil-nome">Nome completo</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="perfil-nome"
            name="name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={defaultName}
            disabled={disabled || isPending}
            autoComplete="name"
            className="h-10 rounded-xl border border-input bg-background pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="perfil-email">E-mail</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="perfil-email"
            type="email"
            defaultValue={email}
            readOnly
            tabIndex={-1}
            aria-readonly="true"
            title="O e-mail não pode ser alterado aqui"
            className="h-10 cursor-not-allowed rounded-xl border border-input bg-muted/40 pl-10 text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          O e-mail é definido pelo administrador e não pode ser alterado nesta tela.
        </p>
      </div>

      <Button type="submit" size="sm" disabled={disabled || isPending}>
        {isPending ? 'A guardar…' : 'Guardar nome'}
      </Button>
    </form>
  );
}
