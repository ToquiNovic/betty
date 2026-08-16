'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { usePublicDashboard } from '@/lib/api/dashboards';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { LandingHeader } from '@/components/landing/landing-header';
import { LandingFooter } from '@/components/landing/landing-footer';
import { WidgetRenderer } from '@/components/dashboard/widget-renderer';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import { Globe, ArrowLeft, LineChart } from 'lucide-react';

export default function PublicDashboardViewPage() {
  const params = useParams();
  const dashboardId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const { dashboard, isLoading } = usePublicDashboard(dashboardId);
  const { getReadingForSensor } = useDashboardRealtime(dashboardId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <LandingHeader />
        <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <LandingHeader />
        <main className="flex-1 container mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <h2 className="text-xl font-bold">Dashboard no encontrado o no es público</h2>
          <p className="text-xs text-muted-foreground">
            Es posible que el autor haya cambiado la visibilidad a privado.
          </p>
          <Button render={<Link href="/explore" />} variant="outline">
            <span>Volver a la galería</span>
          </Button>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const widgets = dashboard.widgets || [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button
                render={<Link href="/explore" />}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">{dashboard.name}</h1>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[10px]">
                <Globe className="h-3 w-3" />
                <span>Público</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pl-11">
              {dashboard.description || 'Monitoreo de telemetría abierta en tiempo real'}
            </p>
          </div>
        </div>

        {widgets.length === 0 ? (
          <EmptyState
            icon={LineChart}
            title="Sin widgets configurados"
            description="Este tablero aún no tiene visualizaciones activas."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[220px]">
            {widgets.map((widget) => {
              const liveData = getReadingForSensor(widget.sensorId);
              const isWide = widget.widgetType === 'line_chart' || widget.widgetType === 'table';
              return (
                <div
                  key={widget.id}
                  className={isWide ? 'md:col-span-2 lg:col-span-2' : ''}
                >
                  <WidgetRenderer
                    widget={widget}
                    latestReading={liveData}
                    isEditMode={false}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
