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
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';

interface TelemetryPoint {
  servo1: number;
  target: number;
  timestamp: number;
}

interface RealtimeTelemetryChartProps {
  dataHistory: TelemetryPoint[];
}

const chartConfig = {
  servo1: {
    label: 'Servo 1 (GPIO 18)',
    color: 'oklch(0.72 0.18 225)', // Sky blue
  },
  target: {
    label: 'Ángulo Objetivo',
    color: 'oklch(0.72 0.22 285)', // Purple / Violet
  },
} satisfies ChartConfig;

export function RealtimeTelemetryChart({ dataHistory }: RealtimeTelemetryChartProps) {
  // Map points to chart records with index/time labels
  const formattedData = React.useMemo(() => {
    if (dataHistory.length === 0) {
      // Return flat 0° points if buffer is empty
      return Array.from({ length: 40 }, (_, i) => ({
        index: i,
        time: `${i}s`,
        servo1: 0,
        target: 0,
      }));
    }

    return dataHistory.map((pt, idx) => ({
      index: idx,
      time: `${idx}`,
      servo1: Number(pt.servo1.toFixed(1)),
      target: Number(pt.target.toFixed(1)),
    }));
  }, [dataHistory]);

  const latestServo = dataHistory.length > 0 ? dataHistory[dataHistory.length - 1].servo1.toFixed(1) : '0.0';
  const latestTarget = dataHistory.length > 0 ? dataHistory[dataHistory.length - 1].target.toFixed(1) : '0.0';

  return (
    <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              Gráfica en Tiempo Real: Ángulo de Servos Físicos vs Consigna
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-mono">
              Telemetría continua a 20 Hz | Buffer de {dataHistory.length} muestras
            </p>
          </div>
        </div>

        {/* Legend with live values */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50" />
            <span className="text-muted-foreground">Servo 1:</span>
            <strong className="text-sky-400 font-bold">{latestServo}°</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 border-t-2 border-dashed border-purple-400" />
            <span className="text-muted-foreground">Objetivo:</span>
            <strong className="text-purple-400 font-bold">{latestTarget}°</strong>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="w-full h-[220px]">
          <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillServo1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-servo1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-servo1)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border/40"
                />

                <XAxis
                  dataKey="index"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  hide={true}
                />

                <YAxis
                  domain={[0, 95]}
                  ticks={[0, 20, 40, 60, 80, 90]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(val) => `${val}°`}
                  fontSize={11}
                  className="font-mono text-muted-foreground"
                />

                <ChartTooltip
                  cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(val, name) => (
                        <div className="flex items-center justify-between gap-2 w-full font-mono">
                          <span className="text-muted-foreground">
                            {name === 'servo1' ? 'Servo 1' : 'Consigna'}:
                          </span>
                          <span className="font-bold text-foreground">{val}°</span>
                        </div>
                      )}
                    />
                  }
                />

                {/* Servo 1 Gradient Area */}
                <Area
                  type="monotone"
                  dataKey="servo1"
                  stroke="var(--color-servo1)"
                  strokeWidth={2.2}
                  fill="url(#fillServo1)"
                  dot={false}
                  isAnimationActive={false}
                />

                {/* Target Angle Dashed Line */}
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="var(--color-target)"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
