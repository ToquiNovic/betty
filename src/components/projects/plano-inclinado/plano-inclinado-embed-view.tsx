'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Activity, AlertTriangle, Cpu, Gauge, ShieldCheck, Target, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MathematicalModelCard } from './mathematical-model-card';
import { RealtimeTelemetryChart, type TelemetryPoint } from './realtime-telemetry-chart';
import { useSensorRealtime } from '@/hooks/use-sensor-realtime';
import { fetchPublicLatestSensorState } from '@/lib/api/sensors';
import { ApiError } from '@/lib/fetcher';
import {
  computeInclinedPlanePhysics,
  normalizePlanoInclinadoPayload,
  parseControlMode,
  parseEmbedViewMode,
  shouldAcceptTelemetryForMode,
  type ControlMode,
  type EasingType,
  type EmbedViewMode,
  type ExperimentState,
} from '@/lib/plano-inclinado-telemetry';
import type { SensorData } from '@/types';

const DEFAULT_MAX_PLANK_ANGLE = 30;
const MAX_HISTORY_POINTS = 80;

interface EmbedTwinState {
  sensorName: string;
  plankAngle: number;
  servo1: number;
  targetAngle: number;
  slipAngle: number;
  muS: number;
  angularVelocity: number;
  cubeDetected: boolean;
  easingType: EasingType;
  controlMode: ControlMode;
  viewMode: EmbedViewMode;
  experimentState?: ExperimentState;
  history: TelemetryPoint[];
}

function createInitialHistory(): TelemetryPoint[] {
  return Array.from({ length: 24 }, (_, idx) => ({
    plankAngle: 0,
    servo1: 0,
    target: 0,
    timestamp: idx,
  }));
}

const MODE_LABELS: Record<ControlMode, string> = {
  virtual: 'Modo Virtual OpenSim',
  physical: 'Modo Físico ESP32',
  auto: 'Modo Automático',
};

const VIEW_LABELS: Record<EmbedViewMode, string> = {
  math: 'Vista Matemática',
  math_chart: 'Matemática + Gráfica',
  full: 'Panel Completo',
};

export function PlanoInclinadoEmbedView() {
  const searchParams = useSearchParams();

  const sensorId = useMemo(
    () => searchParams.get('sensorId')?.trim() || '',
    [searchParams]
  );
  const embedToken = useMemo(
    () =>
      searchParams.get('token')?.trim() ||
      searchParams.get('embedToken')?.trim() ||
      undefined,
    [searchParams]
  );

  const explicitView = useMemo(
    () => parseEmbedViewMode(searchParams.get('view')),
    [searchParams]
  );
  const explicitMode = useMemo(
    () => parseControlMode(searchParams.get('mode')),
    [searchParams]
  );

  const [state, setState] = useState<EmbedTwinState>(() => ({
    sensorName: '',
    plankAngle: 0,
    servo1: 0,
    targetAngle: 0,
    slipAngle: 0,
    muS: 0,
    angularVelocity: 0,
    cubeDetected: true,
    easingType: 'CUBIC',
    controlMode: explicitMode ?? 'auto',
    viewMode: explicitView ?? 'math',
    experimentState: undefined,
    history: createInitialHistory(),
  }));

  const [isHydrating, setIsHydrating] = useState<boolean>(Boolean(sensorId));
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  useEffect(() => {
    if (!sensorId) return;

    let cancelled = false;

    const hydrate = async () => {
      try {
        const res = await fetchPublicLatestSensorState(sensorId, {
          token: embedToken,
          historyLimit: 60,
        });
        if (cancelled) return;

        const twinNorm = normalizePlanoInclinadoPayload(
          res.twinState,
          DEFAULT_MAX_PLANK_ANGLE
        );
        const latestNorm = normalizePlanoInclinadoPayload(
          res.latestReading?.payload,
          DEFAULT_MAX_PLANK_ANGLE,
          res.latestReading?.originType
        );

        const initialControlMode: ControlMode =
          explicitMode && explicitMode !== 'auto'
            ? explicitMode
            : twinNorm.controlMode ?? latestNorm.controlMode ?? explicitMode ?? 'auto';
        const initialViewMode: EmbedViewMode =
          twinNorm.viewMode ?? latestNorm.viewMode ?? explicitView ?? 'math';
        const initialEasing: EasingType =
          twinNorm.easingType ?? latestNorm.easingType ?? 'CUBIC';
        const initialExperimentState =
          twinNorm.experimentState ?? latestNorm.experimentState;

        const sortedHistory = [...(res.history || [])].sort((a, b) => {
          const ta = new Date(a.recordedAt || a.receivedAt).getTime();
          const tb = new Date(b.recordedAt || b.receivedAt).getTime();
          return ta - tb;
        });

        const hydratedPoints: TelemetryPoint[] = [];
        for (const entry of sortedHistory) {
          const norm = normalizePlanoInclinadoPayload(
            entry.payload,
            DEFAULT_MAX_PLANK_ANGLE,
            entry.originType
          );
          if (
            norm.hasKinematics &&
            norm.plankAngle !== undefined &&
            shouldAcceptTelemetryForMode(initialControlMode, norm.originType)
          ) {
            const s1 = norm.servo1 ?? 0;
            hydratedPoints.push({
              plankAngle: norm.plankAngle,
              servo1: s1,
              target: norm.targetAngle ?? s1,
              timestamp: new Date(entry.recordedAt || entry.receivedAt).getTime() || hydratedPoints.length,
            });
          }
        }

        const activeSnapshot =
          twinNorm.hasKinematics &&
          shouldAcceptTelemetryForMode(initialControlMode, twinNorm.originType)
            ? twinNorm
            : latestNorm.hasKinematics &&
              shouldAcceptTelemetryForMode(initialControlMode, latestNorm.originType)
            ? latestNorm
            : null;

        const nextPlank = activeSnapshot?.plankAngle ?? 0;
        const nextServo1 = activeSnapshot?.servo1 ?? 0;
        const nextSlip = activeSnapshot?.slipAngle ?? 0;
        const nextMuS =
          activeSnapshot?.muS ??
          (nextSlip > 0
            ? computeInclinedPlanePhysics(nextPlank, nextSlip).criticalMuS
            : 0);

        setState((prev) => ({
          ...prev,
          sensorName: res.name || '',
          plankAngle: nextPlank,
          servo1: nextServo1,
          targetAngle: activeSnapshot?.targetAngle ?? nextServo1,
          slipAngle: nextSlip,
          muS: nextMuS,
          angularVelocity: activeSnapshot?.angularVelocity ?? 0,
          cubeDetected: activeSnapshot?.cubeDetected ?? true,
          easingType: initialEasing,
          controlMode: initialControlMode,
          viewMode: initialViewMode,
          experimentState: initialExperimentState,
          history:
            hydratedPoints.length > 0
              ? hydratedPoints.slice(-MAX_HISTORY_POINTS)
              : prev.history,
        }));
        setHydrationError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setHydrationError(
            'Acceso denegado: token de pantalla inválido, expirado o sensor no público.'
          );
        } else if (err instanceof ApiError && err.status === 404) {
          setHydrationError('Sensor no encontrado en la plataforma Betty IoT.');
        } else {
          setHydrationError(
            err instanceof Error
              ? err.message
              : 'No se pudo cargar el estado inicial del gemelo digital.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [sensorId, embedToken, explicitMode, explicitView]);

  const handleRealtimeData = useCallback((packet: SensorData) => {
    const normalized = normalizePlanoInclinadoPayload(
      packet.payload,
      DEFAULT_MAX_PLANK_ANGLE,
      packet.originType
    );

    const ts = new Date(packet.recordedAt || packet.receivedAt).getTime() || Date.now();

    setState((prev) => {
      const nextControlMode = normalized.controlMode ?? prev.controlMode;
      const nextViewMode = normalized.viewMode ?? prev.viewMode;
      const acceptKinematics = shouldAcceptTelemetryForMode(
        nextControlMode,
        normalized.originType
      );
      const isControlPacket =
        normalized.controlMode !== undefined || !normalized.hasKinematics;

      const nextEasing =
        (acceptKinematics || isControlPacket) && normalized.easingType
          ? normalized.easingType
          : prev.easingType;

      const nextExperimentState =
        (acceptKinematics || isControlPacket) && normalized.experimentState
          ? normalized.experimentState
          : prev.experimentState;

      if (!acceptKinematics || !normalized.hasKinematics) {
        return {
          ...prev,
          controlMode: nextControlMode,
          viewMode: nextViewMode,
          easingType: nextEasing,
          experimentState: nextExperimentState,
        };
      }

      const nextPlank = normalized.plankAngle ?? prev.plankAngle;
      const nextServo1 = normalized.servo1 ?? prev.servo1;
      const nextTarget = normalized.targetAngle ?? nextServo1;
      const nextSlip = normalized.slipAngle ?? prev.slipAngle;
      const nextMuS =
        normalized.muS ??
        (nextSlip > 0
          ? computeInclinedPlanePhysics(nextPlank, nextSlip).criticalMuS
          : 0);
      const nextAngVel = normalized.angularVelocity ?? prev.angularVelocity;
      const nextCube = normalized.cubeDetected ?? prev.cubeDetected;

      const nextHistory = [
        ...prev.history,
        {
          plankAngle: nextPlank,
          servo1: nextServo1,
          target: nextTarget,
          timestamp: ts,
        },
      ];
      if (nextHistory.length > MAX_HISTORY_POINTS) {
        nextHistory.shift();
      }

      return {
        ...prev,
        plankAngle: nextPlank,
        servo1: nextServo1,
        targetAngle: nextTarget,
        slipAngle: nextSlip,
        muS: nextMuS,
        angularVelocity: nextAngVel,
        cubeDetected: nextCube,
        easingType: nextEasing,
        controlMode: nextControlMode,
        viewMode: nextViewMode,
        experimentState: nextExperimentState,
        history: nextHistory,
      };
    });
  }, []);

  const { isConnected: isWebSocketConnected, subscriptionError } = useSensorRealtime(
    sensorId || null,
    {
      embedToken,
      onData: handleRealtimeData,
    }
  );

  if (!sensorId) {
    return (
      <div className="dark min-h-screen w-full bg-[#070b12] text-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border border-rose-500/40 bg-slate-950/90 text-slate-100">
          <CardContent className="p-6 space-y-3 text-center">
            <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto" />
            <h1 className="text-lg font-bold">Parámetro sensorId requerido</h1>
            <p className="text-sm text-slate-300">
              Proporciona el identificador del sensor y un token de visualización válido en la URL para mostrar el modelo matemático en tiempo real.
            </p>
            <code className="block rounded-md bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-sky-300">
              ?sensorId=&lt;UUID&gt;&amp;token=&lt;EMBED_TOKEN&gt;&amp;view=math
            </code>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeError = subscriptionError || hydrationError;

  return (
    <div className="dark min-h-screen w-full bg-[#070b12] text-slate-100 p-3 sm:p-4 flex flex-col gap-3 overflow-x-hidden">
      {/* Barra superior compacta optimizada para pantalla 1280x720 en OpenSim MOAP */}
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 shrink-0">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-50 truncate">
                Gemelo Digital · Plano Inclinado
              </h1>
              {state.sensorName && (
                <span className="hidden sm:inline text-xs font-mono text-slate-400 truncate">
                  ({state.sensorName})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="text-xs font-mono border-slate-700 bg-slate-950/70 text-slate-300"
          >
            {VIEW_LABELS[state.viewMode]}
          </Badge>

          <Badge
            variant="outline"
            className="text-xs font-mono border-purple-500/40 bg-purple-500/10 text-purple-300"
          >
            {MODE_LABELS[state.controlMode]}
          </Badge>

          <Badge
            variant="outline"
            className={`text-xs font-mono ${
              isWebSocketConnected
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            }`}
          >
            <Wifi className="h-3 w-3 mr-1" />
            {isHydrating
              ? 'Sincronizando...'
              : isWebSocketConnected
              ? 'En vivo (WS)'
              : 'Reconectando...'}
          </Badge>
        </div>
      </header>

      {activeError && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/70 px-4 py-2.5 text-xs sm:text-sm text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      {/* Contenido principal según viewMode */}
      {state.viewMode === 'math' ? (
        <div className="flex-1 flex flex-col justify-center">
          <MathematicalModelCard
            presentationMode
            easingType={state.easingType}
            plankAngle={state.plankAngle}
            slipAngle={state.slipAngle}
            controlMode={state.controlMode}
            experimentState={state.experimentState}
            angularVelocity={state.angularVelocity}
          />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          <div className="lg:col-span-7 flex flex-col">
            <MathematicalModelCard
              presentationMode
              easingType={state.easingType}
              plankAngle={state.plankAngle}
              slipAngle={state.slipAngle}
              controlMode={state.controlMode}
              experimentState={state.experimentState}
              angularVelocity={state.angularVelocity}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            <RealtimeTelemetryChart dataHistory={state.history} />

            {state.viewMode === 'full' && (
              <div className="grid grid-cols-2 gap-2.5">
                <Card className="border border-slate-800 bg-slate-900/85 text-slate-100">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                      <span>Ángulo Tabla</span>
                      <Gauge className="h-3.5 w-3.5 text-sky-400" />
                    </div>
                    <div className="text-2xl font-black font-mono text-sky-400">
                      {state.plankAngle.toFixed(1)}°
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-800 bg-slate-900/85 text-slate-100">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                      <span>Servo MG996R</span>
                      <Cpu className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <div className="text-2xl font-black font-mono text-purple-400">
                      {state.servo1.toFixed(0)}°
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-800 bg-slate-900/85 text-slate-100">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                      <span>Sensor TCRT5000</span>
                      <ShieldCheck
                        className={`h-3.5 w-3.5 ${
                          state.cubeDetected ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      />
                    </div>
                    <div
                      className={`text-lg font-black font-mono ${
                        state.cubeDetected ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {state.cubeDetected ? 'CUBO PRESENTE' : 'DESLIZADO'}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-800 bg-slate-900/85 text-slate-100">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                      <span>Ángulo Crítico</span>
                      <Target className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-400">
                      {state.slipAngle > 0 ? `${state.slipAngle.toFixed(1)}°` : '--'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      μs = {state.slipAngle > 0 ? state.muS.toFixed(4) : '--'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
