'use client';

import React, { useState, useMemo } from 'react';
import { SensorData } from '@/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, LineChart as ChartIcon } from 'lucide-react';
import { format } from 'date-fns';

interface SensorDataChartProps {
  data: SensorData[];
  sensorName?: string;
  defaultMetricKey?: string;
}

export function SensorDataChart({
  data,
  sensorName = 'Sensor',
  defaultMetricKey,
}: SensorDataChartProps) {
  // Automatically discover available numeric keys in payload records
  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    data.forEach((item) => {
      if (item.payload && typeof item.payload === 'object') {
        Object.entries(item.payload).forEach(([k, v]) => {
          if (typeof v === 'number') {
            keys.add(k);
          }
        });
      }
    });
    return Array.from(keys);
  }, [data]);

  const [userSelectedKey, setUserSelectedKey] = useState<string | null>(null);

  // Pure derived selected key during render
  const selectedKey =
    userSelectedKey && availableKeys.includes(userSelectedKey)
      ? userSelectedKey
      : defaultMetricKey && availableKeys.includes(defaultMetricKey)
      ? defaultMetricKey
      : availableKeys[0] || 'value';

  // Format data sorted chronologically for chart display
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((item) => {
        const val =
          item.payload && typeof item.payload === 'object'
            ? (item.payload as Record<string, unknown>)[selectedKey]
            : null;

        return {
          time: format(new Date(item.recordedAt), 'HH:mm:ss'),
          timestamp: new Date(item.recordedAt).getTime(),
          value: typeof val === 'number' ? val : null,
          originType: item.originType,
        };
      })
      .filter((d) => d.value !== null);
  }, [data, selectedKey]);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Telemetría de {sensorName}
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Visualización gráfica de series temporales en tiempo real
          </CardDescription>
        </div>

        {availableKeys.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Métrica:</span>
            <Select
              value={selectedKey}
              onValueChange={(val) => {
                if (val) setUserSelectedKey(val);
              }}
            >
              <SelectTrigger className="h-8 w-36 text-xs font-mono">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {availableKeys.map((key) => (
                  <SelectItem key={key} value={key} className="text-xs font-mono">
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 pt-0">
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground rounded-lg border border-dashed bg-muted/20">
            <ChartIcon className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-semibold">Sin lecturas para graficar</p>
            <p className="text-xs">
              Envía telemetría con valores numéricos al topic MQTT del sensor.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={8}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs space-y-1">
                          <p className="font-semibold text-foreground">
                            {selectedKey}: {payload[0].value}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Hora: {p.time}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Origen: {p.originType}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--primary)' }}
                  activeDot={{ r: 5 }}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
