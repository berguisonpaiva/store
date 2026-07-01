'use server';

import { signOut } from '@/lib/auth';

const LANDING_ROUTE = '/';

/**
 * Logout via Server Action — encerra a sessão NextAuth e redireciona para a
 * landing. `signOut` cuida do redirect.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: LANDING_ROUTE });
}
