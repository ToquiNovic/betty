'use client';

import React, { useMemo } from 'react';
import { DashboardWidget, SensorData } from '@/types';
import { useSensorData } from '@/lib/api/sensors';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

interface LineChartWidgetProps {
  widget: DashboardWidget;
  latestReading?: SensorData;
}

export function LineChartWidget({ widget, latestReading }: LineChartWidgetProps) {
  const metricKey = widget.config?.metricKey || 'value';
  const unit = widget.config?.unit || '';
  const color = widget.config?.color || 'var(--color-primary)';
  const gradientId = `gradient-${widget.id}`;

  const { data: historicalData } = useSensorData(widget.sensorId, { limit: 30 });

  const chartData = useMemo(() => {
    const all = [...historicalData];
    if (latestReading && !all.some((d) => d.id === latestReading.id)) {
      all.unshift(latestReading);
    }

    return all
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((item) => {
        const val =
          item.payload && typeof item.payload === 'object'
            ? (item.payload as Record<string, unknown>)[metricKey]
            : null;
        return {
          time: format(new Date(item.recordedAt), 'HH:mm:ss'),
          value: typeof val === 'number' ? val : null,
        };
      })
      .filter((d) => d.value !== null);
  }, [historicalData, latestReading, metricKey]);

  return (
    <Card className="h-full flex flex-col justify-between border border-border/70 shadow-sm overflow-hidden bg-card/90 backdrop-blur-sm">
      <CardHeader className="p-3 pb-1 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold truncate tracking-tight">{widget.title}</CardTitle>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted text-foreground">
            {metricKey} {unit}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2 flex-1 min-h-[140px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-xs text-muted-foreground">
            Sin datos para {metricKey}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="time" fontSize={9} tickLine={false} axisLine={false} tickMargin={4} />
              <YAxis fontSize={9} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickMargin={4} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background/95 backdrop-blur px-2 py-1 shadow-md text-xs font-mono">
                        <span className="font-semibold text-foreground">
                          {payload[0].value} {unit}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
