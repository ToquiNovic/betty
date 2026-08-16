'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Radio,
  Zap,
  Database,
  Layers,
  Users,
  LayoutDashboard,
  Cpu,
} from 'lucide-react';

export function FeaturesSection() {
  const t = useTranslations('landing');

  const features = [
    {
      icon: Radio,
      title: t('featureMqttTitle'),
      description: t('featureMqttDesc'),
      pill: 'EMQX 5.8 + SHA-256',
      color: 'from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
    {
      icon: Zap,
      title: t('featureRealtimeTitle'),
      description: t('featureRealtimeDesc'),
      pill: 'Dragonfly Pub/Sub',
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      icon: Database,
      title: t('featureTimescaleTitle'),
      description: t('featureTimescaleDesc'),
      pill: 'PostgreSQL 16 Hypertables',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      icon: Layers,
      title: t('featureMetaverseTitle'),
      description: t('featureMetaverseDesc'),
      pill: 'Physical + 3D Twin',
      color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      icon: Users,
      title: t('featureTeamsTitle'),
      description: t('featureTeamsDesc'),
      pill: 'RBAC 4 Niveles + Tokens',
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      icon: LayoutDashboard,
      title: t('featureDashboardsTitle'),
      description: t('featureDashboardsDesc'),
      pill: '6 Widgets + Open /explore',
      color: 'from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
  ];

  return (
    <section id="features" className="py-24 border-t border-border/60 bg-muted/20 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="h-3.5 w-3.5" />
            <span>Capacidades de la Plataforma</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            {t('featuresTitle')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t('featuresSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="group relative overflow-hidden border border-border/70 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
              >
                <CardHeader className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center border transition-transform group-hover:scale-110 shadow-xs`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono border-border/80">
                      {feature.pill}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
