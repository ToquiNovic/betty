'use client';

import React, { useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { DigitalTwinCanvas } from './digital-twin-canvas';
import { TelemetryMetricsGrid } from './telemetry-metrics-grid';
import { SerialControlPanel, TelemetryPacketData } from './serial-control-panel';
import { RealtimeTelemetryChart, TelemetryPoint } from './realtime-telemetry-chart';
import { MathematicalModelCard } from './mathematical-model-card';
import { useSensorRealtime } from '@/hooks/use-sensor-realtime';
import { createSensorEmbedToken } from '@/lib/api/sensors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Activity,
  AlertTriangle,
  Unlock,
  Wifi,
  Usb,
  Bluetooth,
  Monitor,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import {
  computeInclinedPlanePhysics,
  normalizePlanoInclinadoPayload,
  CONTROL_MODES,
  EMBED_VIEW_MODES,
  type ControlMode,
  type EasingType,
  type EmbedViewMode,
  type ExperimentState,
} from '@/lib/plano-inclinado-telemetry';
import type { EmbedTokenResponse, SensorData } from '@/types';

interface PlanoInclinadoVisualizerProps {
  sensorId?: string;
}

const DEFAULT_MAX_PLANK_ANGLE = 30.0;
const DEFAULT_EASING_TYPE: EasingType = 'CUBIC';
const DEFAULT_DURATION_MS = 2500;

export function PlanoInclinadoVisualizer({
  sensorId = 'e290f30a-201e-482c-ac7e-a9d02583068d',
}: PlanoInclinadoVisualizerProps) {
  const locale = useLocale();

  // Estado cinemático del plano y servos
  const [currentServoAngle, setCurrentServoAngle] = useState<number>(0.0);
  const [targetServoAngle, setTargetServoAngle] = useState<number>(0.0);
  const [currentPlankAngle, setCurrentPlankAngle] = useState<number>(0.0);
  const [easingType, setEasingType] = useState<EasingType>(DEFAULT_EASING_TYPE);
  const [controlMode, setControlMode] = useState<ControlMode>('auto');
  const [experimentState, setExperimentState] = useState<ExperimentState | undefined>(undefined);

  // Estado del sensor óptico y fricción
  const [sensorCubePresent, setSensorCubePresent] = useState<boolean>(true);
  const [slipAngle, setSlipAngle] = useState<number>(0.0);
  const [frictionCoeff, setFrictionCoeff] = useState<number>(0.0);
  const [angularVelocity, setAngularVelocity] = useState<number>(0.0);

  // Estado de enlace físico por hardware (Bluetooth BLE o USB Serial)
  const [hardwareConnection, setHardwareConnection] = useState<{
    connected: boolean;
    type: 'none' | 'bluetooth' | 'usb';
  }>({ connected: false, type: 'none' });

  // Estado del diálogo Pantalla Metaverso (MOAP 1280x720)
  const [isMoapDialogOpen, setIsMoapDialogOpen] = useState<boolean>(false);
  const [isMintingToken, setIsMintingToken] = useState<boolean>(false);
  const [embedTokenData, setEmbedTokenData] = useState<EmbedTokenResponse | null>(null);
  const [moapView, setMoapView] = useState<EmbedViewMode>('math');
  const [moapMode, setMoapMode] = useState<ControlMode>('auto');
  const [moapPublicEmbed, setMoapPublicEmbed] = useState<boolean>(true);
  const [moapError, setMoapError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'url' | 'prim' | 'notecard' | null>(null);

  // Historial para la gráfica en tiempo real
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => {
    const init: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 0; i < 60; i++) {
      init.push({ plankAngle: 0, servo1: 0, target: 0, timestamp: now - (60 - i) * 50 });
    }
    return init;
  });

  // Procesar telemetría entrante de Betty WebSocket (soporta payload plano o payload.metrics)
  const handleRealtimeData = useCallback((packet: SensorData) => {
    const normalized = normalizePlanoInclinadoPayload(
      packet.payload,
      DEFAULT_MAX_PLANK_ANGLE,
      packet.originType
    );

    if (normalized.easingType) {
      setEasingType(normalized.easingType);
    }
    if (normalized.controlMode) {
      setControlMode(normalized.controlMode);
    }
    if (normalized.experimentState) {
      setExperimentState(normalized.experimentState);
    }

    if (normalized.hasKinematics && normalized.plankAngle !== undefined) {
      const plank = normalized.plankAngle;
      const s1 = normalized.servo1 ?? (plank / DEFAULT_MAX_PLANK_ANGLE) * 180;
      const target = normalized.targetAngle ?? s1;
      const sAngle = normalized.slipAngle ?? 0;
      const mu =
        normalized.muS ??
        (sAngle > 0 ? computeInclinedPlanePhysics(plank, sAngle).criticalMuS : 0);
      const angVel = normalized.angularVelocity ?? 0;

      setCurrentPlankAngle(plank);
      setCurrentServoAngle(s1);
      if (normalized.targetAngle !== undefined) {
        setTargetServoAngle(normalized.targetAngle);
      }
      if (normalized.cubeDetected !== undefined) {
        setSensorCubePresent(normalized.cubeDetected);
      }
      setSlipAngle(sAngle);
      setFrictionCoeff(mu);
      setAngularVelocity(angVel);

      setTelemetryHistory((prev) => {
        const next = [
          ...prev,
          { plankAngle: plank, servo1: s1, target, timestamp: Date.now() },
        ];
        if (next.length > 80) next.shift();
        return next;
      });
    }
  }, []);

  // Conexión en tiempo real con Betty IoT Platform vía WebSocket
  const { latestData, isConnected: isWebSocketConnected } = useSensorRealtime(sensorId, {
    onData: handleRealtimeData,
  });

  // Manejar paquetes desde Web Serial o simulador local
  const handleTelemetryPacket = useCallback((data: TelemetryPacketData) => {
    setCurrentServoAngle(data.servo1);
    setTargetServoAngle(data.target);
    setCurrentPlankAngle(data.plankAngle);
    setSensorCubePresent(data.sensorCubePresent);
    setSlipAngle(data.slipAngle);

    setFrictionCoeff(
      data.slipAngle > 0
        ? computeInclinedPlanePhysics(data.plankAngle, data.slipAngle).criticalMuS
        : 0
    );

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
  }, []);

  const handleClearSlip = () => {
    setSlipAngle(0);
    setFrictionCoeff(0);
    setSensorCubePresent(true);
    setExperimentState('idle');
    toast.info('Estado de deslizamiento restablecido (CLEAR)');
  };

  const handleResetToZero = () => {
    setSlipAngle(0);
    setFrictionCoeff(0);
    setSensorCubePresent(true);
    setTargetServoAngle(0);
    setExperimentState('idle');
  };

  const handleMintEmbedToken = async (publicOverride?: boolean) => {
    setIsMintingToken(true);
    setMoapError(null);
    const usePublic = publicOverride ?? moapPublicEmbed;
    try {
      const minted = await createSensorEmbedToken(sensorId, { publicEmbed: usePublic });
      setEmbedTokenData(minted);
      toast.success('Configuración de pantalla MOAP generada correctamente');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo generar el token de acceso para OpenSim';
      setMoapError(message);
      toast.error(message);
    } finally {
      setIsMintingToken(false);
    }
  };

  const handleOpenMoapDialog = () => {
    setIsMoapDialogOpen(true);
    if (!embedTokenData || embedTokenData.sensorId !== sensorId) {
      void handleMintEmbedToken(moapPublicEmbed);
    }
  };

  const clientOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://betty.laboratorio3d.online';

  const embedBaseUrl = `${clientOrigin}/${locale}/embed/plano-inclinado`;

  const embedUrl = embedTokenData
    ? `${embedBaseUrl}?sensorId=${encodeURIComponent(sensorId)}${
        moapPublicEmbed
          ? ''
          : `&token=${encodeURIComponent(embedTokenData.embedToken)}`
      }&view=${moapView}&mode=${moapMode}`
    : '';

  const openSimPrimDescription = embedTokenData
    ? moapPublicEmbed
      ? `url:${embedBaseUrl} sensor:${sensorId} view:${moapView}`
      : `url:${embedBaseUrl} sensor:${sensorId} token:${embedTokenData.embedToken} view:${moapView}`
    : '';

  const openSimNotecardConfig = embedTokenData
    ? [
        `url=${embedBaseUrl}`,
        `sensor=${sensorId}`,
        ...(moapPublicEmbed ? [] : [`token=${embedTokenData.embedToken}`]),
        `view=${moapView}`,
        `mode=${moapMode}`,
      ].join('\n')
    : '';

  const handleCopyText = async (
    text: string,
    field: 'url' | 'prim' | 'notecard',
    label: string
  ) => {
    if (!text || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${label} copiado al portapapeles`);
      setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2000);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
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
          {/* Botón Pantalla Metaverso (MOAP) */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenMoapDialog}
            className="h-8 gap-1.5 rounded-full text-xs font-semibold border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Pantalla Metaverso (MOAP)</span>
          </Button>

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
                Motores congelados a{' '}
                <strong className="text-sky-400 font-mono">{slipAngle.toFixed(1)}°</strong> | Coeficiente de fricción estática:{' '}
                <strong className="text-amber-400 font-mono">μs = {frictionCoeff.toFixed(4)}</strong>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Digital Twin Canvas & Telemetry Metrics (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
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
                currentPlankAngle={currentPlankAngle}
                targetServoAngle={targetServoAngle}
                maxPlankAngle={DEFAULT_MAX_PLANK_ANGLE}
                duration={DEFAULT_DURATION_MS}
                easingType={easingType}
                onAngleChange={(ang) => setTargetServoAngle(ang)}
                onEasingChange={setEasingType}
                onResetToZero={handleResetToZero}
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
        );
      })()}

      {/* Gráfica en Tiempo Real */}
      <RealtimeTelemetryChart dataHistory={telemetryHistory} />

      {/* Modelo Matemático KaTeX */}
      <MathematicalModelCard
        easingType={easingType}
        plankAngle={currentPlankAngle}
        slipAngle={slipAngle}
        controlMode={controlMode}
        experimentState={experimentState}
        angularVelocity={angularVelocity}
      />

      {/* Modal de configuración MOAP para OpenSim */}
      <Dialog open={isMoapDialogOpen} onOpenChange={setIsMoapDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-card border-border p-6">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-400" />
                <DialogTitle className="text-lg font-bold">
                  Pantalla Metaverso (MOAP 1280×720)
                </DialogTitle>
              </div>
              {embedTokenData && (
                <Badge
                  variant="outline"
                  className="text-[11px] font-mono border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                >
                  Token activo ({embedTokenData.expiresIn})
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Proyecta las ecuaciones físicas y cinemáticas en tiempo real dentro de OpenSim / Firestorm mediante Media-on-a-Prim (1280×720) usando un token de solo lectura.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Vista inicial (view)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {EMBED_VIEW_MODES.map((viewOpt) => (
                    <Button
                      key={viewOpt}
                      type="button"
                      size="sm"
                      variant={moapView === viewOpt ? 'default' : 'outline'}
                      onClick={() => setMoapView(viewOpt)}
                      className="h-7 text-xs font-mono"
                    >
                      {viewOpt}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Modo de control (mode)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CONTROL_MODES.map((modeOpt) => (
                    <Button
                      key={modeOpt}
                      type="button"
                      size="sm"
                      variant={moapMode === modeOpt ? 'default' : 'outline'}
                      onClick={() => setMoapMode(modeOpt)}
                      className="h-7 text-xs font-mono"
                    >
                      {modeOpt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 p-2.5">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">
                  Acceso público de lectura en pantalla (recomendado para OpenSim)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Evita que OpenSim trunque el JWT al límite de 127 bytes en Object Description.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={moapPublicEmbed ? 'default' : 'outline'}
                disabled={isMintingToken}
                onClick={() => {
                  const next = !moapPublicEmbed;
                  setMoapPublicEmbed(next);
                  void handleMintEmbedToken(next);
                }}
                className="h-7 text-xs font-mono shrink-0"
              >
                {moapPublicEmbed ? 'Público ON' : 'Token JWT'}
              </Button>
            </div>

            {moapError && (
              <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-xs text-rose-300">
                {moapError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">URL Embed 1280×720 (MOAP / Navegador)</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={isMintingToken ? 'Generando configuración de visualización...' : embedUrl}
                  className="font-mono text-xs h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!embedUrl}
                  onClick={() => void handleCopyText(embedUrl, 'url', 'Enlace MOAP')}
                  className="h-8 px-2.5 gap-1 shrink-0"
                >
                  {copiedField === 'url' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs">Copiar</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Descripción del Prim en OpenSim (Object Description)
                </Label>
                {openSimPrimDescription && (
                  <span
                    className={`text-[10px] font-mono ${
                      openSimPrimDescription.length > 127 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {openSimPrimDescription.length}/127 bytes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={
                    isMintingToken
                      ? 'Generando cadena para prim...'
                      : openSimPrimDescription
                  }
                  className="font-mono text-xs h-8 text-sky-400"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!openSimPrimDescription}
                  onClick={() =>
                    void handleCopyText(
                      openSimPrimDescription,
                      'prim',
                      'Cadena de descripción OpenSim'
                    )
                  }
                  className="h-8 px-2.5 gap-1 shrink-0"
                >
                  {copiedField === 'prim' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs">Copiar</span>
                </Button>
              </div>
              {openSimPrimDescription.length > 127 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] text-amber-400">
                    Esta cadena supera los 127 bytes de Object Description en OpenSim. Usa la notecard <code className="font-mono">UA3D_MathScreen.cfg</code> dentro del prim o pega el Enlace MOAP directo en la pestaña Media:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={openSimNotecardConfig.replace(/\n/g, ' | ')}
                      className="font-mono text-[11px] h-8 text-amber-300"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!openSimNotecardConfig}
                      onClick={() =>
                        void handleCopyText(
                          openSimNotecardConfig,
                          'notecard',
                          'Contenido de notecard UA3D_MathScreen.cfg'
                        )
                      }
                      className="h-8 px-2.5 gap-1 shrink-0"
                    >
                      {copiedField === 'notecard' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span className="text-xs">Notecard</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isMintingToken}
              onClick={() => void handleMintEmbedToken()}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isMintingToken ? 'animate-spin' : ''}`} />
              <span>Regenerar Token</span>
            </Button>

            <div className="flex items-center gap-2">
              {embedUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(embedUrl, '_blank', 'noopener,noreferrer')}
                  className="gap-1.5 text-xs h-8"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Abrir Vista Previa</span>
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => setIsMoapDialogOpen(false)}
                className="text-xs h-8"
              >
                Cerrar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
