'use client';

import React, { useMemo } from 'react';
import { DashboardWidget, SensorData } from '@/types';
import { useSensorData } from '@/lib/api/sensors';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

interface BarChartWidgetProps {
  widget: DashboardWidget;
  latestReading?: SensorData;
}

export function BarChartWidget({ widget, latestReading }: BarChartWidgetProps) {
  const metricKey = widget.config?.metricKey || 'value';
  const unit = widget.config?.unit || '';

  const { data: historicalData } = useSensorData(widget.sensorId, { limit: 15 });

  const chartData = useMemo(() => {
    const all = [...historicalData];
    if (latestReading && !all.some((d) => d.id === latestReading.id)) {
      all.unshift(latestReading);
    }

    return all
      .slice(0, 12)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((item) => {
        const val =
          item.payload && typeof item.payload === 'object'
            ? (item.payload as Record<string, unknown>)[metricKey]
            : null;
        return {
          time: format(new Date(item.recordedAt), 'HH:mm'),
          value: typeof val === 'number' ? val : null,
        };
      })
      .filter((d) => d.value !== null);
  }, [historicalData, latestReading, metricKey]);

  return (
    <Card className="h-full flex flex-col justify-between border shadow-sm">
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold truncate">{widget.title}</CardTitle>
          <span className="text-[10px] font-mono text-muted-foreground">{metricKey} {unit}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-1 min-h-[140px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-xs text-muted-foreground">
            Sin datos para {metricKey}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
              <XAxis dataKey="time" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis fontSize={9} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded border bg-background p-1.5 shadow text-[10px]">
                        <span className="font-semibold">{payload[0].value} {unit}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="value"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
