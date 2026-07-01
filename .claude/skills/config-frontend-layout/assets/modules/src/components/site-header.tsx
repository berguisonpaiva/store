'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, CircleUserRound, LogOut } from 'lucide-react';

import { logoutAction } from '@/actions/auth';
import type { AppShellUser } from '@/components/app-shell';
import { getInitials } from '@/lib/user-display';
import { ThemeMenuItems } from './mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SidebarTrigger } from './ui/sidebar';

const profileHref = '/perfil';

export function SiteHeader({ title = 'Dashboard', user }: { title?: string; user?: AppShellUser }) {
  const router = useRouter();
  const pathname = usePathname();

  const displayName = user?.name ?? 'Usuário';
  const displayEmail = user?.email ?? '';
  const avatarSrc = user?.image;

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-border/50 bg-background/80 backdrop-blur-md transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        {pathname !== '/' && pathname !== '/login' && pathname !== '/home' && pathname !== '/perfil' && (
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        )}

        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium text-foreground">{title}</h1>
        </div>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-9 rounded-full px-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                />
              }
            >
              <Avatar size="sm">
                {avatarSrc ? <AvatarImage src={avatarSrc} alt={displayName} /> : null}
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">{displayName}</span>
              <ChevronDown className="size-4 opacity-70" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-2">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(profileHref)}>
                <CircleUserRound />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ThemeMenuItems />
              <DropdownMenuSeparator />
              <form action={logoutAction} className="p-1">
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-auto w-full justify-start gap-2 rounded-sm px-2 py-1.5 text-sm font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-4" />
                  Sair
                </Button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
