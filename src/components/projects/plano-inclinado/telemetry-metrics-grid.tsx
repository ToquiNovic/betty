'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge, Cpu, Target, Scale } from 'lucide-react';

interface TelemetryMetricsGridProps {
  currentAngle: number;
  targetAngle: number;
}

export function TelemetryMetricsGrid({ currentAngle, targetAngle }: TelemetryMetricsGridProps) {
  const servo2Angle = Math.max(0, Math.min(180, 180.0 - currentAngle));
  const rad = (currentAngle * Math.PI) / 180;
  const gravityTorque = Math.max(0, Math.cos(rad)) * 100;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Servo 1 */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Servo 1 (GPIO 18)
            </span>
            <Cpu className="h-3.5 w-3.5 text-sky-500" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-sky-500">
            {currentAngle.toFixed(1)}°
          </div>
          <span className="text-[10px] text-muted-foreground/80">Ángulo rampa real</span>
        </CardContent>
      </Card>

      {/* Servo 2 */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Servo 2 (GPIO 5)
            </span>
            <Cpu className="h-3.5 w-3.5 text-cyan-500" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-cyan-500">
            {servo2Angle.toFixed(1)}°
          </div>
          <span className="text-[10px] text-muted-foreground/80">Invertido por hardware</span>
        </CardContent>
      </Card>

      {/* Target Angle */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Ángulo Objetivo
            </span>
            <Target className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-purple-500">
            {targetAngle.toFixed(0)}°
          </div>
          <span className="text-[10px] text-muted-foreground/80">Consigna deseada</span>
        </CardContent>
      </Card>

      {/* Gravity Torque */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Torque Gravedad
            </span>
            <Scale className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-amber-500">
            {gravityTorque.toFixed(0)}%
          </div>
          <span className="text-[10px] text-muted-foreground/80">
            cos({currentAngle.toFixed(0)}°) × 100
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
