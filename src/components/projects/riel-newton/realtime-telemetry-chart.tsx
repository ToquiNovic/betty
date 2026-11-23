'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Activity } from 'lucide-react';

export interface RielTelemetryPoint {
  timeMs: number;
  velocity: number; // m/s
  acceleration: number; // m/s²
  position: number; // m
  force: number; // N
  timestamp: number;
}

export interface RealtimeTelemetryChartProps {
  dataHistory: RielTelemetryPoint[];
}

const chartConfig = {
  velocity: {
    label: 'Velocidad (m/s)',
    color: 'oklch(0.72 0.18 225)', // Sky blue
  },
  acceleration: {
    label: 'Aceleración (m/s²)',
    color: 'oklch(0.72 0.22 45)', // Amber / Orange
  },
} satisfies ChartConfig;

export function RealtimeTelemetryChart({ dataHistory }: RealtimeTelemetryChartProps) {
  const formattedData = React.useMemo(() => {
    if (dataHistory.length === 0) {
      return Array.from({ length: 40 }, (_, i) => ({
        index: i,
        time: `${(i * 0.02).toFixed(2)}s`,
        velocity: 0,
        acceleration: 0,
      }));
    }

    return dataHistory.map((pt, idx) => ({
      index: idx,
      time: `${(pt.timeMs / 1000).toFixed(3)}s`,
      velocity: Number(pt.velocity.toFixed(3)),
      acceleration: Number(pt.acceleration.toFixed(2)),
    }));
  }, [dataHistory]);

  const lastPoint = dataHistory.length > 0 ? dataHistory[dataHistory.length - 1] : null;
  const latestVel = lastPoint ? lastPoint.velocity.toFixed(3) : '0.000';
  const latestAcc = lastPoint ? lastPoint.acceleration.toFixed(2) : '0.00';

  return (
    <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              Gráfica Dinámica: Velocidad (\(v\)) y Aceleración (\(a\)) en Tiempo Real
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-mono">
              Perfil cinemático y adquisición en microsegundos | Muestras: {dataHistory.length}
            </p>
          </div>
        </div>

        {/* Leyenda interactiva con valores en vivo */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50" />
            <span className="text-muted-foreground">Velocidad:</span>
            <strong className="text-sky-400 font-bold">{latestVel} m/s</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 border-t-2 border-dashed border-amber-400" />
            <span className="text-muted-foreground">Aceleración:</span>
            <strong className="text-amber-400 font-bold">{latestAcc} m/s²</strong>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="w-full h-[220px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillVelocity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-velocity)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-velocity)" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />

              <XAxis
                dataKey="index"
                tickLine={false}
                axisLine={false}
                tick={false}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
                className="text-[10px] font-mono"
                width={35}
              />

              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />

              <Area
                type="monotone"
                dataKey="velocity"
                stroke="var(--color-velocity)"
                strokeWidth={2.5}
                fill="url(#fillVelocity)"
              />

              <Line
                type="monotone"
                dataKey="acceleration"
                stroke="var(--color-acceleration)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
