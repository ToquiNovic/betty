'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePublicDashboards } from '@/lib/api/dashboards';
import { LandingHeader } from '@/components/landing/landing-header';
import { LandingFooter } from '@/components/landing/landing-footer';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { CardGridSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Input } from '@/components/ui/input';
import { Globe, Search } from 'lucide-react';

export default function ExploreDashboardsPage() {
  const common = useTranslations('common');
  const { dashboards, isLoading } = usePublicDashboards();
  const [search, setSearch] = useState('');

  const filteredDashboards = dashboards.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Globe className="h-3.5 w-3.5" />
            <span>Galería Abierta</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Dashboards Públicos de la Comunidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Explora telemetría en tiempo real de gemelos digitales, simulaciones y sensores compartidos abiertamente.
          </p>
        </div>

        <div className="relative w-full max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${common('search')}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : filteredDashboards.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No hay tableros públicos disponibles"
            description="Cuando los usuarios publiquen dashboards, aparecerán listados aquí."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDashboards.map((dash) => (
              <DashboardCard key={dash.id} dashboard={dash} isPublicView />
            ))}
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
