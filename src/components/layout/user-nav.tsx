'use client';

import React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRightLeft,
  ChevronsUpDown,
  FileCode,
  LogOut,
  Settings,
  Shield,
  User,
} from 'lucide-react';

export function UserNav() {
  const { user, logout } = useAuthStore();
  const t = useTranslations('nav');
  const router = useRouter();

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSwitchAccount = () => {
    logout();
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    if (
      typeof window !== 'undefined' &&
      window.location.hostname.includes('laboratorio3d.online')
    ) {
      apiUrl = 'https://betty-api.laboratorio3d.online/api';
    }
    window.location.href = `${apiUrl}/auth/ua3d?prompt=login`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="group relative h-11 w-full justify-start gap-2.5 rounded-xl px-2 transition-colors hover:bg-sidebar-accent/80 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          >
            <Avatar className="size-8 shrink-0 rounded-lg ring-1 ring-sidebar-border transition-all group-hover:ring-primary/40">
              <AvatarImage src={user.avatarUrl || ''} alt={user.name} />
              <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-foreground">{user.name}</span>
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                {user.email}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground group-data-[collapsible=icon]:hidden" />
          </Button>
        }
      />
      <DropdownMenuContent
        className="w-64 border-border/80 p-1.5 shadow-xl"
        align="end"
        side="top"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 rounded-lg ring-1 ring-border">
              <AvatarImage src={user.avatarUrl || ''} alt={user.name} />
              <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold leading-tight text-foreground">
                  {user.name}
                </p>
                {user.role === 'admin' ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 px-1 py-0 text-[9px] text-amber-600 dark:text-amber-400"
                  >
                    <Shield className="mr-0.5 size-2.5" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="px-1 py-0 text-[9px]">
                    User
                  </Badge>
                )}
              </div>
              <p className="truncate font-mono text-[11px] leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push('/settings')}
            className="cursor-pointer rounded-md py-2 text-xs"
          >
            <User className="mr-2 size-3.5 text-muted-foreground" />
            <span>{t('profile')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push('/settings')}
            className="cursor-pointer rounded-md py-2 text-xs"
          >
            <Settings className="mr-2 size-3.5 text-muted-foreground" />
            <span>{t('settings')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href="/docs" className="flex w-full items-center" />}
            className="cursor-pointer rounded-md py-2 text-xs"
          >
            <FileCode className="mr-2 size-3.5 text-muted-foreground" />
            <span>Documentación Developers</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={handleSwitchAccount}
          className="cursor-pointer rounded-md py-2 text-xs text-foreground focus:bg-sidebar-accent/80"
        >
          <ArrowRightLeft className="mr-2 size-3.5 text-primary" />
          <span>Cambiar de cuenta</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer rounded-md py-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 size-3.5" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
