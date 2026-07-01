'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getAllHrefsFromModule, getLongestActiveHref } from '@/lib/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { AppModule, SubItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function AppSidebar({
  module,
  collapsible = 'icon',
  className,
  ...props
}: ComponentProps<typeof Sidebar> & { module: AppModule }) {
  const pathname = usePathname();
  const ModuleIcon = module.icon;
  const activeHref = getLongestActiveHref(pathname, getAllHrefsFromModule(module));

  return (
    <Sidebar
      collapsible={collapsible}
      {...props}
      className={cn('h-full min-h-0 shrink-0 border-r border-sidebar-border bg-sidebar', className)}
    >
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex items-center gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ModuleIcon className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{module.label}</span>
                  <span className="truncate text-xs text-muted-foreground">Módulo ativo</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {module.groups && module.groups.length > 0 ? (
          module.groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-wider">{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <MenuLink item={item} isActive={activeHref === item.href} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))
        ) : (
          <SidebarGroup>
            <SidebarMenu>
              {module.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <MenuLink item={item} isActive={activeHref === item.href} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function MenuLink({ item, isActive }: { item: SubItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <SidebarMenuButton
      render={<Link href={item.href} title={item.title ?? item.label} />}
      isActive={isActive}
      tooltip={item.label}
      className={cn(
        'transition-all duration-200',
        isActive && 'font-medium text-primary hover:bg-primary/15 hover:text-primary bg-primary/10',
      )}
    >
      <Icon className={cn('size-4', isActive ? 'text-primary' : 'opacity-70')} />
      <span>{item.label}</span>
    </SidebarMenuButton>
  );
}
