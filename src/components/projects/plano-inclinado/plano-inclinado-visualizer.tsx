'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DigitalTwinCanvas } from './digital-twin-canvas';
import { TelemetryMetricsGrid } from './telemetry-metrics-grid';
import { SerialControlPanel, TelemetryPacketData } from './serial-control-panel';
import { RealtimeTelemetryChart, TelemetryPoint } from './realtime-telemetry-chart';
import { MathematicalModelCard, EasingType } from './mathematical-model-card';
import { useSensorRealtime } from '@/hooks/use-sensor-realtime';
import { Button } from '@/components/ui/button';
import { Activity, Sparkles, AlertTriangle, Unlock, Wifi, Usb } from 'lucide-react';
import { toast } from '@/lib/toast';

interface PlanoInclinadoVisualizerProps {
  sensorId?: string;
}

export function PlanoInclinadoVisualizer({
  sensorId = 'e290f30a-201e-482c-ac7e-a9d02583068d',
}: PlanoInclinadoVisualizerProps) {
  // Estado cinemático del plano y servos
  const [currentServoAngle, setCurrentServoAngle] = useState<number>(0.0);
  const [targetServoAngle, setTargetServoAngle] = useState<number>(0.0);
  const [currentPlankAngle, setCurrentPlankAngle] = useState<number>(0.0);
  const [maxPlankAngle, setMaxPlankAngle] = useState<number>(30.0);

  // Estado del sensor óptico y fricción
  const [sensorCubePresent, setSensorCubePresent] = useState<boolean>(true);
  const [slipAngle, setSlipAngle] = useState<number>(0.0);
  const [frictionCoeff, setFrictionCoeff] = useState<number>(0.0);
  const [angularVelocity, setAngularVelocity] = useState<number>(0.0);

  // Parámetros de control
  const [easingType, setEasingType] = useState<EasingType>('CUBIC');
  const [autoStop, setAutoStop] = useState<boolean>(true);
  const [dynamicTime, setDynamicTime] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(2500);

  // Estado de conexión física por USB
  const [isUsbConnected, setIsUsbConnected] = useState<boolean>(false);

  // Historial para la gráfica en tiempo real
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => {
    const init: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 0; i < 60; i++) {
      init.push({ plankAngle: 0, servo1: 0, target: 0, timestamp: now - (60 - i) * 50 });
    }
    return init;
  });

  // Conexión en tiempo real con Betty IoT Platform vía WebSocket
  const { latestData, isConnected: isWebSocketConnected } = useSensorRealtime(sensorId);

  // Procesar telemetría entrante de Betty WebSocket
  useEffect(() => {
    if (!latestData || !latestData.payload) return;
    const p = latestData.payload as Record<string, any>;

    if (p.plank_angle !== undefined) {
      const plank = Number(p.plank_angle);
      const s1 = Number(p.servo1 ?? (plank / maxPlankAngle) * 180);
      const cube = p.cube_detected !== undefined ? Boolean(p.cube_detected) : true;
      const sAngle = Number(p.slip_angle ?? 0);
      const mu = Number(p.mu_s ?? (sAngle > 0 ? Math.tan((sAngle * Math.PI) / 180) : 0));
      const angVel = Number(p.angular_velocity ?? 0);

      setCurrentPlankAngle(plank);
      setCurrentServoAngle(s1);
      setSensorCubePresent(cube);
      setSlipAngle(sAngle);
      setFrictionCoeff(mu);
      setAngularVelocity(angVel);

      setTelemetryHistory((prev) => {
        const next = [...prev, { plankAngle: plank, servo1: s1, target: s1, timestamp: Date.now() }];
        if (next.length > 80) next.shift();
        return next;
      });
    }
  }, [latestData, maxPlankAngle]);

  // Manejar paquetes desde Web Serial o simulador local
  const handleTelemetryPacket = useCallback(
    (data: TelemetryPacketData) => {
      setCurrentServoAngle(data.servo1);
      setTargetServoAngle(data.target);
      setCurrentPlankAngle(data.plankAngle);
      setSensorCubePresent(data.sensorCubePresent);
      setSlipAngle(data.slipAngle);

      if (data.slipAngle > 0) {
        setFrictionCoeff(Math.tan((data.slipAngle * Math.PI) / 180));
      } else {
        setFrictionCoeff(0);
      }

      if (data.angularVelocity !== undefined) {
        setAngularVelocity(data.angularVelocity);
      }

      setTelemetryHistory((prev) => {
        const next = [
          ...prev,
          {
            plankAngle: data.plankAngle,
            servo1: data.servo1,
            target: data.target,
            timestamp: Date.now(),
          },
        ];
        if (next.length > 80) next.shift();
        return next;
      });
    },
    []
  );

  const handleClearSlip = () => {
    setSlipAngle(0);
    setFrictionCoeff(0);
    setSensorCubePresent(true);
    toast.info('Estado de deslizamiento restablecido (CLEAR)');
  };

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
              Gemelo Digital & Telemetría en Vivo (Plano Inclinado ESP32)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Control cinemático con curvas de easing, detección óptica de deslizamiento con sensor TCRT5000 y cálculo analítico del coeficiente de fricción estática (\(\mu_s\)).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          {/* Badge WebSocket */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${
            isWebSocketConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-muted text-muted-foreground border-border/70'
          }`}>
            <Wifi className="h-3.5 w-3.5" />
            <span>{isWebSocketConnected ? 'Betty Cloud WebSocket' : 'WebSocket Desconectado'}</span>
          </div>

          {/* Badge USB Web Serial */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-mono font-bold border border-sky-500/30">
            <Usb className="h-3.5 w-3.5" />
            <span>Web Serial (115200)</span>
          </div>
        </div>
      </div>

      {/* Banner de Alerta de Deslizamiento (Se dispara cuando slipAngle > 0) */}
      {slipAngle > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl border border-rose-500/60 bg-rose-500/10 shadow-lg shadow-rose-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <strong className="text-rose-400 font-bold text-sm">
                🛑 ¡DESPLAZAMIENTO DEL CUBO DETECTADO!
              </strong>
              <div className="text-xs text-muted-foreground mt-0.5">
                Motores congelados a <strong className="text-sky-400 font-mono">{slipAngle.toFixed(1)}°</strong> | Coeficiente de fricción estática: <strong className="text-amber-400 font-mono">μs = {frictionCoeff.toFixed(4)}</strong>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleClearSlip}
            className="border-rose-500/50 hover:bg-rose-500/20 text-rose-300 font-semibold gap-1.5 shrink-0"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>Desbloquear (CLEAR)</span>
          </Button>
        </div>
      )}

      {/* Main 2-Column Workstation Grid */}
      {(() => {
        const hasLiveTelemetry = isWebSocketConnected && !!latestData;
        const hasConnection = isUsbConnected || hasLiveTelemetry;
        const connSource: 'usb' | 'cloud' | 'none' = isUsbConnected
          ? 'usb'
          : hasLiveTelemetry
          ? 'cloud'
          : 'none';

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Digital Twin Canvas & Telemetry Metrics (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Canvas 2D Interactivo */}
              <DigitalTwinCanvas
                plankAngle={currentPlankAngle}
                servoAngle={currentServoAngle}
                targetAngle={targetServoAngle}
                sensorCubePresent={sensorCubePresent}
                slipAngle={slipAngle}
                isConnected={hasConnection}
                connectionSource={connSource}
              />

              {/* Cuadrícula de 8 Métricas de Telemetría */}
              <TelemetryMetricsGrid
                plankAngle={currentPlankAngle}
                servo1Angle={currentServoAngle}
                slipAngle={slipAngle}
                frictionCoeff={frictionCoeff}
                sensorCubePresent={sensorCubePresent}
                angularVelocity={angularVelocity}
                isConnected={hasConnection}
              />
            </div>

            {/* Right Column: Serial Control Panel & Experiments (5 cols) */}
            <div className="lg:col-span-5">
              <SerialControlPanel
                currentServoAngle={currentServoAngle}
                targetServoAngle={targetServoAngle}
                currentPlankAngle={currentPlankAngle}
                maxPlankAngle={maxPlankAngle}
                easingType={easingType}
                autoStop={autoStop}
                dynamicTime={dynamicTime}
                duration={duration}
                onAngleChange={(ang) => setTargetServoAngle(ang)}
                onEasingChange={(type) => setEasingType(type)}
                onMaxPlankAngleChange={(val) => setMaxPlankAngle(val)}
                onAutoStopToggle={(val) => setAutoStop(val)}
                onDynamicTimeToggle={(val) => setDynamicTime(val)}
                onDurationChange={(ms) => setDuration(ms)}
                onTelemetryPacket={handleTelemetryPacket}
                onConnectionChange={setIsUsbConnected}
                sensorId={sensorId}
              />
            </div>
          </div>
        );
      })()}

      {/* Gráfica en Tiempo Real */}
      <RealtimeTelemetryChart dataHistory={telemetryHistory} />

      {/* Modelo Matemático KaTeX */}
      <MathematicalModelCard
        easingType={easingType}
        plankAngle={currentPlankAngle}
        slipAngle={slipAngle}
      />
    </div>
  );
}
