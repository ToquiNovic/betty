'use client';

import React from 'react';
import { Dashboard } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ArrowRight, Globe, Lock, Layers } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function DashboardCard({
  dashboard,
  isPublicView = false,
}: {
  dashboard: Dashboard;
  isPublicView?: boolean;
}) {
  const common = useTranslations('common');

  const widgetCount = dashboard.widgets ? dashboard.widgets.length : 0;
  const formattedDate = dashboard.createdAt
    ? formatDistanceToNow(new Date(dashboard.createdAt), { addSuffix: true, locale: es })
    : '';

  const targetUrl = isPublicView
    ? `/explore/${dashboard.id}`
    : `/dashboards/${dashboard.id}`;

  return (
    <Card className="flex flex-col justify-between border shadow-sm hover:shadow-md hover:border-primary/40 transition-all group">
      <CardHeader className="p-5 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold tracking-tight line-clamp-1">
              {dashboard.name}
            </CardTitle>
          </div>

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
        <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
          {dashboard.description || 'Tablero de visualización de telemetría'}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between font-mono bg-muted/40 p-2 rounded text-[11px]">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>{widgetCount} {widgetCount === 1 ? 'Widget' : 'Widgets'}</span>
          </div>
          <span>Creado {formattedDate}</span>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 border-t bg-muted/10 flex justify-end items-center py-3">
        <Button
          render={<Link href={targetUrl} />}
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs h-8 px-2 font-semibold"
        >
          <span>{common('viewDetails')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
