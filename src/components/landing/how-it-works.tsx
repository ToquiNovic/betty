'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { KeyRound, Radio, LineChart } from 'lucide-react';

export function HowItWorks() {
  const t = useTranslations('landing');

  const steps = [
    {
      icon: KeyRound,
      number: '01',
      title: t('step1Title'),
      description: t('step1Desc'),
    },
    {
      icon: Radio,
      number: '02',
      title: t('step2Title'),
      description: t('step2Desc'),
    },
    {
      icon: LineChart,
      number: '03',
      title: t('step3Title'),
      description: t('step3Desc'),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-t">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            {t('howItWorksTitle')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('heroSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card key={idx} className="relative border p-6 hover:shadow-md transition-shadow">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-foreground font-semibold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-extrabold text-muted-foreground/30 font-mono">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
