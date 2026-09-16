'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ArrowRight, LayoutDashboard, Globe, FileCode } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { BettyLogo } from '@/components/common/betty-logo';

export function LandingHeader() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const { isAuthenticated, isHydrated } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="group inline-flex items-center">
          <BettyLogo size="md" showBadge subtitle="IoT & Digital Twins" priority />
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
          <Link
            href="/docs"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors hover:bg-muted/40 px-3 py-1.5 rounded-md"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Documentación</span>
          </Link>
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
