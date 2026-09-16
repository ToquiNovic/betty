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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from '@/components/ui/sidebar';
import { UserNav } from './user-nav';
import { BettyLogo } from '@/components/common/betty-logo';
import {
  Activity,
  LayoutDashboard,
  Radio,
  LineChart,
  Users,
  ShieldAlert,
  Settings,
  Globe,
  FileCode,
  ExternalLink,
  Database,
  Zap,
  Box,
} from 'lucide-react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sensors } = useSensors();
  const { isConnected } = useSocket();

  const activeSensorsCount = sensors.filter((s) => s.status === 'active').length;

  const mainNav = [
    {
      title: t('overview'),
      url: '/overview',
      icon: LayoutDashboard,
      isActive: pathname === '/overview',
      badge: null,
    },
    {
      title: t('sensors'),
      url: '/sensors',
      icon: Radio,
      isActive: pathname.startsWith('/sensors'),
      badge: sensors.length > 0 ? `${activeSensorsCount}/${sensors.length}` : null,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
    {
      title: t('dashboards'),
      url: '/dashboards',
      icon: LineChart,
      isActive: pathname.startsWith('/dashboards'),
      badge: null,
    },
    {
      title: t('teams'),
      url: '/teams',
      icon: Users,
      isActive: pathname.startsWith('/teams'),
      badge: null,
    },
    {
      title: 'Proyectos',
      url: '/projects',
      icon: Box,
      isActive: pathname.startsWith('/projects'),
      badge: 'IoT DIY',
      badgeColor: 'bg-primary/10 text-primary border-primary/30',
    },
    {
      title: t('digitalTwin'),
      url: '/digital-twin',
      icon: Activity,
      isActive: pathname.startsWith('/digital-twin'),
      badge: 'Plano 2D',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    },
  ];

  const adminNav = [
    {
      title: t('admin'),
      url: '/admin',
      icon: ShieldAlert,
      isActive: pathname === '/admin',
      badge: 'Users',
    },
    {
      title: 'Gestión Proyectos',
      url: '/admin/projects',
      icon: Box,
      isActive: pathname.startsWith('/admin/projects'),
      badge: 'Admin',
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
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80" {...props}>
      {/* Brand Header */}
      <SidebarHeader className="border-b border-border/60 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/overview" />} className="hover:bg-transparent">
              <BettyLogo size="sm" showBadge subtitle="Digital Twins & Realtime" collapseOnSidebar priority />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-4">
        {/* Main Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase px-2 mb-1">
            Plataforma
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={item.isActive}
                    tooltip={item.title}
                    className={`h-9 rounded-lg px-2.5 transition-all text-xs font-medium ${
                      item.isActive
                        ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${item.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span
                        className={`ml-auto text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration Group (Admin only) */}
        {user?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase px-2 mb-1">
              Sistema & Control
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={item.isActive}
                      tooltip={item.title}
                      className={`h-9 rounded-lg px-2.5 transition-all text-xs font-medium ${
                        item.isActive
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10'
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-amber-500" />
                      <span className="truncate">{item.title}</span>
                      <span className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        {item.badge}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Secondary & Links Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase px-2 mb-1">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={item.isActive}
                    tooltip={item.title}
                    className={`h-9 rounded-lg px-2.5 transition-all text-xs font-medium ${
                      item.isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${item.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <Link href="/docs" />
                  }
                  tooltip="Documentación para Desarrolladores"
                  className="h-9 rounded-lg px-2.5 transition-all text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <FileCode className="h-4 w-4 shrink-0 text-primary/80" />
                  <span className="truncate">Docs Desarrolladores</span>
                  <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground/50" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Live System Health Mini-Card (Collapsible Hidden) */}
        <div className="mt-auto pt-2 group-data-[collapsible=icon]:hidden">
          <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <span className="relative flex h-2 w-2">
                  {isConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </span>
                <span>EMQX Broker</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground font-medium">1883</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/40 text-[10px] font-mono text-muted-foreground">
              <div className="flex items-center gap-1">
                <Database className="h-2.5 w-2.5 text-primary" />
                <span>Timescale</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 text-cyan-500" />
                <span>Dragonfly</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-2">
        <UserNav />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
