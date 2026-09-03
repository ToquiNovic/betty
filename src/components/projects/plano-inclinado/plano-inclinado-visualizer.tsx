'use client';

import React, { useState, useCallback } from 'react';
import { DigitalTwinCanvas } from './digital-twin-canvas';
import { TelemetryMetricsGrid } from './telemetry-metrics-grid';
import { SerialControlPanel } from './serial-control-panel';
import { RealtimeTelemetryChart } from './realtime-telemetry-chart';
import { MathematicalModelCard, EasingType } from './mathematical-model-card';
import { Activity, Layers, Sparkles } from 'lucide-react';

interface TelemetryPoint {
  servo1: number;
  target: number;
  timestamp: number;
}

export function PlanoInclinadoVisualizer() {
  const [currentAngle, setCurrentAngle] = useState<number>(0.0);
  const [targetAngle, setTargetAngle] = useState<number>(0.0);
  const [easingType, setEasingType] = useState<EasingType>('CUBIC');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => {
    // Initial 80 points
    const init: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 0; i < 80; i++) {
      init.push({ servo1: 0, target: 0, timestamp: now - (80 - i) * 50 });
    }
    return init;
  });

  const handleTelemetryPacket = useCallback(
    (s1: number, s2: number, target: number, progress: number) => {
      setCurrentAngle(s1);
      setTargetAngle(target);

      setTelemetryHistory((prev) => {
        const next = [...prev, { servo1: s1, target, timestamp: Date.now() }];
        if (next.length > 80) next.shift();
        return next;
      });
    },
    []
  );

  const handleAngleChange = useCallback((angle: number) => {
    setTargetAngle(angle);
  }, []);

  const handleEasingChange = useCallback((type: EasingType) => {
    setEasingType(type);
  }, []);

  const handleLogMessage = useCallback((msg: string) => {
    // Optional additional logging or notifications
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
              Gemelo Digital & Estación de Telemetría en Vivo
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Monitoreo cinemático en tiempo real para plano inclinado con dos servomotores MG996R y
            ESP32. Conexión directa por cable USB Serial a 115200 baudios o simulación local interactiva.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-mono font-bold border border-sky-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Web Serial API / 115200</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Digital Twin Canvas & Telemetry Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Canvas */}
          <DigitalTwinCanvas currentAngle={currentAngle} targetAngle={targetAngle} />

          {/* Telemetry Metrics Row */}
          <TelemetryMetricsGrid currentAngle={currentAngle} targetAngle={targetAngle} />
        </div>

        {/* Right Column: Serial Control Panel (5 cols) */}
        <div className="lg:col-span-5">
          <SerialControlPanel
            currentAngle={currentAngle}
            targetAngle={targetAngle}
            easingType={easingType}
            onAngleChange={handleAngleChange}
            onEasingChange={handleEasingChange}
            onTelemetryPacket={handleTelemetryPacket}
            onLogMessage={handleLogMessage}
          />
        </div>
      </div>

      {/* Realtime Telemetry Graph */}
      <RealtimeTelemetryChart dataHistory={telemetryHistory} />

      {/* Mathematical Model Card */}
      <MathematicalModelCard easingType={easingType} />
    </div>
  );
}
