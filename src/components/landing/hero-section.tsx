'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Database, Globe, Radio } from 'lucide-react';

export function HeroSection() {
  const t = useTranslations('landing');

  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary/20 via-cyan-500/10 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-xs font-semibold tracking-wider uppercase border-primary/30 bg-primary/5 text-primary shadow-sm gap-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Radio className="h-3 w-3 text-primary" />
            <span>{t('badge')}</span>
          </Badge>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground max-w-3xl leading-[1.15]">
            {t('heroTitle')}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Button
              render={<Link href="/register" />}
              size="lg"
              className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20 gap-2 hover:scale-[1.02] transition-transform"
            >
              <span>{t('ctaStart')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              render={<Link href="/explore" />}
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base font-semibold border-border/80 hover:bg-muted/50"
            >
              <span>{t('ctaExplore')}</span>
            </Button>
          </div>

          {/* Hero Interactive Metrics Display */}
          <div className="w-full pt-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <Card className="border border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-cyan-500/40 transition-all hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tracking-tight text-foreground">50k+</div>
                    <div className="text-xs text-muted-foreground font-medium">Msg / seg MQTT</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-emerald-500/40 transition-all hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tracking-tight text-foreground">&lt; 5ms</div>
                    <div className="text-xs text-muted-foreground font-medium">Timescale Query</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-indigo-500/40 transition-all hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tracking-tight text-foreground">100%</div>
                    <div className="text-xs text-muted-foreground font-medium">Realtime Push</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-purple-500/40 transition-all hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tracking-tight text-foreground">Dual</div>
                    <div className="text-xs text-muted-foreground font-medium">Físico & Metaverso</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
