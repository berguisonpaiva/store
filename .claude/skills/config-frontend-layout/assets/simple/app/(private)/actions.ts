'use server';

import { redirect } from 'next/navigation';

const LANDING_ROUTE = '/';

/**
 * Logout via Server Action.
 *
 * Este é o ponto único onde o logout acontece — manter a navegação/efeito aqui
 * (e não no `onClick` do client) deixa o fluxo testável e pronto para auth.
 *
 * O layout `simple` não tem backend de auth, então aqui apenas redirecionamos
 * para a landing. Ao plugar NextAuth, troque o corpo por `signOut` (que já
 * cuida do redirect):
 *
 *   import { signOut } from "@/lib/auth";
 *   export async function logoutAction(): Promise<void> {
 *     await signOut({ redirectTo: LANDING_ROUTE });
 *   }
 */
export async function logoutAction(): Promise<void> {
  redirect(LANDING_ROUTE);
}
