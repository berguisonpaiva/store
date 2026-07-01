'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserCircle } from 'lucide-react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { findBestMatch, getDefaultHref, getModulePageTitle, modules as allModules } from '@/lib/navigation';
import { filterAppModules, type NavAccessPayload } from '@/lib/navigation-access';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { AppSidebar } from './app-sidebar';
import Logo from './logo';
import { SiteHeader } from './site-header';

const APP_NAME = 'App';

function headerTitleFromPath(pathname: string, moduleId: string) {
  return getModulePageTitle(moduleId, pathname);
}

function standaloneTitleFromPath(pathname: string) {
  if (pathname === '/home') {
    return 'Home';
  }

  if (pathname === '/perfil') {
    return 'Perfil';
  }

  return APP_NAME;
}

export type AppShellUser = {
  name: string;
  email: string;
  image?: string;
};

export default function AppShell({
  children,
  user,
  navAccess,
}: {
  children: ReactNode;
  user?: AppShellUser;
  /** Dados serializáveis da sessão; o filtro com ícones Lucide corre só no cliente */
  navAccess: NavAccessPayload | null;
}) {
  const pathname = usePathname();
  const navModules = useMemo(() => filterAppModules(allModules, navAccess), [navAccess]);
  const matchFull = findBestMatch(pathname, allModules);
  const matchNav = findBestMatch(pathname, navModules);
  const activeModule = matchNav?.module ?? null;
  const titleModuleId = activeModule?.id ?? matchFull?.module.id ?? null;
  const homeHref = '/home';
  const profileHref = '/perfil';

  return (
    <div className="flex h-screen min-h-0 w-full flex-col bg-surface">
      <TooltipProvider delay={250}>
        <SidebarProvider
          className="flex min-h-0 flex-1 flex-row items-stretch overflow-hidden"
          style={
            {
              '--sidebar-width': '12rem',
              '--sidebar-width-icon': '3rem',
              '--header-height': 'calc(var(--spacing) * 12)',
            } as CSSProperties
          }
        >
          {/* Coluna 1 — rail de ícones dos módulos (fora do Sidebar shadcn) */}
          <aside
            className="relative z-1 flex h-full min-h-0 w-[60px] shrink-0 flex-col bg-surface shadow-[2px_0_12px_-4px_rgb(28_23_18/0.08)]"
            aria-label="Módulos"
          >
            <div className="flex min-h-16 shrink-0 items-center justify-center px-1 py-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      href={homeHref}
                      aria-label="Ir para o módulo inicial"
                      className={cn(
                        'flex w-full items-center justify-center rounded-md bg-surface-container-high transition-all duration-200 hover:shadow-(--shadow-glow-active)',
                        pathname === homeHref && 'shadow-(--shadow-glow-active)',
                      )}
                    >
                      <Logo />
                    </Link>
                  }
                />
                <TooltipContent side="right" sideOffset={8}>
                  Início
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-2">
              {navModules.length === 0 ? (
                <p className="px-1 text-center text-[10px] leading-tight text-on-surface-variant/80">
                  Nenhum módulo disponível para seu perfil.
                </p>
              ) : (
                navModules.map((mod) => {
                  const Icon = mod.icon;
                  const isModuleActive = activeModule?.id === mod.id;
                  const defaultHref = getDefaultHref(mod);
                  return (
                    <Tooltip key={mod.id}>
                      <TooltipTrigger
                        render={
                          <Link
                            href={defaultHref}
                            aria-label={`Abrir módulo ${mod.label}`}
                            className={cn(
                              'relative flex h-11 shrink-0 items-center justify-center rounded-md transition-all duration-200',
                              isModuleActive
                                ? 'bg-surface-container-low shadow-(--shadow-glow-active)'
                                : 'hover:bg-surface-container-low/80',
                            )}
                          >
                            {isModuleActive ? (
                              <span
                                className="absolute top-2 bottom-2 left-0 w-1 rounded-r bg-linear-to-b from-primary to-primary-dim"
                                aria-hidden
                              />
                            ) : null}
                            <Icon
                              className={cn('size-5', isModuleActive ? 'text-primary' : 'text-on-surface-variant/70')}
                              aria-hidden
                            />
                          </Link>
                        }
                      />
                      <TooltipContent side="right" sideOffset={8}>
                        {mod.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })
              )}
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2 bg-surface-container-low/40 py-3">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      href={profileHref}
                      aria-label="Abrir perfil"
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface',
                        pathname === profileHref &&
                          'bg-surface-container-high text-on-surface shadow-(--shadow-glow-active)',
                      )}
                    >
                      <UserCircle className="size-5" aria-hidden />
                    </Link>
                  }
                />
                <TooltipContent side="right" sideOffset={8}>
                  Perfil
                </TooltipContent>
              </Tooltip>
            </div>
          </aside>

          {/* Coluna 2 + 3 — Sidebar shadcn (opções do módulo) + conteúdo */}
          {activeModule ? (
            <>
              <AppSidebar module={activeModule} />
              <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
                <SiteHeader title={headerTitleFromPath(pathname, activeModule.id)} user={user} />
                <div className="min-h-0 flex-1 overflow-auto">{children}</div>
              </SidebarInset>
            </>
          ) : (
            <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
              <SiteHeader
                title={titleModuleId ? headerTitleFromPath(pathname, titleModuleId) : standaloneTitleFromPath(pathname)}
                user={user}
              />
              <div className="min-h-0 flex-1 overflow-auto">{children}</div>
            </SidebarInset>
          )}
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
