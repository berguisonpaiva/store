'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

import { hasPermissionAlias } from '@/lib/navigation-access';

/**
 * Hook cliente para conferir aliases de permissão da sessão.
 *
 * `hasAny(...)`/`hasAll(...)` evitam que botões de mutação apareçam para
 * usuários sem o alias correspondente — espelho do `@RequirePermission` no
 * backend. A semântica deve sempre coincidir com `userHasRouteAccess`:
 * alias vazio/undefined → true (sem restrição).
 */
export function usePermission() {
  const { data: session } = useSession();
  const aliases = useMemo(() => new Set(session?.permissionAliases ?? []), [session?.permissionAliases]);

  return useMemo(
    () => ({
      has: (alias: string | undefined) => hasPermissionAlias(Array.from(aliases), alias),
      hasAny: (...required: Array<string | undefined>) =>
        required.some((a) => hasPermissionAlias(Array.from(aliases), a)),
      hasAll: (...required: Array<string | undefined>) =>
        required.every((a) => hasPermissionAlias(Array.from(aliases), a)),
    }),
    [aliases],
  );
}
