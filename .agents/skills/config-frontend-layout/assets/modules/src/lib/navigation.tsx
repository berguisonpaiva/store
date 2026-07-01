import type { LucideIcon } from 'lucide-react';
import { CircleDollarSign, FolderOpen, LayoutDashboard, Package, Settings } from 'lucide-react';

/**
 * `requiredPermissionAlias` = `permissions[].alias` do perfil (ex.: `catalog.category.read`).
 * IDs de módulo = `modules[].id` da API (`catalog`, `settings`, `inventory`, `sales`);
 * `href` mantém URLs em PT (`/cadastro`, …).
 */
export type SubItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  title?: string;
  /** Alias da API; opcional para itens só com regra de módulo (ex.: dashboard). */
  requiredPermissionAlias?: string;
};

export type AppModule = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: SubItem[];
  groups?: { label: string; items: SubItem[] }[];
};

/**
 * Scaffold com 4 módulos, cada um só com o Dashboard inicial.
 *
 * Para adicionar um item de menu, acrescente um `SubItem` ao array `items` do módulo
 * e crie a página correspondente em `app/(modules)/<rota>/page.tsx`. Ex.:
 *
 *   { label: "Categorias", href: "/cadastro/categorias", icon: Tags,
 *     requiredPermissionAlias: "catalog.category.read" }
 *
 * `requiredPermissionAlias` é validado contra os aliases da sessão; itens sem alias
 * dependem só do módulo estar habilitado. Veja navigation-access.ts.
 */
export const modules: AppModule[] = [
  {
    id: 'catalog',
    label: 'Cadastro',
    icon: FolderOpen,
    items: [
      {
        label: 'Dashboard',
        href: '/cadastro',
        icon: LayoutDashboard,
        requiredPermissionAlias: 'catalog.module.view',
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Estoque',
    icon: Package,
    items: [
      {
        label: 'Dashboard',
        href: '/estoque',
        icon: LayoutDashboard,
        requiredPermissionAlias: 'inventory.module.view',
      },
    ],
  },
  {
    id: 'sales',
    label: 'Financeiro',
    icon: CircleDollarSign,
    items: [
      {
        label: 'Dashboard',
        href: '/financeiro',
        icon: LayoutDashboard,
        requiredPermissionAlias: 'sales.module.view',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Configuração',
    icon: Settings,
    items: [
      {
        label: 'Dashboard',
        href: '/configuracao',
        icon: LayoutDashboard,
        requiredPermissionAlias: 'settings.module.view',
      },
    ],
  },
];

const moduleDescriptions: Record<string, string> = {
  settings: 'Usuários, perfis e permissões.',
  catalog: 'Categorias, insumos e produtos.',
  inventory: 'Saldos e movimentações.',
  sales: 'Visão financeira e importação de vendas.',
};

export function getModuleDescription(moduleId: string): string {
  return moduleDescriptions[moduleId] ?? 'Módulo do sistema.';
}

/** Resolve o título pelo `pathname` real (ids de módulo são da API; rotas podem ser `/cadastro`, …). */
export function getModulePageTitle(moduleId: string, pathname: string): string {
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) return 'Módulo';

  const collect = [...mod.items, ...(mod.groups?.flatMap((g) => g.items) ?? [])];
  let best: { label: string; len: number } | null = null;
  for (const item of collect) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      const len = item.href.length;
      if (!best || len > best.len) best = { label: item.label, len };
    }
  }
  if (best) return best.label;
  return mod.label;
}

export function getAllHrefsFromModule(module: AppModule): string[] {
  const hrefs: string[] = [];
  for (const item of module.items) {
    hrefs.push(item.href);
  }
  if (module.groups) {
    for (const group of module.groups) {
      for (const item of group.items) {
        hrefs.push(item.href);
      }
    }
  }
  if (hrefs.length === 0) {
    hrefs.push(`/${module.id}`);
  }
  return hrefs;
}

/**
 * Resolve o item de menu (e módulo) cujo `href` casa com o path (prefixo mais longo).
 * Usado em ACL (ex.: middleware) alinhado a `filterAppModules`.
 */
export function findNavItemForPathname(pathname: string): { module: AppModule; item: SubItem } | null {
  const match = findBestMatch(pathname, modules);
  if (!match) return null;

  const collect: SubItem[] = [...match.module.items, ...(match.module.groups?.flatMap((g) => g.items) ?? [])];
  const item = collect.find((i) => i.href === match.activeHref);
  if (!item) return null;
  return { module: match.module, item };
}

export function findBestMatch(
  pathname: string,
  moduleList: AppModule[],
): { module: AppModule; activeHref: string } | null {
  let best: { module: AppModule; href: string; len: number } | null = null;
  for (const m of moduleList) {
    for (const href of getAllHrefsFromModule(m)) {
      if (pathname === href || pathname.startsWith(`${href}/`)) {
        if (!best || href.length > best.len) {
          best = { module: m, href, len: href.length };
        }
      }
    }
  }
  return best ? { module: best.module, activeHref: best.href } : null;
}

export function getDefaultHref(module: AppModule): string {
  const hrefs = getAllHrefsFromModule(module);
  return hrefs[0] ?? `/${module.id}`;
}

export function getLongestActiveHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const h of hrefs) {
    if (pathname === h || pathname.startsWith(`${h}/`)) {
      if (!best || h.length > best.length) {
        best = h;
      }
    }
  }
  return best;
}

export const moduleIds = new Set(modules.map((m) => m.id));
