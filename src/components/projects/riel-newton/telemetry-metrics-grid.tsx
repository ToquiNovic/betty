'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Timer,
  Ruler,
  Gauge,
  Zap,
  Activity,
  Target,
  Flame,
  Scale,
} from 'lucide-react';

export interface RielTelemetryMetricsGridProps {
  transitTimeSeconds?: number;
  distanceMeters?: number;
  averageVelocity?: number;
  finalVelocity?: number;
  acceleration?: number;
  netForce?: number;
  kineticEnergy?: number;
  momentum?: number;
  isConnected?: boolean;
}

export function TelemetryMetricsGrid({
  transitTimeSeconds = 0,
  distanceMeters = 0.475,
  averageVelocity = 0,
  finalVelocity = 0,
  acceleration = 0,
  netForce = 0,
  kineticEnergy = 0,
  momentum = 0,
  isConnected = false,
}: RielTelemetryMetricsGridProps) {
  return (
    <div className="space-y-3">
      {/* Fila 1: Cinemática (Tiempo, Distancia, Velocidad Media, Velocidad Final) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tiempo de Tránsito */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-sky-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Tiempo (Δt)
              </span>
              <Timer className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-sky-400">
              {transitTimeSeconds > 0 ? `${transitTimeSeconds.toFixed(3)}s` : '0.000s'}
            </div>
            <span className="text-[10px] text-muted-foreground/80">
              {transitTimeSeconds > 0
                ? `${(transitTimeSeconds * 1000).toFixed(0)} ms desde S1 a meta`
                : 'Esperando disparo...'}
            </span>
          </CardContent>
        </Card>

        {/* Distancia de Carrera */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-blue-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Carrera (d)
              </span>
              <Ruler className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-blue-400">
              {(distanceMeters * 100).toFixed(1)} cm
            </div>
            <span className="text-[10px] text-muted-foreground/80">
              {distanceMeters.toFixed(3)} m guía lineal
            </span>
          </CardContent>
        </Card>

        {/* Velocidad Promedio */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-teal-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Velocidad Media
              </span>
              <Gauge className="h-3.5 w-3.5 text-teal-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-teal-400">
              {averageVelocity.toFixed(3)} <span className="text-sm font-semibold">m/s</span>
            </div>
            <span className="text-[10px] text-muted-foreground/80 font-mono">
              v_avg = d / Δt
            </span>
          </CardContent>
        </Card>

        {/* Velocidad Final de Impacto */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-emerald-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Velocidad Final
              </span>
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-400">
              {finalVelocity.toFixed(3)} <span className="text-sm font-semibold">m/s</span>
            </div>
            <span className="text-[10px] text-muted-foreground/80">Llegada a sensor FSR</span>
          </CardContent>
        </Card>
      </div>

      {/* Fila 2: Dinámica Clásica (Aceleración, Fuerza Neta F=m·a, Energía Cinética, Momento) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Aceleración Media */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-amber-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Aceleración (a)
              </span>
              <Activity className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-amber-400">
              {acceleration.toFixed(3)} <span className="text-sm font-semibold">m/s²</span>
            </div>
            <span className="text-[10px] text-muted-foreground/80 font-mono">
              a = Δv / Δt
            </span>
          </CardContent>
        </Card>

        {/* Fuerza Neta (F = m·a) */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-rose-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Fuerza Neta (F)
              </span>
              <Target className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-rose-400">
              {netForce.toFixed(4)} <span className="text-sm font-semibold">N</span>
            </div>
            <span className="text-[10px] text-muted-foreground/80 font-mono">Segunda Ley: F = m · a</span>
          </CardContent>
        </Card>

        {/* Energía Cinética (Ek) */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-orange-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Energía (Ek)
              </span>
              <Flame className="h-3.5 w-3.5 text-orange-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-orange-400">
              {kineticEnergy.toFixed(4)} <span className="text-sm font-semibold">J</span>
            </div>
            <span className="text-[10px] text-muted-foreground/80 font-mono">
              Ek = ½ · m · v_final²
            </span>
          </CardContent>
        </Card>

        {/* Cantidad de Movimiento (p = m·v) */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-violet-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Momento (p)
              </span>
              <Scale className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-violet-400">
              {momentum.toFixed(4)} <span className="text-sm font-semibold">N·s</span>
            </div>
            <span className="text-[10px] text-muted-foreground/80 font-mono">
              p = m · v
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
