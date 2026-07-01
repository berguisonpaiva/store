import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, FolderOpen, Home, Mail, Package, Settings, UserRound, Wallet } from 'lucide-react';

import { KineticPage } from '@/components/kinetic-page';
import { auth } from '@/lib/auth';
import { getDefaultHref, getModuleDescription, modules as allModules } from '@/lib/navigation';
import { filterAppModules } from '@/lib/navigation-access';
import { cn } from '@/lib/utils';

const MODULE_ICONS = {
  catalog: FolderOpen,
  inventory: Package,
  sales: Wallet,
  settings: Settings,
} as const;

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const navModules = filterAppModules(allModules, session);
  const displayName = session.user.name?.trim() || 'Usuário';
  const roleLabel = session.user.role ?? (session.roles?.length ? session.roles.join(', ') : '—');
  const email = session.user.email ?? '—';

  return (
    <KineticPage
      title={`Olá, ${displayName}`}
      description="Acesso rápido aos módulos liberados ao seu perfil."
      icon={<Home className="size-5 text-primary" aria-hidden />}
    >
      <div className="flex flex-col gap-8 pt-1">
        <div className="flex flex-col gap-3 border-b border-border/40 pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="size-4 shrink-0 opacity-70" aria-hidden />
            <span className="text-foreground">{roleLabel}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4 shrink-0 opacity-70" aria-hidden />
            <span className="truncate text-foreground/90" title={email}>
              {email}
            </span>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Módulos</h2>
          {navModules.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum módulo disponível para o seu perfil no momento.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {navModules.map((mod) => {
                const Icon = MODULE_ICONS[mod.id as keyof typeof MODULE_ICONS] ?? FolderOpen;
                const href = getDefaultHref(mod);
                return (
                  <li key={mod.id}>
                    <Link
                      href={href}
                      className={cn(
                        'group flex h-full flex-col rounded-xl border border-border/40 bg-card/50 px-4 py-4 transition-colors',
                        'hover:border-border hover:bg-muted/30',
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                          <Icon className="size-4" aria-hidden />
                        </div>
                        <ArrowRight
                          className="size-4 shrink-0 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
                          aria-hidden
                        />
                      </div>
                      <p className="text-sm font-medium text-foreground">{mod.label}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {getModuleDescription(mod.id)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </KineticPage>
  );
}
