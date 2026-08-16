'use client';

import React from 'react';
import { Sensor } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SensorStatusBadge } from './sensor-status-badge';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Radio, ArrowRight, KeyRound, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function SensorCard({ sensor }: { sensor: Sensor }) {
  const common = useTranslations('common');

  const formattedDate = sensor.createdAt
    ? formatDistanceToNow(new Date(sensor.createdAt), { addSuffix: true, locale: es })
    : '';

  return (
    <Card className="flex flex-col justify-between border shadow-sm hover:shadow-md hover:border-primary/40 transition-all group">
      <CardHeader className="p-5 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Radio className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold tracking-tight line-clamp-1">
              {sensor.name}
            </CardTitle>
          </div>
          <SensorStatusBadge status={sensor.status} />
        </div>
        <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
          {sensor.description || 'Sin descripción'}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between font-mono bg-muted/50 p-2 rounded border">
          <div className="flex items-center gap-1.5 truncate">
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{sensor.apiKeyPrefix}••••••••</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
          <Clock className="h-3 w-3" />
          <span>Registrado {formattedDate}</span>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 border-t bg-muted/10 flex justify-between items-center py-3">
        <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[140px]">
          {sensor.mqttTopic}
        </span>
        <Button
          render={<Link href={`/sensors/${sensor.id}`} />}
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
