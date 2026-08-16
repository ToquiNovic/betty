'use client';

import React from 'react';
import { DashboardWidget, SensorData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface MetricWidgetProps {
  widget: DashboardWidget;
  latestReading?: SensorData;
}

export function MetricWidget({ widget, latestReading }: MetricWidgetProps) {
  const metricKey = widget.config?.metricKey || 'value';
  const unit = widget.config?.unit || '';

  const reading = latestReading || widget.latestReading;
  const rawValue =
    reading?.payload && typeof reading.payload === 'object'
      ? (reading.payload as Record<string, unknown>)[metricKey]
      : null;

  const displayValue =
    rawValue !== null && rawValue !== undefined
      ? typeof rawValue === 'number'
        ? rawValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : String(rawValue)
      : '—';

  return (
    <Card className="h-full flex flex-col justify-between border border-border/70 shadow-sm bg-card/90 backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-3 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold tracking-tight truncate">
            {widget.title}
          </CardTitle>
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Activity className="h-3 w-3" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3 space-y-3 flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
            {displayValue}
          </span>
          {unit && <span className="text-sm font-semibold text-muted-foreground">{unit}</span>}
        </div>

        {reading && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/30">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(reading.recordedAt), 'HH:mm:ss')}</span>
            </div>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase ${
                reading.originType === 'metaverso'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {reading.originType}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
