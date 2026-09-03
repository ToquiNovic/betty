'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Activity } from 'lucide-react';

interface TelemetryPoint {
  servo1: number;
  target: number;
  timestamp: number;
}

interface RealtimeTelemetryChartProps {
  dataHistory: TelemetryPoint[];
}

export function RealtimeTelemetryChart({ dataHistory }: RealtimeTelemetryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Clear background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, width, height);

    // Grid lines (Horizontal: 0°, 20°, 40°, 60°, 80°, 100°)
    const maxDeg = 100;
    const minDeg = 0;
    const stepDeg = 20;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let deg = minDeg; deg <= maxDeg; deg += stepDeg) {
      const y = paddingTop + plotHeight - ((deg - minDeg) / (maxDeg - minDeg)) * plotHeight;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(`${deg}°`, paddingLeft - 8, y);
    }

    // Vertical grid lines
    const numCols = 6;
    for (let c = 0; c <= numCols; c++) {
      const x = paddingLeft + (c / numCols) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();
    }

    if (dataHistory.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('Esperando datos de telemetría...', width / 2, height / 2);
      return;
    }

    const totalPoints = dataHistory.length;

    // 1. Draw Target Angle Line (Purple dashed)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    dataHistory.forEach((pt, idx) => {
      const x = paddingLeft + (idx / (totalPoints - 1)) * plotWidth;
      const y =
        paddingTop +
        plotHeight -
        ((Math.max(0, Math.min(100, pt.target)) - minDeg) / (maxDeg - minDeg)) * plotHeight;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Servo 1 Real Angle (Sky Blue with gradient fill)
    const lineGrad = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
    lineGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    lineGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    ctx.beginPath();
    dataHistory.forEach((pt, idx) => {
      const x = paddingLeft + (idx / (totalPoints - 1)) * plotWidth;
      const y =
        paddingTop +
        plotHeight -
        ((Math.max(0, Math.min(100, pt.servo1)) - minDeg) / (maxDeg - minDeg)) * plotHeight;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    // Stroke line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Fill under line
    const lastX = paddingLeft + plotWidth;
    const firstX = paddingLeft;
    const bottomY = height - paddingBottom;
    ctx.lineTo(lastX, bottomY);
    ctx.lineTo(firstX, bottomY);
    ctx.closePath();
    ctx.fillStyle = lineGrad;
    ctx.fill();

    // Latest value dot
    const latest = dataHistory[dataHistory.length - 1];
    const latestX = paddingLeft + plotWidth;
    const latestY =
      paddingTop +
      plotHeight -
      ((Math.max(0, Math.min(100, latest.servo1)) - minDeg) / (maxDeg - minDeg)) * plotHeight;

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(latestX, latestY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [dataHistory]);

  return (
    <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              Gráfica en Tiempo Real: Ángulo de Servos Físicos vs Consigna
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-mono">
              Frecuencia de telemetría: 20 Hz | Buffer de 80 muestras continuas
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            <span className="text-muted-foreground">Servo 1 (GPIO 18)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3.5 border-t-2 border-dashed border-purple-400" />
            <span className="text-muted-foreground">Ángulo Objetivo</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1">
        <div className="relative w-full rounded-lg overflow-hidden border border-border/60 bg-slate-950">
          <canvas
            ref={canvasRef}
            width={720}
            height={220}
            className="w-full h-[180px] sm:h-[220px] block"
          />
        </div>
      </CardContent>
    </Card>
  );
}
