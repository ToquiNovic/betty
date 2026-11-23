'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DigitalTwinCanvas } from './digital-twin-canvas';
import { TelemetryMetricsGrid } from './telemetry-metrics-grid';
import { SerialControlPanel, RielTelemetryPacketData } from './serial-control-panel';
import { RealtimeTelemetryChart, RielTelemetryPoint } from './realtime-telemetry-chart';
import { MathematicalModelCard } from './mathematical-model-card';
import { useSensorRealtime } from '@/hooks/use-sensor-realtime';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, Unlock, Wifi, Usb, Bluetooth, RotateCcw } from 'lucide-react';
import { toast } from '@/lib/toast';

interface RielNewtonVisualizerProps {
  sensorId?: string;
}

export function RielNewtonVisualizer({
  sensorId = 'f74a812b-4d6e-4c3a-9e1f-8a0d92e5b721',
}: RielNewtonVisualizerProps) {
  // Estado cinemático del riel
  const [leverPosition, setLeverPosition] = useState<number>(1);
  const [servoAngle, setServoAngle] = useState<number>(0);
  const [cartMassKg, setCartMassKg] = useState<number>(0.15); // 150g
  const [distanceMeters, setDistanceMeters] = useState<number>(0.475); // 47.5 cm

  // Métricas de telemetría de Newton
  const [transitTimeSeconds, setTransitTimeSeconds] = useState<number>(0.0);
  const [averageVelocity, setAverageVelocity] = useState<number>(0.0);
  const [finalVelocity, setFinalVelocity] = useState<number>(0.0);
  const [acceleration, setAcceleration] = useState<number>(0.0);
  const [netForce, setNetForce] = useState<number>(0.0);
  const [kineticEnergy, setKineticEnergy] = useState<number>(0.0);
  const [momentum, setMomentum] = useState<number>(0.0);

  // Estados de carrera y sensores
  const [isBallPresent, setIsBallPresent] = useState<boolean>(true);
  const [inTransit, setInTransit] = useState<boolean>(false);
  const [impactDetected, setImpactDetected] = useState<boolean>(false);
  const [transitProgress, setTransitProgress] = useState<number>(0.0);
  const [sensorsState, setSensorsState] = useState<{
    s1: boolean;
    s2: boolean;
    s3: boolean;
    s4: boolean;
    fsr: boolean;
  }>({ s1: true, s2: false, s3: false, s4: false, fsr: false });

  // Enlace físico por hardware (Bluetooth BLE o USB Serial)
  const [hardwareConnection, setHardwareConnection] = useState<{
    connected: boolean;
    type: 'none' | 'bluetooth' | 'usb';
  }>({ connected: false, type: 'none' });

  // Historial para la gráfica dinámica en tiempo real
  const [telemetryHistory, setTelemetryHistory] = useState<RielTelemetryPoint[]>(() => {
    const init: RielTelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 0; i < 40; i++) {
      init.push({
        timeMs: i * 20,
        velocity: 0,
        acceleration: 0,
        position: 0,
        force: 0,
        timestamp: now - (40 - i) * 50,
      });
    }
    return init;
  });

  // Conexión en tiempo real con Betty IoT Platform vía WebSocket
  const { latestData, isConnected: isWebSocketConnected } = useSensorRealtime(sensorId);

  // Procesar telemetría entrante de Betty WebSocket Cloud
  useEffect(() => {
    if (!latestData || !latestData.payload) return;
    const p = latestData.payload as Record<string, any>;

    if (p.v_final !== undefined || p.v_avg !== undefined || p.force !== undefined) {
      const dt = Number(p.t_total ?? p.dt ?? 0);
      const vAvg = Number(p.v_avg ?? 0);
      const vFinal = Number(p.v_final ?? 0);
      const acc = Number(p.acc ?? 0);
      const force = Number(p.force ?? 0);
      const ek = Number(p.ek ?? 0);
      const mom = Number(p.p ?? 0);

      setTransitTimeSeconds(dt);
      setAverageVelocity(vAvg);
      setFinalVelocity(vFinal);
      setAcceleration(acc);
      setNetForce(force);
      setKineticEnergy(ek);
      setMomentum(mom);
      setImpactDetected(true);
      setInTransit(false);
      setTransitProgress(1.0);

      setTelemetryHistory((prev) => {
        const next = [
          ...prev,
          {
            timeMs: dt * 1000,
            velocity: vFinal,
            acceleration: acc,
            position: distanceMeters,
            force,
            timestamp: Date.now(),
          },
        ];
        if (next.length > 80) next.shift();
        return next;
      });
    }
  }, [latestData, distanceMeters]);

  // Manejar paquetes desde Web Serial, BLE o Simulador local
  const handleTelemetryPacket = useCallback(
    (data: RielTelemetryPacketData) => {
      setTransitTimeSeconds(data.transitTime);
      setDistanceMeters(data.distance);
      setAverageVelocity(data.averageVelocity);
      setFinalVelocity(data.finalVelocity);
      setAcceleration(data.acceleration);
      setNetForce(data.netForce);
      setKineticEnergy(data.kineticEnergy);
      setMomentum(data.momentum);
      setLeverPosition(data.leverPosition);
      setServoAngle(data.servoAngle);
      setImpactDetected(data.impactDetected);
      setInTransit(data.inTransit);
      setTransitProgress(data.transitProgress);
      setSensorsState(data.sensorsState);

      setTelemetryHistory((prev) => {
        const next = [
          ...prev,
          {
            timeMs: data.transitTime * 1000,
            velocity: data.inTransit ? data.averageVelocity : data.finalVelocity,
            acceleration: data.acceleration,
            position: data.distance,
            force: data.netForce,
            timestamp: Date.now(),
          },
        ];
        if (next.length > 80) next.shift();
        return next;
      });
    },
    []
  );

  const handleResetRun = () => {
    setImpactDetected(false);
    setInTransit(false);
    setTransitProgress(0);
    setFinalVelocity(0);
    setAverageVelocity(0);
    setTransitTimeSeconds(0);
    setSensorsState({ s1: true, s2: false, s3: false, s4: false, fsr: false });
    toast.info('Estado del riel restablecido. Listo para un nuevo disparo.');
  };

  const hasLiveTelemetry = isWebSocketConnected && !!latestData;
  const isHardwareConnected = hardwareConnection.connected;
  const hasConnection = isHardwareConnected || hasLiveTelemetry;
  const connSource: 'bluetooth' | 'usb' | 'cloud' | 'none' = isHardwareConnected
    ? hardwareConnection.type === 'bluetooth'
      ? 'bluetooth'
      : 'usb'
    : hasLiveTelemetry
    ? 'cloud'
    : 'none';

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
              Gemelo Digital & Dinámica en Vivo (Riel de Newton ESP32)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Control de eyección, adquisición por fotocompuertas infrarrojas a microsegundos y cálculo instantáneo de la Segunda Ley de Newton (F = m · a).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          {/* Badge WebSocket */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${
              isWebSocketConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-muted text-muted-foreground border-border/70'
            }`}
          >
            <Wifi className="h-3.5 w-3.5" />
            <span>{isWebSocketConnected ? 'Betty Cloud WebSocket' : 'WebSocket Desconectado'}</span>
          </div>

          {/* Badge Hardware Enlace (Bluetooth BLE / USB) */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-colors ${
              hardwareConnection.connected
                ? hardwareConnection.type === 'bluetooth'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
            }`}
          >
            {hardwareConnection.type === 'bluetooth' ? (
              <Bluetooth className="h-3.5 w-3.5 text-blue-400" />
            ) : (
              <Usb className="h-3.5 w-3.5" />
            )}
            <span>
              {hardwareConnection.connected
                ? hardwareConnection.type === 'bluetooth'
                  ? 'BLE Conectado (NUS)'
                  : 'Web Serial (115200)'
                : 'BLE / USB Enlace'}
            </span>
          </div>
        </div>
      </div>

      {/* Banner de Impacto Confirmado en Meta */}
      {impactDetected && (
        <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <strong className="text-emerald-400 font-bold text-sm">
                🎯 ¡IMPACTO EN META CONFIRMADO (SENSOR FSR)!
              </strong>
              <div className="text-xs text-muted-foreground mt-0.5">
                Velocidad Final: <strong className="text-sky-400 font-mono">{finalVelocity.toFixed(3)} m/s</strong> | 
                Aceleración: <strong className="text-amber-400 font-mono">{acceleration.toFixed(3)} m/s²</strong> | 
                Fuerza Neta: <strong className="text-emerald-400 font-mono">{netForce.toFixed(4)} N</strong> | 
                Energía: <strong className="text-orange-400 font-mono">{kineticEnergy.toFixed(4)} J</strong>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleResetRun}
            className="border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-300 font-semibold gap-1.5 shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Nuevo Ensayo</span>
          </Button>
        </div>
      )}

      {/* Grid de 2 Columnas Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Gemelo Digital Canvas 2D & Métricas de Telemetría (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <DigitalTwinCanvas
            leverPosition={leverPosition}
            servoAngle={servoAngle}
            isBallPresent={isBallPresent}
            inTransit={inTransit}
            impactDetected={impactDetected}
            transitProgress={transitProgress}
            sensorsState={sensorsState}
            currentVelocity={averageVelocity}
            finalVelocity={finalVelocity}
            acceleration={acceleration}
            netForce={netForce}
            kineticEnergy={kineticEnergy}
            momentum={momentum}
            transitTime={transitTimeSeconds}
            isConnected={hasConnection}
            connectionSource={connSource}
          />

          {/* Cuadrícula de 8 Métricas de Telemetría de Newton */}
          <TelemetryMetricsGrid
            transitTimeSeconds={transitTimeSeconds}
            distanceMeters={distanceMeters}
            averageVelocity={averageVelocity}
            finalVelocity={finalVelocity}
            acceleration={acceleration}
            netForce={netForce}
            kineticEnergy={kineticEnergy}
            momentum={momentum}
            isConnected={hasConnection}
          />
        </div>

        {/* Columna Derecha: Panel de Control Serie, BLE & Ensayos (5 cols) */}
        <div className="lg:col-span-5">
          <SerialControlPanel
            leverPosition={leverPosition}
            servoAngle={servoAngle}
            inTransit={inTransit}
            cartMassKg={cartMassKg}
            onLeverChange={(notch) => setLeverPosition(notch)}
            onServoAngleChange={(ang) => setServoAngle(ang)}
            onCartMassChange={(m) => setCartMassKg(m)}
            onTelemetryPacket={handleTelemetryPacket}
            onConnectionChange={(connected, type) =>
              setHardwareConnection({
                connected,
                type: type || (connected ? 'bluetooth' : 'none'),
              })
            }
            sensorId={sensorId}
          />
        </div>
      </div>

      {/* Gráfica en Tiempo Real de Velocidad y Aceleración */}
      <RealtimeTelemetryChart dataHistory={telemetryHistory} />

      {/* Modelo Matemático KaTeX de la Segunda Ley de Newton */}
      <MathematicalModelCard
        cartMassKg={cartMassKg}
        finalVelocity={finalVelocity}
        acceleration={acceleration}
        netForce={netForce}
        transitTimeSeconds={transitTimeSeconds}
        distanceMeters={distanceMeters}
      />
    </div>
  );
}
