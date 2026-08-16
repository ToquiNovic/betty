'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Radio,
  Zap,
  Database,
  Layers,
  Users,
  LayoutDashboard,
} from 'lucide-react';

export function FeaturesSection() {
  const t = useTranslations('landing');

  const features = [
    {
      icon: Radio,
      title: t('featureMqttTitle'),
      description: t('featureMqttDesc'),
    },
    {
      icon: Zap,
      title: t('featureRealtimeTitle'),
      description: t('featureRealtimeDesc'),
    },
    {
      icon: Database,
      title: t('featureTimescaleTitle'),
      description: t('featureTimescaleDesc'),
    },
    {
      icon: Layers,
      title: t('featureMetaverseTitle'),
      description: t('featureMetaverseDesc'),
    },
    {
      icon: Users,
      title: t('featureTeamsTitle'),
      description: t('featureTeamsDesc'),
    },
    {
      icon: LayoutDashboard,
      title: t('featureDashboardsTitle'),
      description: t('featureDashboardsDesc'),
    },
  ];

  return (
    <section id="features" className="py-20 border-t bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            {t('featuresTitle')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('featuresSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="group relative overflow-hidden border transition-all duration-300 hover:shadow-md hover:border-primary/50"
              >
                <CardHeader className="p-6 space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
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
