'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

type AdminShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
  logoHref?: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
  profileHref?: string;
  onLogout?: () => void;
};

export function AdminShell({
  sidebar,
  children,
  logoHref = '/dashboard',
  userName = 'Usuario',
  userEmail = 'usuario@aplicacao.local',
  userAvatarUrl,
  profileHref = '/join/profile',
  onLogout,
}: AdminShellProps) {
  const router = useRouter();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const resolvedAvatarUrl = userAvatarUrl && failedAvatarUrl !== userAvatarUrl ? userAvatarUrl : null;

  void logoHref;

  return (
    <>
      {sidebar}
      <SidebarInset className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-2 px-2.5 py-1.5">
                  {resolvedAvatarUrl ? (
                    <Image
                      src={resolvedAvatarUrl}
                      alt={`Avatar de ${userName}`}
                      className="size-8 rounded-full border border-border object-cover"
                      onError={() => setFailedAvatarUrl(userAvatarUrl ?? null)}
                      width={32}
                      height={32}
                    />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                      <UserRound className="size-4" />
                    </span>
                  )}

                  <span className="hidden min-w-0 flex-col items-start text-left md:flex">
                    <span className="max-w-35 truncate text-sm leading-4">{userName}</span>
                    <span className="max-w-35 truncate text-xs text-muted-foreground">{userEmail}</span>
                  </span>
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-2">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <Separator className="my-1" />
                <DropdownMenuItem onSelect={() => router.push(profileHref)}>
                  <UserRound className="mr-2 size-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-h-0 flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
