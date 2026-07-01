import type { Session } from 'next-auth';

import { findNavItemForPathname, type AppModule, type SubItem } from '@/lib/navigation';
import type { UserAccountStatus } from '@/types/next-auth';

/**
 * Fatia da sessão necessária para filtrar a navegação — só primitivos/array,
 * segura para passar de Server Component → Client Component.
 */
export type NavAccessPayload = {
  status?: UserAccountStatus;
  modules?: string[];
  permissionAliases?: string[];
};

/**
 * Navegação só para contas ativas. `undefined` trata-se como ativo (API pode omitir status).
 */
export function isUserNavEnabled(session: { status?: UserAccountStatus } | null): boolean {
  if (!session) return false;
  if (session.status === 'INACTIVE') return false;
  return true;
}

/**
 * Se `required` estiver vazio, o item só depende do módulo (útil em migração).
 * Caso contrário, o alias deve existir em `permissions[].alias` do perfil.
 */
export function hasPermissionAlias(aliases: string[] | undefined, required: string | undefined): boolean {
  const r = required?.trim();
  if (!r) return true;
  const set = new Set(aliases ?? []);
  return set.has(r);
}

function filterSubItems(items: SubItem[], permissionAliases: string[]): SubItem[] {
  return items.filter((item) => hasPermissionAlias(permissionAliases, item.requiredPermissionAlias));
}

/**
 * Filtra módulos e itens segundo sessão (módulos permitidos + aliases).
 */
/**
 * Indica se a sessão pode acessar a rota (módulo habilitado + alias da rota).
 * Rotas fora do mapa de navegação (ex.: `/home`, `/perfil`) retornam true.
 */
export function userHasRouteAccess(pathname: string, session: Session | NavAccessPayload | null): boolean {
  if (!session || !isUserNavEnabled(session)) return false;

  const nav = findNavItemForPathname(pathname);
  if (!nav) return true;

  const moduleIds = new Set(session.modules ?? []);
  if (!moduleIds.has(nav.module.id)) return false;

  return hasPermissionAlias(session.permissionAliases, nav.item.requiredPermissionAlias);
}

export function filterItemsByRouteAccess<T extends { href: string }>(
  items: readonly T[],
  session: Session | NavAccessPayload | null,
): T[] {
  return items.filter((item) => userHasRouteAccess(item.href, session));
}

export function filterAppModules(all: AppModule[], session: Session | NavAccessPayload | null): AppModule[] {
  if (!session || !isUserNavEnabled(session)) return [];

  const moduleIds = new Set(session.modules ?? []);
  const permissionAliases = session.permissionAliases ?? [];

  const out: AppModule[] = [];
  for (const mod of all) {
    if (!moduleIds.has(mod.id)) continue;

    const items = filterSubItems(mod.items, permissionAliases);
    const groups = mod.groups
      ?.map((g) => ({
        ...g,
        items: filterSubItems(g.items, permissionAliases),
      }))
      .filter((g) => g.items.length > 0);

    const hasItems = items.length > 0;
    const hasGroups = groups && groups.length > 0;
    if (!hasItems && !hasGroups) continue;

    out.push({
      ...mod,
      items,
      groups: hasGroups ? groups : undefined,
    });
  }
  return out;
}
