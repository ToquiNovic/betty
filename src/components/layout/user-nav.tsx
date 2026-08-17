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
import { User, Settings, LogOut, Shield, ChevronsUpDown, FileCode } from 'lucide-react';

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="relative h-12 w-full justify-start gap-2.5 px-2.5 rounded-xl hover:bg-sidebar-accent/80 transition-all group"
          >
            <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border/80 group-hover:ring-primary/40 transition-all">
              <AvatarImage src={user.avatarUrl || ''} alt={user.name} />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col text-left text-xs truncate leading-tight">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-foreground truncate">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" title="Admin" />
                )}
              </div>
              <span className="text-[11px] text-muted-foreground truncate font-mono">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/60 shrink-0 group-hover:text-foreground transition-colors" />
          </Button>
        }
      />
      <DropdownMenuContent className="w-64 p-1.5 shadow-xl border-border/80" align="end" side="top" sideOffset={8}>
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-lg ring-1 ring-border">
              <AvatarImage src={user.avatarUrl || ''} alt={user.name} />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5 truncate">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold leading-tight text-foreground truncate">{user.name}</p>
                {user.role === 'admin' ? (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                    <Shield className="h-2.5 w-2.5 mr-0.5" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0">
                    User
                  </Badge>
                )}
              </div>
              <p className="text-[11px] font-mono leading-none text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer text-xs py-2 rounded-md">
            <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>{t('profile')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer text-xs py-2 rounded-md">
            <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>{t('settings')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <Link href="/docs" className="flex items-center w-full" />
            }
            className="cursor-pointer text-xs py-2 rounded-md"
          >
            <FileCode className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Documentación Developers</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-xs py-2 rounded-md text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
