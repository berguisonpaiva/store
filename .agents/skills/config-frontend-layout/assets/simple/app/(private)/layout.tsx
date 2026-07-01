import type { ReactNode } from 'react';
import { PrivateShell } from './private-shell';

/**
 * Layout do grupo (private) — Server Component.
 *
 * Repare: NÃO tem `"use client"`. Toda a interatividade (sidebar, logout,
 * navegação) foi isolada em PrivateShell. Manter o layout no servidor é o que
 * dá a separação correta entre client e server:
 *
 *  - `children` é repassado como slot → páginas server aninhadas continuam
 *    server (o `"use client"` da casca NÃO contamina o conteúdo).
 *  - este arquivo pode fazer trabalho de servidor antes de renderizar a casca.
 *
 * O layout `simple` não tem backend de auth, então aqui apenas repassamos.
 * Ao plugar auth, leia a sessão aqui e injete o usuário real — sem mover essa
 * leitura para o cliente:
 *
 *   import { auth } from "@/lib/auth";
 *   export default async function PrivateGroupLayout({ children }) {
 *     const session = await auth();
 *     const user = session?.user;
 *     return (
 *       <PrivateShell
 *         userName={user?.name ?? undefined}
 *         userEmail={user?.email ?? undefined}
 *         userAvatarUrl={user?.image}
 *       >
 *         {children}
 *       </PrivateShell>
 *     );
 *   }
 */
export default function PrivateGroupLayout({ children }: { children: ReactNode }) {
  return <PrivateShell>{children}</PrivateShell>;
}
