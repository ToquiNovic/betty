'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';
import { useSensors } from '@/lib/api/sensors';
import { useSocket } from '@/components/providers/socket-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { UserNav } from './user-nav';
import { BotutoLogo } from '@/components/common/botuto-logo';
import { cn } from '@/lib/utils';
import {
  Activity,
  Box,
  Compass,
  ExternalLink,
  FileCode,
  Globe,
  LayoutDashboard,
  LineChart,
  Radio,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sensors } = useSensors();
  const { isConnected } = useSocket();

  const isAdmin =
    user?.role === 'admin' ||
    user?.email === 'j.toquica@udla.edu.co' ||
    user?.email === 'danieltoquicadev@gmail.com' ||
    user?.email === 'admin@grid.ua3d.local';

  const activeSensorsCount = sensors.filter((s) => s.status === 'active').length;

  const mainNav = [
    {
      title: t('overview'),
      url: '/overview',
      icon: LayoutDashboard,
      isActive: pathname === '/overview',
    },
    {
      title: t('sensors'),
      url: '/sensors',
      icon: Radio,
      isActive: pathname.startsWith('/sensors'),
      countBadge: sensors.length > 0 ? `${activeSensorsCount}/${sensors.length}` : null,
    },
    {
      title: t('dashboards'),
      url: '/dashboards',
      icon: LineChart,
      isActive: pathname.startsWith('/dashboards'),
    },
    {
      title: t('teams'),
      url: '/teams',
      icon: Users,
      isActive: pathname.startsWith('/teams'),
    },
    {
      title: 'Proyectos',
      url: '/projects',
      icon: Box,
      isActive: pathname.startsWith('/projects'),
    },
    {
      title: t('digitalTwin'),
      url: '/digital-twin',
      icon: Activity,
      isActive: pathname.startsWith('/digital-twin'),
      isLiveIndicator: true,
    },
  ];

  const adminNav = [
    {
      title: 'Panel Admin',
      url: '/admin',
      icon: ShieldAlert,
      isActive: pathname === '/admin',
    },
    {
      title: 'Gestión Proyectos',
      url: '/admin/projects',
      icon: Box,
      isActive: pathname.startsWith('/admin/projects'),
    },
  ];

  const secondaryNav = [
    {
      title: t('publicDashboards'),
      url: '/explore',
      icon: Globe,
      isActive: pathname.startsWith('/explore'),
    },
    {
      title: t('settings'),
      url: '/settings',
      icon: Settings,
      isActive: pathname.startsWith('/settings'),
    },
    {
      title: 'Docs Desarrolladores',
      url: '/docs',
      icon: FileCode,
      isActive: pathname.startsWith('/docs'),
    },
  ];

  const navItemClass = (isActive: boolean, hasBadge = false) =>
    cn(
      'relative h-9 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
      hasBadge && 'pr-12',
      isActive
        ? 'bg-sidebar-accent text-foreground font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary'
        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
    );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border" {...props}>
      {/* Brand Header */}
      <SidebarHeader className="border-b border-sidebar-border/80 px-3 py-2.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/overview" />}
              className="hover:bg-transparent"
            >
              <BotutoLogo
                size="sm"
                showBadge
                subtitle="Digital Twins & Realtime"
                collapseOnSidebar
                priority
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-3 px-2 py-3">
        {/* Main Navigation Group */}
        <SidebarGroup className="p-1">
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-wider text-muted-foreground/75 uppercase">
            Plataforma
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-0.5">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={item.isActive}
                    tooltip={item.title}
                    className={navItemClass(
                      item.isActive,
                      Boolean(item.countBadge || item.isLiveIndicator)
                    )}
                  >
                    <item.icon
                      className={cn(
                        'size-4 shrink-0',
                        item.isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                  {item.countBadge && (
                    <SidebarMenuBadge className="top-2 right-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.countBadge}
                    </SidebarMenuBadge>
                  )}
                  {item.isLiveIndicator && isConnected && (
                    <SidebarMenuBadge
                      className="top-2.5 right-2.5 min-w-0 p-0"
                      aria-label="En vivo"
                    >
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                      </span>
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration Group (Admin only) */}
        {isAdmin && (
          <SidebarGroup className="p-1">
            <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-wider text-muted-foreground/75 uppercase">
              Sistema & Control
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="flex flex-col gap-0.5">
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={item.isActive}
                      tooltip={item.title}
                      className={navItemClass(item.isActive)}
                    >
                      <item.icon
                        className={cn(
                          'size-4 shrink-0',
                          item.isActive ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Secondary & Links Group */}
        <SidebarGroup className="p-1">
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-wider text-muted-foreground/75 uppercase">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-0.5">
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={item.isActive}
                    tooltip={item.title}
                    className={navItemClass(item.isActive)}
                  >
                    <item.icon
                      className={cn(
                        'size-4 shrink-0',
                        item.isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <a
                      href={process.env.NEXT_PUBLIC_UA3D_URL || 'https://laboratorio3d.online'}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  tooltip="Campus Virtual 3D (UA3D Grid)"
                  className={navItemClass(false, true)}
                >
                  <Compass className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">Campus Virtual 3D</span>
                  <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted-foreground/60" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Realtime Connection Status */}
        <div className="mt-auto px-1 pt-2 group-data-[collapsible=icon]:hidden">
          <div className="flex flex-col gap-1.5 rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <span className="relative flex size-2 shrink-0">
                  {isConnected && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={cn(
                      'relative inline-flex size-2 rounded-full',
                      isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                  />
                </span>
                <span className="truncate">
                  {isConnected ? 'Telemetría en vivo' : 'Reconectando...'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {isConnected ? 'WS' : 'OFF'}
              </span>
            </div>
            {isAdmin && (
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                EMQX · TimescaleDB · Dragonfly
              </p>
            )}
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 p-2">
        <UserNav />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
