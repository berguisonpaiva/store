import type { ReactNode } from 'react';

import AppShell from '@/components/app-shell';
import { SessionShell } from '@/components/session-shell';
import { auth } from '@/lib/auth';
import type { NavAccessPayload } from '@/lib/navigation-access';

export default async function ModulesLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? 'Usuário',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
      }
    : undefined;

  const navAccess: NavAccessPayload | null = session
    ? {
        status: session.status,
        modules: session.modules,
        permissionAliases: session.permissionAliases,
      }
    : null;

  return (
    <SessionShell>
      <AppShell navAccess={navAccess} user={user}>
        {children}
      </AppShell>
    </SessionShell>
  );
}
