import React from 'react';
import { Link } from '@/i18n/routing';
import { BettyLogo } from '@/components/common/betty-logo';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-muted/20">
      <header className="p-4 sm:p-6 flex items-center justify-between">
        <Link href="/" className="group inline-flex items-center">
          <BettyLogo size="md" subtitle="IoT AEP Platform" priority />
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="p-4 sm:p-6 text-center text-xs text-muted-foreground">
        Betty Platform — IoT Application Enablement Platform
      </footer>
    </div>
  );
}
