'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

import { SessionGuard } from '@/components/session-guard';

export function SessionShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuard />
      {children}
    </SessionProvider>
  );
}
