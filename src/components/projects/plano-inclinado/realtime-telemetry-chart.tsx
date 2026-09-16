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

export interface TelemetryPoint {
  plankAngle?: number;
  servo1?: number;
  target?: number;
  timestamp: number;
}

export interface RealtimeTelemetryChartProps {
  dataHistory: TelemetryPoint[];
}

const chartConfig = {
  plankAngle: {
    label: 'Ángulo Tabla (°)',
    color: 'oklch(0.72 0.18 225)', // Sky blue
  },
  servo1: {
    label: 'Posición Servo (°)',
    color: 'oklch(0.72 0.22 285)', // Purple / Violet
  },
} satisfies ChartConfig;

export function RealtimeTelemetryChart({ dataHistory }: RealtimeTelemetryChartProps) {
  // Mapear historial de puntos a formato del gráfico
  const formattedData = React.useMemo(() => {
    if (dataHistory.length === 0) {
      return Array.from({ length: 40 }, (_, i) => ({
        index: i,
        time: `${i}s`,
        plankAngle: 0,
        servo1: 0,
      }));
    }

    return dataHistory.map((pt, idx) => ({
      index: idx,
      time: `${idx}`,
      plankAngle: Number((pt.plankAngle ?? pt.servo1 ?? 0).toFixed(1)),
      servo1: Number((pt.servo1 ?? 0).toFixed(1)),
    }));
  }, [dataHistory]);

  const lastPoint = dataHistory.length > 0 ? dataHistory[dataHistory.length - 1] : null;
  const latestPlank = lastPoint ? (lastPoint.plankAngle ?? lastPoint.servo1 ?? 0).toFixed(1) : '0.0';
  const latestServo = lastPoint ? (lastPoint.servo1 ?? 0).toFixed(0) : '0';

  return (
    <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              Gráfica en Tiempo Real: Ángulo de Elevación y Posición Servo
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-mono">
              Telemetría continua a 20 Hz | Buffer de {dataHistory.length} muestras
            </p>
          </div>
        </div>

        {/* Leyenda interactiva con valores en vivo */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50" />
            <span className="text-muted-foreground">Ángulo Tabla:</span>
            <strong className="text-sky-400 font-bold">{latestPlank}°</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 border-t-2 border-dashed border-purple-400" />
            <span className="text-muted-foreground">Servo MG996R:</span>
            <strong className="text-purple-400 font-bold">{latestServo}°</strong>
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
                <linearGradient id="fillPlank" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-plankAngle)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-plankAngle)" stopOpacity={0.0} />
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
                domain={[0, 90]}
                tickCount={6}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                unit="°"
              />

              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '2 2' }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(val) => `Muestra #${val}`}
                  />
                }
              />

              {/* Área del Ángulo Real de la Tabla */}
              <Area
                type="monotone"
                dataKey="plankAngle"
                stroke="var(--color-plankAngle)"
                strokeWidth={2.5}
                fill="url(#fillPlank)"
                isAnimationActive={false}
              />

              {/* Línea discontinua de la Posición del Servo */}
              <Line
                type="monotone"
                dataKey="servo1"
                stroke="var(--color-servo1)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
