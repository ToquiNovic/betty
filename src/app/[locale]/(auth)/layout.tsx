import React from 'react';
import { Link } from '@/i18n/routing';
import { Activity } from 'lucide-react';
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
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-lg leading-tight">
              Betty
            </span>
            <span className="text-[10px] text-muted-foreground font-mono leading-none">
              PaaS Platform
            </span>
          </div>
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
        Betty PaaS — IoT & Digital Twins Platform
      </footer>
    </div>
  );
}
