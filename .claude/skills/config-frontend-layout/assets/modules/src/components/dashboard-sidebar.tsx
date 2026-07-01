'use client';

import * as React from 'react';
import {
  BarChart3,
  CircleHelp,
  Command,
  Database,
  File,
  FileChartColumn,
  Folder,
  LayoutDashboard,
  List,
  Search,
  Settings2,
  Users,
} from 'lucide-react';

import { NavDocuments } from '@/components/nav-documents';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    { title: 'Dashboard', url: '#', icon: <LayoutDashboard /> },
    { title: 'Lifecycle', url: '#', icon: <List /> },
    { title: 'Analytics', url: '#', icon: <BarChart3 /> },
    { title: 'Projects', url: '#', icon: <Folder /> },
    { title: 'Team', url: '#', icon: <Users /> },
  ],
  navSecondary: [
    { title: 'Settings', url: '#', icon: <Settings2 /> },
    { title: 'Get Help', url: '#', icon: <CircleHelp /> },
    { title: 'Search', url: '#', icon: <Search /> },
  ],
  documents: [
    { name: 'Data Library', url: '#', icon: <Database /> },
    { name: 'Reports', url: '#', icon: <FileChartColumn /> },
    { name: 'Word Assistant', url: '#', icon: <File /> },
  ],
};

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!" render={<a href="#" />}>
              <Command className="size-5!" />
              <span className="text-base font-semibold">Acme Inc.</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
