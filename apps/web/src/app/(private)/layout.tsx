import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PrivateShell } from './private-shell';

/**
 * Layout do grupo (private) — Server Component.
 *
 * Lê a sessão no servidor (NextAuth) e injeta o usuário real na casca client.
 * O guard de rota vive no `proxy.ts`; esta leitura é defesa em profundidade e a
 * fonte dos dados do usuário para o `PrivateShell`.
 */
export default async function PrivateGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/join');
  }

  return (
    <PrivateShell
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
      userRole={session.user.role ?? undefined}
    >
      {children}
    </PrivateShell>
  );
}
