'use client';

import type { ReactNode } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { SidebarMenu, type SidebarMenuSection } from '@/components/ui/sidebar-menu';
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
const NAVIGATION_SECTIONS: SidebarMenuSection[] = [
  {
    id: 'main',
    label: 'Navegação',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        match: 'prefix',
      },
    ],
  },
];

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
};

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
export function PrivateShell({ children, userName, userEmail, userAvatarUrl }: PrivateShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AdminShell
        sidebar={<SidebarMenu sections={NAVIGATION_SECTIONS} homeHref={HOME_ROUTE} />}
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
