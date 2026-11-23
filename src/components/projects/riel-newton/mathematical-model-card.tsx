'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Sigma, Atom, Scale, Flame, Zap } from 'lucide-react';
import katex from 'katex';

interface RielMathematicalModelCardProps {
  cartMassKg?: number;
  finalVelocity?: number;
  acceleration?: number;
  netForce?: number;
  transitTimeSeconds?: number;
  distanceMeters?: number;
}

function MathView({ latex, className = '' }: { latex: string; className?: string }) {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch (e) {
      return latex;
    }
  }, [latex]);

  return (
    <div
      className={`overflow-x-auto py-1 text-center font-mono ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathematicalModelCard({
  cartMassKg = 0.15,
  finalVelocity = 0,
  acceleration = 0,
  netForce = 0,
  transitTimeSeconds = 0,
  distanceMeters = 0.475,
}: RielMathematicalModelCardProps) {
  const massGrams = (cartMassKg * 1000).toFixed(0);
  const ek = 0.5 * cartMassKg * Math.pow(finalVelocity, 2);
  const p = cartMassKg * finalVelocity;
  const work = netForce * distanceMeters;

  const newtonLatex = `\\vec{F}_{\\text{neta}} = m \\cdot \\vec{a} = \\dfrac{d\\vec{p}}{dt}, \\quad a = \\dfrac{v_f^2 - v_0^2}{2d}`;
  const evaluationLatex = finalVelocity > 0
    ? `m = ${massGrams}\\,\\text{g}, \\quad a = ${acceleration.toFixed(3)}\\,\\text{m/s}^2 \\implies F_{\\text{neta}} = (${cartMassKg.toFixed(3)}\\,\\text{kg})(${acceleration.toFixed(3)}\\,\\text{m/s}^2) = ${netForce.toFixed(4)}\\,\\text{N}`
    : `m = ${massGrams}\\,\\text{g}, \\quad d = ${(distanceMeters * 100).toFixed(1)}\\,\\text{cm} \\quad (\\text{Listo para ensayo})`;

  const workEnergyLatex = `W_{\\text{neto}} = \\Delta E_k = \\dfrac{1}{2}m v_f^2 - \\dfrac{1}{2}m v_0^2, \\quad J = \\int F\\,dt = \\Delta p = m v_f`;

  return (
    <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Atom className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              Modelo Físico-Matemático: Dinámica Clásica & Segunda Ley de Newton
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-mono">
              Ecuaciones analíticas de fuerza neta, cantidad de movimiento, trabajo mecánico y energía cinética
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-[11px] font-mono bg-sky-500/10 text-sky-400 border-sky-500/30">
          <Sparkles className="h-3 w-3 mr-1" />
          Principia Mathematica
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-3 space-y-4 text-xs">
        {/* Bloque 1: Ley Fundamental de la Dinámica */}
        <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-400 text-xs flex items-center gap-1.5">
              <Sigma className="h-3.5 w-3.5" />
              Segunda Ley de Newton (\(F = m \cdot a\)):
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {finalVelocity > 0 ? 'Estado: Impacto Registrado' : 'Estado: Reposo / Pre-disparo'}
            </span>
          </div>

          <MathView latex={newtonLatex} />
          <MathView latex={evaluationLatex} className="text-amber-400" />

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            La aceleración comunicada al móvil sobre el riel sin fricción es directamente proporcional a la fuerza neta comunicada por el émbolo percutor (F_neta) e inversamente proporcional a la masa inercial (m).
          </p>
        </div>

        {/* Bloque 2: Teorema Trabajo-Energía y Momento Lineal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ecuación de Trabajo y Energía */}
          <div className="p-3 rounded-lg border border-border/70 bg-background/60 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span>Teorema Trabajo - Energía Cinética</span>
              </span>
              <span className="font-mono text-orange-400 text-[10px]">
                {finalVelocity > 0 ? `Ek = ${ek.toFixed(4)} J` : 'Ek = 0 J'}
              </span>
            </div>
            <MathView latex={workEnergyLatex} />
            <p className="text-[10px] text-muted-foreground">
              El trabajo mecánico transferido por el resorte (W = F · d = {work.toFixed(4)} J) se transforma íntegramente en energía cinética de traslación.
            </p>
          </div>

          {/* Impulso y Cantidad de Movimiento */}
          <div className="p-3 rounded-lg border border-border/70 bg-background/60 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Scale className="h-3.5 w-3.5 text-violet-400" />
                <span>Impulso y Momento Lineal</span>
              </span>
              <span className="font-mono text-violet-400 text-[10px]">
                {finalVelocity > 0 ? `p = ${p.toFixed(4)} N·s` : 'p = 0 N·s'}
              </span>
            </div>
            <MathView latex={`J = \\Delta p = m (v_f - v_0) = ${p.toFixed(4)}\\,\\text{N}\\cdot\\text{s}`} />
            <p className="text-[10px] text-muted-foreground">
              La integral temporal de la fuerza impulsora comunicada en el instante inicial equivale a la cantidad de movimiento total transferida al móvil.
            </p>
          </div>
        </div>

        {/* Descripción de Cinemática por Fotocompuertas */}
        <div className="p-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-[11px] text-muted-foreground leading-relaxed">
          <strong className="text-sky-400 font-semibold">Adquisición por Fotocompuertas: </strong>
          El ESP32 registra el tiempo de paso en microsegundos (µs) mediante interrupciones de hardware en los puertos S1 (0 cm), S2 (2.4 cm), S3 (4.8 cm), S4 (7.2 cm) y el impacto en meta a 47.5 cm, lo que permite computar aceleraciones locales diferenciales sin efecto de arrastre por fricción.
        </div>
      </CardContent>
    </Card>
  );
}
