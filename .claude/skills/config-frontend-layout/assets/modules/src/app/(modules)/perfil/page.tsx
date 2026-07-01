import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Fingerprint, Layers, LayoutGrid, Mail, Shield, UserRound } from 'lucide-react';

import { KineticPage } from '@/components/kinetic-page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileNameForm } from '@/components/perfil/profile-name-form';
import { ProfilePasswordForm } from '@/components/perfil/profile-password-form';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/auth';
import { modules as appModules } from '@/lib/navigation';
import { getInitials } from '@/lib/user-display';
import { cn } from '@/lib/utils';

const moduleLabelById = Object.fromEntries(appModules.map((m) => [m.id, m.label]));

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;
  const displayName = user.name?.trim() || 'Usuário';
  const email = user.email?.trim() || '—';
  const avatarSrc = user.image?.trim() || undefined;
  const roleLine = user.role?.trim() || (session.roles?.length ? session.roles.join(', ') : null) || '—';
  const moduleIds = session.modules ?? [];
  const moduleLabels = moduleIds.map((id) => moduleLabelById[id] ?? id);
  const permissionCount = session.permissionAliases?.length ?? 0;
  const isActive = session.status !== 'INACTIVE';

  return (
    <KineticPage title="Perfil" description="Dois cartões à esquerda; senha no cartão da direita.">
      <div className="mx-auto w-full max-w-5xl px-2 pb-4 sm:px-4">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          {/* Coluna esquerda: dois cartões separados */}
          <div className="flex flex-col gap-6">
            {/* Cartão 1 — cabeçalho + nome / e-mail */}
            <Card className="overflow-hidden border-border/60 bg-card shadow-sm">
              <div className="h-28 bg-linear-to-br from-primary/25 via-primary/10 to-muted/80" aria-hidden />
              <CardContent className="relative space-y-6 px-5 pb-6 sm:px-6">
                <div className="-mt-12 flex flex-col items-center sm:items-start">
                  <Avatar className={cn('size-24 border-4 border-card bg-muted shadow-md', 'ring-2 ring-border/60')}>
                    {avatarSrc ? <AvatarImage src={avatarSrc} alt={displayName} /> : null}
                    <AvatarFallback className="text-xl font-semibold text-muted-foreground">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-4 w-full text-center sm:text-left">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">{displayName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{roleLine}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isActive ? 'Conta ativa' : 'Conta inativa'}
                      {moduleIds.length > 0 ? ` · ${moduleIds.length} módulo${moduleIds.length === 1 ? '' : 's'}` : ''}
                    </p>
                  </div>
                </div>
                <Separator className="bg-border/60" />
                <div className="[&_input]:rounded-xl">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Editar identidade
                  </p>
                  <ProfileNameForm defaultName={displayName} email={email} disabled={!isActive} />
                </div>
              </CardContent>
            </Card>

            {/* Cartão 2 — informação (linhas com ícones, estilo referência) */}
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Informação</CardTitle>
                <CardDescription>Dados da conta e permissões (leitura).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow icon={Mail} value={email} className="break-all" />
                <InfoRow icon={Layers} value={`${permissionCount} permissões (aliases)`} />
                <InfoRow
                  icon={Fingerprint}
                  value={
                    <span className="font-mono text-sm" title={user.id}>
                      {user.id.slice(0, 8)}…
                    </span>
                  }
                />
                <Separator className="my-4 bg-border/60" />
                <InfoRow icon={UserRound} value={roleLine} />
                <InfoRow
                  icon={LayoutGrid}
                  value={moduleLabels.length > 0 ? moduleLabels.join(', ') : 'Nenhum módulo associado.'}
                />
              </CardContent>
            </Card>
          </div>

          {/* Coluna direita: cartão só para senha */}
          <Card className="border-border/60 bg-card shadow-sm lg:sticky lg:top-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-primary">
                  <Shield className="size-4" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-lg font-semibold">Alterar senha</CardTitle>
                  <CardDescription>
                    Palavra-passe da sua conta. Para terminar a sessão, use{' '}
                    <span className="font-medium text-foreground">Sair</span> no menu.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ProfilePasswordForm disabled={!isActive} />
            </CardContent>
          </Card>
        </div>
      </div>
    </KineticPage>
  );
}

function InfoRow({ icon: Icon, value, className }: { icon: LucideIcon; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-3 rounded-xl py-3 pl-1 pr-2 transition-colors hover:bg-muted/40', className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">{value}</div>
    </div>
  );
}
