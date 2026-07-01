'use client';

import type { ReactNode } from 'react';
import {
  Boxes,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Users,
  WalletCards,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import {
  SidebarMenu,
  type SidebarMenuItem,
  type SidebarMenuSection,
} from '@/components/ui/sidebar-menu';
import { SidebarProvider } from '@/components/ui/sidebar';
import { logoutAction } from './actions';

/**
 * Navegação da aplicação.
 *
 * Os caminhos de navegação fazem parte do ESTADO da aplicação e por isso são
 * definidos aqui na casca client — não em components/. Para alterar o menu
 * (adicionar itens, seções ou reorganizar a estrutura), edite
 * NAVIGATION_SECTIONS abaixo. Cada `href` deve apontar para uma rota dentro do
 * grupo (private).
 */
const HOME_ROUTE = '/dashboard';

type PrivateShellProps = {
  children: ReactNode;
  /**
   * Dados do usuário resolvidos no servidor (layout) e injetados aqui. No
   * layout `simple` sem auth eles chegam vazios e o AdminShell usa os defaults;
   * ao plugar auth, o layout passa os valores reais sem tornar a leitura client.
   */
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
  userRole?: string;
};

/**
 * Flat admin-console navigation (Shopify/Stripe-style): a single unlabeled list
 * of icon-led destinations. There are no section headers — the whole console is
 * one surface. `Usuários` is pinned separately at the bottom via
 * {@link buildFooterItems} (the "settings at the bottom" pattern). ADMIN-only
 * entries carry a `roles` list; hiding them is UX reinforcement (RN04/RN07),
 * never a security boundary — the backend `RolesGuard` and each route's on-load
 * guard are authoritative.
 */
function buildNavigationSections(): SidebarMenuSection[] {
  return [
    {
      id: 'main',
      // No label: this is the single flat primary list of the admin console.
      items: [
        {
          id: 'dashboard',
          label: 'Início',
          href: '/dashboard',
          icon: LayoutDashboard,
          match: 'prefix',
        },
        {
          id: 'vendas',
          label: 'Vendas',
          href: '/vendas',
          icon: ShoppingCart,
          match: 'prefix',
          roles: ['ADMIN'],
        },
        {
          id: 'caixas',
          label: 'Caixas',
          href: '/caixas',
          icon: WalletCards,
          match: 'prefix',
          roles: ['ADMIN'],
        },
        {
          id: 'products',
          label: 'Produtos',
          href: '/products',
          icon: Package,
          match: 'prefix',
          roles: ['ADMIN'],
        },
        {
          id: 'categories',
          label: 'Categorias',
          href: '/categories',
          icon: Tags,
          match: 'prefix',
          roles: ['ADMIN'],
        },
        {
          id: 'inventory-movements',
          label: 'Estoque',
          href: '/inventory/movimentacoes',
          icon: Boxes,
          match: 'prefix',
          roles: ['ADMIN'],
        },
      ],
    },
  ];
}

/**
 * Items pinned to the bottom of the sidebar (visually separated from the
 * primary list). Same `roles` filtering applies.
 */
function buildFooterItems(): SidebarMenuItem[] {
  return [
    {
      id: 'usuarios',
      label: 'Usuários',
      href: '/usuarios',
      icon: Users,
      match: 'prefix',
      roles: ['ADMIN'],
    },
  ];
}

/**
 * Filters footer items by role, mirroring {@link filterSectionsByRole}. An item
 * with a `roles` list is kept only when the current role is included.
 */
function filterItemsByRole(
  items: SidebarMenuItem[],
  role: string | undefined,
): SidebarMenuItem[] {
  return items.filter(
    (item) => !item.roles || (role !== undefined && item.roles.includes(role)),
  );
}

/**
 * Filters navigation by the session role: an item with a `roles` list is kept
 * only when the current role is included; sections that become empty are
 * dropped. This is UX reinforcement only (RN04) — never a security boundary.
 */
function filterSectionsByRole(
  sections: SidebarMenuSection[],
  role: string | undefined,
): SidebarMenuSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || (role !== undefined && item.roles.includes(role)),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/**
 * Casca interativa do grupo (private).
 *
 * Tudo que depende do cliente vive aqui: o Context do SidebarProvider, o
 * handler de logout, e os dados de navegação (que referenciam componentes de
 * ícone). Mantê-los neste módulo `"use client"` é o que permite ao `layout.tsx`
 * permanecer Server Component.
 *
 * O `children` é um slot: páginas server passadas pelo layout continuam server,
 * mesmo entrando "dentro" desta casca client.
 */
export function PrivateShell({
  children,
  userName,
  userEmail,
  userAvatarUrl,
  userRole,
}: PrivateShellProps) {
  const sections = filterSectionsByRole(buildNavigationSections(), userRole);
  const footerItems = filterItemsByRole(buildFooterItems(), userRole);

  return (
    <SidebarProvider defaultOpen>
      <AdminShell
        sidebar={
          <SidebarMenu
            sections={sections}
            footerItems={footerItems}
            homeHref={HOME_ROUTE}
          />
        }
        logoHref={HOME_ROUTE}
        userName={userName}
        userEmail={userEmail}
        userAvatarUrl={userAvatarUrl}
        onLogout={() => logoutAction()}
      >
        {children}
      </AdminShell>
    </SidebarProvider>
  );
}
