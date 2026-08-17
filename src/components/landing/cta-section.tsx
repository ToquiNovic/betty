'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, FileCode, Sparkles, ShieldCheck } from 'lucide-react';

export function CtaSection() {
  const t = useTranslations('landing');

  return (
    <section className="py-20 border-t border-border/60 relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-muted/30">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-gradient-to-r from-primary/20 to-cyan-500/20 blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Comienza Gratis en Minutos</span>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-foreground max-w-3xl mx-auto leading-tight">
          {t('readyCtaTitle')}
        </h2>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t('readyCtaSubtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            render={<Link href="/register" />}
            size="lg"
            className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>{t('ctaStart')}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            render={<Link href="/explore" />}
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base font-semibold border-border/80 hover:bg-muted/60 gap-2 backdrop-blur-sm"
          >
            <Globe className="h-4 w-4 text-cyan-500" />
            <span>{t('ctaExplore')}</span>
          </Button>

          <Button
            render={
              <Link href="/docs" />
            }
            variant="ghost"
            size="lg"
            className="h-12 px-6 text-sm font-medium text-muted-foreground hover:text-foreground gap-2"
          >
            <FileCode className="h-4 w-4" />
            <span>Documentación</span>
          </Button>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Open Source & MIT
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> MQTT 5.0 Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> TimescaleDB Analytics
          </span>
        </div>
      </div>
    </section>
  );
}
