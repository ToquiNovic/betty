'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Sigma, Atom, Radio } from 'lucide-react';
import katex from 'katex';
import {
  computeInclinedPlanePhysics,
  type EasingType,
  type ControlMode,
  type ExperimentState,
} from '@/lib/plano-inclinado-telemetry';

export type { EasingType };

interface MathematicalModelCardProps {
  easingType: EasingType;
  plankAngle?: number;
  slipAngle?: number;
  presentationMode?: boolean;
  controlMode?: ControlMode;
  experimentState?: ExperimentState;
  angularVelocity?: number;
}

interface FormulaDetails {
  name: string;
  badge: string;
  badgeColor: string;
  posLatex: string;
  velLatex: string;
  physicsDescription: string;
  continuity: string;
}

const CONTROL_MODE_META: Record<ControlMode, { label: string; badgeClass: string }> = {
  virtual: {
    label: 'Modo Virtual OpenSim',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-400/40',
  },
  physical: {
    label: 'Modo Físico ESP32',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
  },
  auto: {
    label: 'Modo Automático',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-400/40',
  },
};

const EXPERIMENT_STATE_LABELS: Record<ExperimentState, { label: string; badgeClass: string }> = {
  idle: {
    label: 'Estado: Reposo Estático',
    badgeClass: 'text-slate-300 border-slate-500/40 bg-slate-500/10',
  },
  running: {
    label: 'Estado: Elevación Activa',
    badgeClass: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
  },
  slip_detected: {
    label: 'Estado: Deslizamiento Registrado',
    badgeClass: 'text-rose-300 border-rose-500/50 bg-rose-500/15',
  },
  paused: {
    label: 'Estado: Pausado',
    badgeClass: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  },
};

export const EASING_FORMULAS: Record<EasingType, FormulaDetails> = {
  CUBIC: {
    name: 'Cubic Ease-In-Out (Recomendada)',
    badge: 'Cúbica Simétrica',
    badgeColor: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
    posLatex:
      'f(t) = \\begin{cases} 4t^3 & t < 0.5 \\\\[6pt] 1 - \\dfrac{(-2t+2)^3}{2} & t \\ge 0.5 \\end{cases}',
    velLatex:
      'v(t) = \\begin{cases} 12t^2 & t < 0.5 \\\\[6pt] 6(-2t+2)^2 & t \\ge 0.5 \\end{cases}',
    physicsDescription:
      'Arranque ultra progresivo con aceleración nula inicial (a = 0). Vence la inercia estática de la madera sin sacudidas mecánicas ni estrés torsional en los servos.',
    continuity: 'C¹ Continua en velocidad',
  },
  SMOOTHERSTEP: {
    name: 'SmootherStep (Quíntica de Ken Perlin)',
    badge: 'Grado 5 - Jerk Cero',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    posLatex: 'f(t) = 6t^5 - 15t^4 + 10t^3',
    velLatex: 'v(t) = 30t^2(1 - t)^2 = 30t^4 - 60t^3 + 30t^2',
    physicsDescription:
      'Polinomio de Ken Perlin. Posee velocidad 0, aceleración 0 y derivada de aceleración (jerk = 0) en ambos extremos (t=0 y t=1). Máxima suavidad física para maquetas de alta precisión.',
    continuity: 'C² Continua en aceleración',
  },
  SINE: {
    name: 'Sinusoidal (Armónica Natural)',
    badge: 'Oscilación Armónica',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    posLatex: 'f(t) = \\dfrac{1 - \\cos(\\pi t)}{2}',
    velLatex: 'v(t) = \\dfrac{\\pi}{2} \\sin(\\pi t)',
    physicsDescription:
      'Curva armónica natural inspirada en la física del movimiento del péndulo simple. Transición uniforme con curva de velocidad de campana suave.',
    continuity: 'C∞ Infinita suavidad',
  },
  QUAD: {
    name: 'Smoothstep (Cuadrática)',
    badge: 'Grado 3 Clásico',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    posLatex: 'f(t) = 3t^2 - 2t^3',
    velLatex: 'v(t) = 6t(1 - t) = 6t - 6t^2',
    physicsDescription:
      'Smoothstep estándar de grado 3. Aceleración lineal moderada con perfil parabólico de velocidad. Buena respuesta para movimientos rápidos.',
    continuity: 'C¹ Continua',
  },
  LINEAR: {
    name: 'Lineal (Velocidad Constante)',
    badge: 'Sin Easing',
    badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    posLatex: 'f(t) = t',
    velLatex: 'v(t) = 1.0 \\quad (\\text{Constante})',
    physicsDescription:
      'Velocidad constante fija. Causa impulsos infinitos de aceleración (picos de jerk) en los instantes t=0 y t=1, provocando golpes mecánicos y resonancia en la rampa.',
    continuity: 'C⁰ Discontinua en derivadas',
  },
};

function MathView({
  latex,
  className = '',
  presentationMode = false,
}: {
  latex: string;
  className?: string;
  presentationMode?: boolean;
}) {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return `<span class="text-rose-400 font-mono">${latex}</span>`;
    }
  }, [latex]);

  return (
    <div
      className={`overflow-x-auto my-1 py-1 font-sans ${
        presentationMode
          ? 'text-slate-100 [&_.katex]:text-[1.18em] sm:[&_.katex]:text-[1.28em]'
          : 'text-foreground'
      } ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathematicalModelCard({
  easingType,
  plankAngle = 0,
  slipAngle = 0,
  presentationMode = false,
  controlMode,
  experimentState,
  angularVelocity,
}: MathematicalModelCardProps) {
  const current = EASING_FORMULAS[easingType] || EASING_FORMULAS.CUBIC;
  const physics = computeInclinedPlanePhysics(plankAngle, slipAngle);

  const resolvedControlMode: ControlMode = controlMode ?? 'auto';
  const modeMeta = CONTROL_MODE_META[resolvedControlMode];

  const resolvedState: ExperimentState =
    experimentState ?? (slipAngle > 0 ? 'slip_detected' : plankAngle > 0 && presentationMode ? 'running' : 'idle');
  const stateMeta = EXPERIMENT_STATE_LABELS[resolvedState];

  const physicsLatex = `F_\\parallel = m g \\sin(\\theta_{\\text{tabla}}), \\quad N = m g \\cos(\\theta_{\\text{tabla}}), \\quad \\mu_s = \\tan(\\theta_c)`;

  const evaluationLatex =
    slipAngle > 0
      ? `\\theta_c = ${slipAngle.toFixed(1)}^\\circ \\implies \\mu_s = \\tan(${slipAngle.toFixed(1)}^\\circ) = ${physics.criticalMuS.toFixed(4)}`
      : presentationMode
      ? `\\theta_{\\text{tabla}} = ${plankAngle.toFixed(1)}^\\circ \\implies \\tan(\\theta) = ${physics.tanTheta.toFixed(4)}, \\; \\sin(\\theta) = ${physics.parallelRatio.toFixed(3)}, \\; \\cos(\\theta) = ${physics.normalRatio.toFixed(3)}`
      : `\\theta_{\\text{tabla}} = ${plankAngle.toFixed(1)}^\\circ \\implies \\tan(\\theta) = ${physics.tanTheta.toFixed(4)}`;

  return (
    <Card
      className={
        presentationMode
          ? 'border border-slate-700/80 bg-slate-950/95 text-slate-100 shadow-2xl overflow-hidden'
          : 'border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm overflow-hidden'
      }
    >
      <CardHeader
        className={`flex flex-row items-center justify-between gap-3 space-y-0 ${
          presentationMode
            ? 'px-5 py-3.5 border-b border-slate-800 bg-slate-900/70'
            : 'p-4 pb-2 border-b border-border/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`rounded-lg bg-purple-500/15 text-purple-400 shrink-0 ${
              presentationMode ? 'p-2' : 'p-1.5'
            }`}
          >
            <Atom className={presentationMode ? 'h-5 w-5' : 'h-4 w-4'} />
          </div>
          <div className="min-w-0">
            <CardTitle
              className={`font-bold tracking-tight truncate ${
                presentationMode ? 'text-base sm:text-lg text-slate-50' : 'text-sm text-foreground'
              }`}
            >
              Modelo Físico-Matemático: Cinemática & Fricción Estática
            </CardTitle>
            <p
              className={`font-mono truncate ${
                presentationMode
                  ? 'text-xs text-slate-400'
                  : 'text-[11px] text-muted-foreground'
              }`}
            >
              Ecuaciones analíticas de aceleración, velocidad y descomposición de fuerzas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          {(presentationMode || controlMode !== undefined) && (
            <Badge
              variant="outline"
              className={`font-mono font-semibold ${
                presentationMode ? 'text-xs px-2.5 py-1' : 'text-[11px]'
              } ${modeMeta.badgeClass}`}
            >
              <Radio className="h-3 w-3 mr-1" />
              {modeMeta.label}
            </Badge>
          )}

          <Badge
            variant="outline"
            className={`font-mono ${
              presentationMode ? 'text-xs px-2.5 py-1' : 'text-[11px]'
            } ${current.badgeColor}`}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {current.badge}
          </Badge>
        </div>
      </CardHeader>

      <CardContent
        className={
          presentationMode ? 'p-5 space-y-4 text-sm' : 'p-4 pt-3 space-y-4 text-xs'
        }
      >
        {/* Bloque 1: Física del Plano Inclinado & Coeficiente de Fricción */}
        <div
          className={`rounded-xl border border-purple-500/35 bg-purple-500/10 ${
            presentationMode ? 'p-4 space-y-3' : 'p-3.5 space-y-2'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`font-bold text-purple-300 flex items-center gap-1.5 ${
                presentationMode ? 'text-sm' : 'text-xs text-purple-400'
              }`}
            >
              <Sigma className={presentationMode ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
              Leyes de Newton & Coeficiente de Fricción Estática (μs):
            </span>
            {presentationMode ? (
              <Badge variant="outline" className={`text-xs font-mono ${stateMeta.badgeClass}`}>
                {stateMeta.label}
              </Badge>
            ) : (
              <span className="text-[10px] font-mono text-muted-foreground">
                {stateMeta.label}
              </span>
            )}
          </div>

          <MathView latex={physicsLatex} presentationMode={presentationMode} />
          <MathView
            latex={evaluationLatex}
            presentationMode={presentationMode}
            className="text-amber-300"
          />

          {presentationMode && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="rounded-lg border border-slate-700/80 bg-slate-900/85 px-3 py-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Inclinación θ / ω
                </div>
                <div className="text-xl font-black font-mono text-sky-400">
                  {plankAngle.toFixed(1)}°
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  tan(θ)={physics.tanTheta.toFixed(3)} · ω={(angularVelocity ?? 0).toFixed(1)}°/s
                </div>
              </div>

              <div className="rounded-lg border border-slate-700/80 bg-slate-900/85 px-3 py-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  F∥ / (mg) = sin(θ)
                </div>
                <div className="text-xl font-black font-mono text-amber-400">
                  {physics.parallelRatio.toFixed(3)}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Componente deslizante
                </div>
              </div>

              <div className="rounded-lg border border-slate-700/80 bg-slate-900/85 px-3 py-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  N / (mg) = cos(θ)
                </div>
                <div className="text-xl font-black font-mono text-cyan-400">
                  {physics.normalRatio.toFixed(3)}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Compresión normal
                </div>
              </div>

              <div className="rounded-lg border border-slate-700/80 bg-slate-900/85 px-3 py-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Fricción (μs)
                </div>
                <div
                  className={`text-xl font-black font-mono ${
                    slipAngle > 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {slipAngle > 0 ? physics.criticalMuS.toFixed(4) : '--'}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {slipAngle > 0 ? `θc = ${slipAngle.toFixed(1)}°` : 'μs = tan(θc)'}
                </div>
              </div>
            </div>
          )}

          <p
            className={`leading-relaxed ${
              presentationMode
                ? 'text-xs text-slate-300'
                : 'text-[11px] text-muted-foreground'
            }`}
          >
            En el instante crítico de deslizamiento inminente, la fuerza de rozamiento estática máxima iguala a la componente gravitatoria tangencial (F∥ = fs,max = μs · N). Dividiendo entre la fuerza normal se elimina la masa, obteniendo la relación fundamental μs = tan(θc).
          </p>
        </div>

        {/* Bloque 2: Cinemática de Easing Seleccionada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ecuación de Posición */}
          <div
            className={`rounded-lg border space-y-1 ${
              presentationMode
                ? 'p-3.5 border-slate-700/80 bg-slate-900/75'
                : 'p-3 border-border/70 bg-background/60'
            }`}
          >
            <div
              className={`flex items-center justify-between font-semibold ${
                presentationMode
                  ? 'text-xs text-slate-300'
                  : 'text-[11px] text-muted-foreground'
              }`}
            >
              <span>Posición Normalizada f(t)</span>
              <span
                className={`font-mono text-sky-400 ${
                  presentationMode ? 'text-xs' : 'text-[10px]'
                }`}
              >
                t ∈ [0, 1]
              </span>
            </div>
            <MathView latex={current.posLatex} presentationMode={presentationMode} />
          </div>

          {/* Ecuación de Velocidad */}
          <div
            className={`rounded-lg border space-y-1 ${
              presentationMode
                ? 'p-3.5 border-slate-700/80 bg-slate-900/75'
                : 'p-3 border-border/70 bg-background/60'
            }`}
          >
            <div
              className={`flex items-center justify-between font-semibold ${
                presentationMode
                  ? 'text-xs text-slate-300'
                  : 'text-[11px] text-muted-foreground'
              }`}
            >
              <span>Velocidad Derivada v(t) = f&apos;(t)</span>
              <span
                className={`font-mono text-purple-400 ${
                  presentationMode ? 'text-xs' : 'text-[10px]'
                }`}
              >
                {current.continuity}
              </span>
            </div>
            <MathView latex={current.velLatex} presentationMode={presentationMode} />
          </div>
        </div>

        {/* Descripción Física de la Curva */}
        <div
          className={`rounded-lg border border-sky-500/25 bg-sky-500/10 leading-relaxed ${
            presentationMode
              ? 'p-3 text-xs text-slate-300'
              : 'p-2.5 text-[11px] text-muted-foreground'
          }`}
        >
          <strong className="text-sky-400 font-semibold">{current.name}: </strong>
          {current.physicsDescription}
        </div>
      </CardContent>
    </Card>
  );
}
