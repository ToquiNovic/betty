'use client';

import React from 'react';
import { DashboardWidget, SensorData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Gauge } from 'lucide-react';

interface GaugeWidgetProps {
  widget: DashboardWidget;
  latestReading?: SensorData;
}

export function GaugeWidget({ widget, latestReading }: GaugeWidgetProps) {
  const metricKey = widget.config?.metricKey || 'value';
  const unit = widget.config?.unit || '%';
  const min = typeof widget.config?.min === 'number' ? widget.config.min : 0;
  const max = typeof widget.config?.max === 'number' ? widget.config.max : 100;

  const reading = latestReading || widget.latestReading;
  const rawValue =
    reading?.payload && typeof reading.payload === 'object'
      ? (reading.payload as Record<string, unknown>)[metricKey]
      : null;

  const numericValue = typeof rawValue === 'number' ? rawValue : null;

  const percentage =
    numericValue !== null
      ? Math.min(Math.max(((numericValue - min) / (max - min)) * 100, 0), 100)
      : 0;

  const getStatusColor = (pct: number) => {
    if (pct >= 85) return 'text-rose-500 bg-rose-500';
    if (pct >= 70) return 'text-amber-500 bg-amber-500';
    return 'text-emerald-500 bg-emerald-500';
  };

  return (
    <Card className="h-full flex flex-col justify-between border border-border/70 shadow-sm bg-card/90 backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-3 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold truncate tracking-tight">{widget.title}</CardTitle>
          <Gauge className="h-3.5 w-3.5 text-primary" />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex flex-col justify-center flex-1 space-y-4 my-auto">
        <div className="text-center space-y-0.5">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
              {numericValue !== null ? numericValue.toFixed(1) : '—'}
            </span>
            {unit && <span className="text-xs font-semibold text-muted-foreground">{unit}</span>}
          </div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{metricKey}</p>
        </div>

        <div className="space-y-1.5 w-full max-w-[200px] mx-auto">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getStatusColor(percentage).split(' ')[1]}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
            <span>{min}</span>
            <span>{percentage.toFixed(0)}%</span>
            <span>{max}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
