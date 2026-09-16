'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge, Cpu, Target, Scale, Zap, ShieldCheck, Activity, MoveDown } from 'lucide-react';

export interface TelemetryMetricsGridProps {
  plankAngle?: number;
  servo1Angle?: number;
  slipAngle?: number;
  frictionCoeff?: number;
  sensorCubePresent?: boolean;
  angularVelocity?: number;
  normalForceRatio?: number;
  parallelForceRatio?: number;
  isConnected?: boolean;
  // Compatibilidad hacia atrás
  currentAngle?: number;
  targetAngle?: number;
}

export function TelemetryMetricsGrid({
  plankAngle,
  servo1Angle,
  slipAngle = 0,
  frictionCoeff = 0,
  sensorCubePresent = true,
  angularVelocity = 0,
  normalForceRatio,
  parallelForceRatio,
  isConnected = false,
  currentAngle = 0,
  targetAngle = 0,
}: TelemetryMetricsGridProps) {
  const actualPlank = plankAngle ?? currentAngle;
  const actualServo = servo1Angle ?? currentAngle;

  const rad = (actualPlank * Math.PI) / 180;
  const norm = normalForceRatio ?? Math.cos(rad);
  const slide = parallelForceRatio ?? Math.sin(rad);

  return (
    <div className="space-y-3">
      {/* Fila 1: Cinemática Angular & Fricción */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Ángulo Real Tabla */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-sky-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Ángulo Tabla (θ)
              </span>
              <Gauge className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-sky-400">
              {actualPlank.toFixed(1)}°
            </div>
            <span className="text-[10px] text-muted-foreground/80">Inclinación real madera</span>
          </CardContent>
        </Card>

        {/* Posición Servomotores */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-purple-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Posición Servo
              </span>
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-purple-400">
              {actualServo.toFixed(0)}°
            </div>
            <span className="text-[10px] text-muted-foreground/80">Eje físico MG996R (0-180°)</span>
          </CardContent>
        </Card>

        {/* Ángulo Crítico de Deslizamiento */}
        <Card className={`border shadow-xs transition-colors ${
          slipAngle > 0 
            ? 'border-amber-500/60 bg-amber-500/5 dark:bg-amber-500/10' 
            : 'border-border/80 bg-card/70'
        }`}>
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Ángulo Crítico (θc)
              </span>
              <Target className={`h-3.5 w-3.5 ${slipAngle > 0 ? 'text-amber-400' : 'text-muted-foreground'}`} />
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight ${
              slipAngle > 0 ? 'text-amber-400' : 'text-muted-foreground'
            }`}>
              {slipAngle > 0 ? `${slipAngle.toFixed(1)}°` : '--'}
            </div>
            <span className="text-[10px] text-muted-foreground/80">Punto de deslizamiento</span>
          </CardContent>
        </Card>

        {/* Coeficiente de Fricción Estática */}
        <Card className={`border shadow-xs transition-colors ${
          slipAngle > 0 
            ? 'border-purple-500/60 bg-purple-500/5 dark:bg-purple-500/10' 
            : 'border-border/80 bg-card/70'
        }`}>
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Coef. Fricción (μs)
              </span>
              <Scale className={`h-3.5 w-3.5 ${slipAngle > 0 ? 'text-purple-400' : 'text-muted-foreground'}`} />
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight ${
              slipAngle > 0 ? 'text-purple-400' : 'text-muted-foreground'
            }`}>
              {slipAngle > 0 ? frictionCoeff.toFixed(4) : '--'}
            </div>
            <span className="text-[10px] text-muted-foreground/80">μs = tan(θc)</span>
          </CardContent>
        </Card>
      </div>

      {/* Fila 2: Sensor Infrarrojo & Dinámica de Fuerzas Newtonianas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Sensor de Cubo (DO - Pin 4) */}
        <Card className={`border shadow-xs transition-colors ${
          !isConnected
            ? 'border-border/80 bg-card/70'
            : sensorCubePresent 
            ? 'border-emerald-500/50 bg-emerald-500/5' 
            : 'border-rose-500/60 bg-rose-500/10 animate-pulse'
        }`}>
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Sensor Óptico DO
              </span>
              <ShieldCheck className={`h-3.5 w-3.5 ${
                !isConnected
                  ? 'text-muted-foreground'
                  : sensorCubePresent ? 'text-emerald-400' : 'text-rose-400'
              }`} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${
                !isConnected
                  ? 'bg-amber-500/60'
                  : sensorCubePresent ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`} />
              <span className={`text-lg font-black font-mono tracking-tight ${
                !isConnected
                  ? 'text-amber-400/90 text-sm'
                  : sensorCubePresent ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {!isConnected ? 'DESCONECTADO' : sensorCubePresent ? 'DETECTADO' : 'LIBRE'}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/80">
              {!isConnected ? 'Pin 4: Esperando ESP32' : 'Pin 4: TCRT5000 IR'}
            </span>
          </CardContent>
        </Card>

        {/* Velocidad Angular */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-orange-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Velocidad (ω)
              </span>
              <Activity className="h-3.5 w-3.5 text-orange-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-orange-400">
              {angularVelocity.toFixed(1)}°/s
            </div>
            <span className="text-[10px] text-muted-foreground/80">Rapidez instantánea dθ/dt</span>
          </CardContent>
        </Card>

        {/* Fuerza Normal (N/mg) */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-sky-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Normal (N/mg)
              </span>
              <span className="text-[11px] font-mono font-bold text-sky-400">cos(θ)</span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-sky-400">
              {norm.toFixed(3)}
            </div>
            <span className="text-[10px] text-muted-foreground/80">Compresión rampa</span>
          </CardContent>
        </Card>

        {/* Fuerza Deslizante (F_parallel / mg) */}
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs hover:border-yellow-500/50 transition-colors">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Deslizante (F∥/mg)
              </span>
              <MoveDown className="h-3.5 w-3.5 text-yellow-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-yellow-400">
              {slide.toFixed(3)}
            </div>
            <span className="text-[10px] text-muted-foreground/80">sin(θ) gravedad paralela</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
