'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { Activity, ArrowRight, LayoutDashboard, Globe, FileCode } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function LandingHeader() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const { isAuthenticated, isHydrated } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-cyan-500 text-white shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-lg leading-tight text-foreground">
                {common('appName')}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 leading-none">
                PaaS
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono leading-none">
              IoT & Digital Twins
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a
            href="#features"
            className="hover:text-foreground transition-colors hover:bg-muted/40 px-3 py-1.5 rounded-md"
          >
            {t('sensors')}
          </a>
          <a
            href="#how-it-works"
            className="hover:text-foreground transition-colors hover:bg-muted/40 px-3 py-1.5 rounded-md"
          >
            {t('overview')}
          </a>
          <Link
            href="/explore"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors hover:bg-muted/40 px-3 py-1.5 rounded-md text-foreground/90"
          >
            <Globe className="h-3.5 w-3.5 text-cyan-500" />
            <span>{t('publicDashboards')}</span>
          </Link>
          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors hover:bg-muted/40 px-3 py-1.5 rounded-md"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Scalar API</span>
          </a>
        </nav>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          <ThemeToggle />

          {isHydrated && isAuthenticated ? (
            <Button
              render={<Link href="/overview" />}
              size="sm"
              className="gap-2 shadow-sm font-semibold bg-primary hover:bg-primary/90"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{t('overview')}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button render={<Link href="/login" />} variant="ghost" size="sm" className="font-medium">
                <span>{t('login')}</span>
              </Button>
              <Button
                render={<Link href="/register" />}
                size="sm"
                className="shadow-sm font-semibold bg-primary hover:bg-primary/90"
              >
                <span>{t('register')}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
