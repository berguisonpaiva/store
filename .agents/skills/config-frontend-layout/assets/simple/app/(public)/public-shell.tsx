'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PublicBoxedLayout } from '@/components/layout/public-boxed-layout';

/**
 * Casca client do grupo (public).
 *
 * Depende de `usePathname` (hook de browser), por isso é `"use client"`. Fica
 * isolada aqui para que o `layout.tsx` continue Server Component. O `children`
 * é um slot — páginas server passadas pelo layout permanecem server.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === '/join' || pathname.startsWith('/join/');

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return <PublicBoxedLayout>{children}</PublicBoxedLayout>;
}
