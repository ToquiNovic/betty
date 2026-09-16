'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Sigma, Atom } from 'lucide-react';
import katex from 'katex';

export type EasingType = 'CUBIC' | 'SMOOTHERSTEP' | 'SINE' | 'QUAD' | 'LINEAR';

interface MathematicalModelCardProps {
  easingType: EasingType;
  plankAngle?: number;
  slipAngle?: number;
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

export const EASING_FORMULAS: Record<EasingType, FormulaDetails> = {
  CUBIC: {
    name: 'Cubic Ease-In-Out (Recomendada)',
    badge: 'Cúbica Simétrica',
    badgeColor: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
    posLatex: 'f(t) = \\begin{cases} 4t^3 & t < 0.5 \\\\[6pt] 1 - \\dfrac{(-2t+2)^3}{2} & t \\ge 0.5 \\end{cases}',
    velLatex: 'v(t) = \\begin{cases} 12t^2 & t < 0.5 \\\\[6pt] 6(-2t+2)^2 & t \\ge 0.5 \\end{cases}',
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

function MathView({ latex, className = '' }: { latex: string; className?: string }) {
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
      className={`overflow-x-auto my-1 py-1 text-foreground font-sans ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathematicalModelCard({
  easingType,
  plankAngle = 0,
  slipAngle = 0,
}: MathematicalModelCardProps) {
  const current = EASING_FORMULAS[easingType] || EASING_FORMULAS.CUBIC;

  // Cálculos físicos en vivo
  const rad = (plankAngle * Math.PI) / 180;
  const currentTan = Math.tan(rad).toFixed(4);

  const physicsLatex = `F_\\parallel = m g \\sin(\\theta_{\\text{tabla}}), \\quad N = m g \\cos(\\theta_{\\text{tabla}}), \\quad \\mu_s = \\tan(\\theta_c)`;
  
  const evaluationLatex = slipAngle > 0
    ? `\\theta_c = ${slipAngle.toFixed(1)}^\\circ \\implies \\mu_s = \\tan(${slipAngle.toFixed(1)}^\\circ) = ${Math.tan((slipAngle * Math.PI) / 180).toFixed(4)}`
    : `\\theta_{\\text{tabla}} = ${plankAngle.toFixed(1)}^\\circ \\implies \\tan(\\theta) = ${currentTan}`;

  return (
    <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Atom className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              Modelo Físico-Matemático: Cinemática & Fricción Estática
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-mono">
              Ecuaciones analíticas de aceleración, velocidad y descomposición de fuerzas
            </p>
          </div>
        </div>

        <Badge variant="outline" className={`text-[11px] font-mono ${current.badgeColor}`}>
          <Sparkles className="h-3 w-3 mr-1" />
          {current.badge}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-3 space-y-4 text-xs">
        {/* Bloque 1: Física del Plano Inclinado & Coeficiente de Fricción */}
        <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-400 text-xs flex items-center gap-1.5">
              <Sigma className="h-3.5 w-3.5" />
              Leyes de Newton & Coeficiente de Fricción Estática (μs):
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {slipAngle > 0 ? 'Estado: Deslizamiento Registrado' : 'Estado: Reposo Estático'}
            </span>
          </div>

          <MathView latex={physicsLatex} />
          <MathView latex={evaluationLatex} className="text-amber-400" />

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            En el instante crítico de deslizamiento inminente, la fuerza de rozamiento estática máxima iguala a la componente gravitatoria tangencial (F∥ = fs,max = μs · N). Dividiendo entre la fuerza normal se elimina la masa, obteniendo la relación fundamental μs = tan(θc).
          </p>
        </div>

        {/* Bloque 2: Cinemática de Easing Seleccionada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ecuación de Posición */}
          <div className="p-3 rounded-lg border border-border/70 bg-background/60 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
              <span>Posición Normalizada f(t)</span>
              <span className="font-mono text-sky-400 text-[10px]">t ∈ [0, 1]</span>
            </div>
            <MathView latex={current.posLatex} />
          </div>

          {/* Ecuación de Velocidad */}
          <div className="p-3 rounded-lg border border-border/70 bg-background/60 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
              <span>Velocidad Derivada v(t) = f&apos;(t)</span>
              <span className="font-mono text-purple-400 text-[10px]">{current.continuity}</span>
            </div>
            <MathView latex={current.velLatex} />
          </div>
        </div>

        {/* Descripción Física de la Curva */}
        <div className="p-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-[11px] text-muted-foreground leading-relaxed">
          <strong className="text-sky-400 font-semibold">{current.name}: </strong>
          {current.physicsDescription}
        </div>
      </CardContent>
    </Card>
  );
}
