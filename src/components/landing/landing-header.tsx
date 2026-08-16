'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { Activity, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function LandingHeader() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const { isAuthenticated, isHydrated } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-lg leading-tight">
              {common('appName')}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono leading-none">
              IoT & Digital Twins
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            {t('sensors')}
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            {t('overview')}
          </a>
          <Link href="/explore" className="hover:text-foreground transition-colors">
            {t('publicDashboards')}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          <ThemeToggle />

          {isHydrated && isAuthenticated ? (
            <Button
              render={<Link href="/overview" />}
              size="sm"
              className="gap-1.5 shadow-sm"
            >
              <span>{t('overview')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button render={<Link href="/login" />} variant="ghost" size="sm">
                <span>{t('login')}</span>
              </Button>
              <Button render={<Link href="/register" />} size="sm" className="shadow-sm">
                <span>{t('register')}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
