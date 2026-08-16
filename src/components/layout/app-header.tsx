'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';
import { useSocket } from '@/components/providers/socket-provider';
import { Radio } from 'lucide-react';

export function AppHeader() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const pathname = usePathname();
  const { isConnected } = useSocket();

  // Compute breadcrumb trail from pathname
  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[0] || 'overview';

  const getBreadcrumbTitle = (segment: string) => {
    switch (segment) {
      case 'overview':
        return t('overview');
      case 'sensors':
        return t('sensors');
      case 'dashboards':
        return t('dashboards');
      case 'teams':
        return t('teams');
      case 'admin':
        return t('admin');
      case 'settings':
        return t('settings');
      case 'explore':
        return t('publicDashboards');
      default:
        return segment;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md transition-all">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/overview" className="font-semibold text-xs tracking-wide">
              BETTY
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-xs">
              {getBreadcrumbTitle(currentSegment)}
            </BreadcrumbPage>
          </BreadcrumbItem>
          {segments.length > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground max-w-[140px] truncate">
                  {segments[1]}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-3">
        {/* Realtime Status Indicator */}
        <div
          className={`hidden md:inline-flex items-center gap-2 text-xs font-mono py-1 px-2.5 rounded-full border transition-all ${
            isConnected
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
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
          <Radio className="h-3 w-3" />
          <span className="font-medium">
            {isConnected ? common('connected') : common('disconnected')}
          </span>
        </div>

        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
