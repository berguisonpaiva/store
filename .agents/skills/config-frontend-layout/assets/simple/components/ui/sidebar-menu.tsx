'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Circle } from 'lucide-react';
import type { ComponentType } from 'react';
import { AppLogo } from '@/components/branding/app-logo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu as ShadcnSidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem as ShadcnSidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

type SidebarIcon = ComponentType<{ className?: string }>;

export type SidebarMenuItem = {
  id: string;
  label: string;
  shortLabel?: string;
  href: string;
  icon?: SidebarIcon;
  match?: 'exact' | 'prefix';
  excludeHrefs?: string[];
};

export type SidebarMenuSection = {
  id: string;
  label?: string;
  items: SidebarMenuItem[];
};

export type SidebarMenuProps = {
  mainItem?: SidebarMenuItem;
  sections: SidebarMenuSection[];
  homeHref?: string;
};

function isItemActive(pathname: string, item: SidebarMenuItem) {
  if (item.excludeHrefs?.some((excludedHref) => pathname === excludedHref || pathname.startsWith(`${excludedHref}/`))) {
    return false;
  }

  if (item.match === 'exact') {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarItemLink({ item, active }: { item: SidebarMenuItem; active: boolean }) {
  const Icon = item.icon ?? Circle;

  return (
    <ShadcnSidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <Icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </ShadcnSidebarMenuItem>
  );
}

function MenuSections({ sections, pathname }: { sections: SidebarMenuSection[]; pathname: string }) {
  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.id}>
          {section.label ? <SidebarGroupLabel>{section.label}</SidebarGroupLabel> : null}
          <SidebarGroupContent>
            <ShadcnSidebarMenu>
              {section.items.map((item) => (
                <SidebarItemLink key={item.id} item={item} active={isItemActive(pathname, item)} />
              ))}
            </ShadcnSidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

/**
 * Menu lateral da aplicação baseado no componente Sidebar do shadcn/ui.
 *
 * Toda a navegação é passada via `sections` pelo layout que renderiza este
 * componente. Os caminhos fazem parte do estado da aplicação e não vivem aqui
 * em components/; este componente apenas adapta a configuração aos primitives
 * do registry.
 */
export function SidebarMenu({ mainItem, sections, homeHref = '/' }: SidebarMenuProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenuButton asChild size="lg" tooltip="Inicio">
          <Link href={homeHref}>
            <AppLogo size="sm" textClassName="group-data-[collapsible=icon]:hidden" priority />
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent>
        {mainItem ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <ShadcnSidebarMenu>
                <SidebarItemLink item={mainItem} active={isItemActive(pathname, mainItem)} />
              </ShadcnSidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <MenuSections sections={sections} pathname={pathname} />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
