'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDashboards } from '@/lib/api/dashboards';
import { PageHeader } from '@/components/common/page-header';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { CreateDashboardDialog } from '@/components/dashboard/create-dashboard-dialog';
import { CardGridSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Input } from '@/components/ui/input';
import { LineChart, Search } from 'lucide-react';

export default function DashboardsPage() {
  const t = useTranslations('dashboards');
  const common = useTranslations('common');
  const { dashboards, isLoading, mutate } = useDashboards();
  const [search, setSearch] = useState('');

  const filteredDashboards = dashboards.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')}>
        <CreateDashboardDialog onSuccess={() => mutate()} />
      </PageHeader>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={common('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : filteredDashboards.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="No tienes dashboards creados"
          description="Crea tu primer tablero y añade medidores, gráficos y mapas interactivos."
        >
          <CreateDashboardDialog onSuccess={() => mutate()} />
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dash) => (
            <DashboardCard key={dash.id} dashboard={dash} />
          ))}
        </div>
      )}
    </div>
  );
}
