'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { useDashboard, dashboardApi } from '@/lib/api/dashboards';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { WidgetRenderer } from '@/components/dashboard/widget-renderer';
import { AddWidgetDialog } from '@/components/dashboard/add-widget-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Edit,
  Eye,
  Share2,
  Trash2,
  ArrowLeft,
  Globe,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardDetailPage() {
  const t = useTranslations('dashboards');
  const common = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const dashboardId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const { dashboard, isLoading, mutate } = useDashboard(dashboardId);
  const { getReadingForSensor } = useDashboardRealtime(dashboardId);

  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleTogglePublish = async (isPublic: boolean) => {
    try {
      await dashboardApi.togglePublish(dashboardId, isPublic);
      mutate();
      toast.success(isPublic ? 'Tablero publicado para acceso público' : 'Tablero ahora es privado');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      await dashboardApi.deleteWidget(dashboardId, widgetId);
      mutate();
      toast.success('Widget eliminado');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    }
  };

  const handleDeleteDashboard = async () => {
    try {
      await dashboardApi.delete(dashboardId);
      toast.success('Dashboard eliminado');
      router.push('/dashboards');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    }
  };

  const handleShareLink = () => {
    const publicUrl = `${window.location.origin}/explore/${dashboardId}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success('Enlace público copiado al portapapeles');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-muted-foreground">Dashboard no encontrado</p>
        <Button render={<Link href="/dashboards" />} variant="outline">
          <span>{common('back')}</span>
        </Button>
      </div>
    );
  }

  const widgets = dashboard.widgets || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              render={<Link href="/dashboards" />}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{dashboard.name}</h1>

            {dashboard.isPublic ? (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[10px]">
                <Globe className="h-3 w-3" />
                <span>Público</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="border-muted-foreground/30 bg-muted text-muted-foreground gap-1 text-[10px]">
                <Lock className="h-3 w-3" />
                <span>Privado</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground pl-11">
            {dashboard.description || 'Tablero interactivo en tiempo real'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Public switch */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-xs">
            <Label htmlFor="public-toggle" className="text-xs cursor-pointer">
              {dashboard.isPublic ? 'Público' : 'Privado'}
            </Label>
            <Switch
              id="public-toggle"
              checked={dashboard.isPublic}
              onCheckedChange={handleTogglePublish}
            />
          </div>

          {dashboard.isPublic && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="gap-1.5 text-xs h-8"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{t('shareLink')}</span>
            </Button>
          )}

          <AddWidgetDialog dashboardId={dashboardId} onSuccess={() => mutate()} />

          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-1.5 text-xs h-8"
          >
            {isEditMode ? <Eye className="h-3.5 w-3.5" /> : <Edit className="h-3.5 w-3.5" />}
            <span>{isEditMode ? t('viewMode') : t('editMode')}</span>
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-8 w-8"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Widgets Grid */}
      {widgets.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title={t('noWidgets')}
          description="Añade gráficos de series de tiempo, medidores radiales o mapas geográficos vinculados a tus sensores."
        >
          <AddWidgetDialog dashboardId={dashboardId} onSuccess={() => mutate()} />
        </EmptyState>
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
                  isEditMode={isEditMode}
                  onDelete={handleDeleteWidget}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={common('delete')}
        description={t('deleteDashboardConfirm')}
        confirmLabel={common('delete')}
        variant="destructive"
        onConfirm={handleDeleteDashboard}
      />
    </div>
  );
}
