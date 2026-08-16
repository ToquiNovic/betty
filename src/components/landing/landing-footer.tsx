'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Activity } from 'lucide-react';
import { Link } from '@/i18n/routing';

export function LandingFooter() {
  const t = useTranslations('landing');
  const common = useTranslations('common');

  return (
    <footer className="border-t bg-muted/20 py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight text-foreground">
              {common('appName')}
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t('footerText')} © {new Date().getFullYear()}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/explore" className="hover:text-foreground transition-colors">
              Dashboards
            </Link>
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              API Reference (Scalar)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
