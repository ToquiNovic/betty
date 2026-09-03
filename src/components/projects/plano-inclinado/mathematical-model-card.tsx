'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Binary, Sigma } from 'lucide-react';

export type EasingType = 'CUBIC' | 'SMOOTHERSTEP' | 'SINE' | 'QUAD' | 'LINEAR';

interface MathematicalModelCardProps {
  easingType: EasingType;
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
    posLatex: 'f(t) = \\begin{cases} 4t^3 & t < 0.5 \\\\[4pt] 1 - \\dfrac{(-2t+2)^3}{2} & t \\ge 0.5 \\end{cases}',
    velLatex: 'v(t) = \\begin{cases} 12t^2 & t < 0.5 \\\\[4pt] 6(-2t+2)^2 & t \\ge 0.5 \\end{cases}',
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

export function MathematicalModelCard({ easingType }: MathematicalModelCardProps) {
  const details = EASING_FORMULAS[easingType] || EASING_FORMULAS.CUBIC;

  return (
    <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Sigma className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              Modelo Matemático Dinámico de la Curva Activa
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Ecuaciones analíticas de trayectoria y cinemática en tiempo normalizado t ∈ [0, 1]
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={`font-mono text-[10px] border ${details.badgeColor}`}>
            {details.badge}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {details.continuity}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        {/* Math Formulas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Position Formula */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase font-mono">
              <span>Posición Normalizada f(t)</span>
              <span className="text-[10px] lowercase text-sky-500">trayectoria</span>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-sky-400 bg-background/80 p-2.5 rounded-md border border-border/40 overflow-x-auto">
              {details.posLatex}
            </div>
          </div>

          {/* Velocity Formula */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase font-mono">
              <span>Velocidad Instantánea v(t) = df / dt</span>
              <span className="text-[10px] lowercase text-purple-500">derivada</span>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-purple-400 bg-background/80 p-2.5 rounded-md border border-border/40 overflow-x-auto">
              {details.velLatex}
            </div>
          </div>
        </div>

        {/* Physics note */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground font-semibold">Análisis Dinámico: </strong>
            <span>{details.physicsDescription}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
