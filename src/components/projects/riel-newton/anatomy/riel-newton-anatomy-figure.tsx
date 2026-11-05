'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plate, Solid, Line, Dots } from '@/components/iso/draw';
import {
  BENCH_ART,
  RAIL_ART,
  LEFT_BRACKET_ART,
  LAUNCHER_ART,
} from './geometry';
import { computeNewtonPose } from './pose';
import {
  formatNewtonReadout,
} from './model';
import { VIEW_WIDTH, VIEW_HEIGHT } from './view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  RotateCcw,
  Sliders,
  Activity,
  Info,
  X,
  ChevronRight,
  ChevronLeft,
  Zap,
  Gauge,
  Timer,
  Cpu,
} from 'lucide-react';

export interface AnatomyPartInfo {
  id: string;
  name: string;
  tag: string;
  category: string;
  summary: string;
  description: string;
  specs: { label: string; value: string }[];
  physicsRole: string;
  glbMesh: string;
}

export const NEWTON_PARTS: Record<string, AnatomyPartInfo> = {
  bench: {
    id: 'bench',
    name: 'Bancada de Soporte & Patas (Cube.028 / Cube.030)',
    tag: 'Estructura Base',
    category: 'Bancada & Nivelación',
    summary: 'Mesa alargada negra mate con 4 patas prismáticas mecanizadas antivibración.',
    description:
      'Plataforma base sólida con acabado anodizado negro antirreflejo. Aísla mecánicamente el conjunto de ensayo frente a resonancias y vibraciones externas garantizando una referencia inercial perfecta.',
    specs: [
      { label: 'Dimensiones base', value: '330 × 52 × 12 mm' },
      { label: 'Patas de apoyo', value: '4× Columnas cuadradas 10×10 mm' },
      { label: 'Material', value: 'Aluminio mecanizado CNC' },
      { label: 'Acabado', value: 'Anodizado negro mate (Mat.023)' },
    ],
    physicsRole:
      'Define el marco de referencia inercial horizontal (θ = 0.00°) anulando la componente gravitatoria paralela a la dirección del movimiento.',
    glbMesh: 'Cube.028 + Cube.030',
  },
  rail: {
    id: 'rail',
    name: 'Riel Lineal Elevado (Plane.002 / Cube.014)',
    tag: 'Guía de Deslizamiento',
    category: 'Cinemática Lineal',
    summary: 'Pista de rodadura suspendida sobre pilares con ranura de precisión y escala milimétrica.',
    description:
      'Viga prismática elevada sobre la bancada mediante torretas espaciadoras. Incorpora una ranura central de guiado y calibración métrica para permitir el avance unidimensional sin rozamiento lateral.',
    specs: [
      { label: 'Longitud de guía', value: '245 mm de carrera' },
      { label: 'Elevación sobre mesa', value: '14.0 mm' },
      { label: 'Rectitud superficial', value: '< 0.02 mm/m' },
      { label: 'Escala milimétrica', value: 'Grabado láser de 1 mm' },
    ],
    physicsRole:
      'Constriñe la cinemática a un movimiento rectilíneo uniforme (MRU) o uniformemente acelerado (MRUA) en el eje X.',
    glbMesh: 'Plane.002 / Cube.014',
  },
  launcher: {
    id: 'launcher',
    name: 'Cilindro Lanzador & Pistón Coaxial (Cylinder.001 / .004)',
    tag: 'Actuador de Impulso',
    category: 'Mecanismo Neumático / Solenoide',
    summary: 'Cilindro negro coaxial con vástago telescópico plateado saliente para eyección del carro.',
    description:
      'Actuador cilíndrico montado en el extremo derecho en línea recta con el riel. Aloja un pistón interno o solenoide cuyo vástago plateado cromado proyecta hacia afuera con boquilla terminal para comunicar el impulso cinético inicial al móvil.',
    specs: [
      { label: 'Diámetro de cañón', value: 'Ø 15.0 mm' },
      { label: 'Vástago cromado', value: 'Ø 7.0 mm x 28 mm' },
      { label: 'Fuerza de eyección', value: 'Ajustable de 1 a 5 N' },
      { label: 'Material vástago', value: 'Acero inoxidable rectificado (Mat.033)' },
    ],
    physicsRole:
      'Comunica una cantidad de movimiento inicial instantánea (impulso J = ∫F·dt = Δp) o acelera el móvil de forma controlada.',
    glbMesh: 'Cylinder.001 + Cylinder.004',
  },
  glider: {
    id: 'glider',
    name: 'Carro Deslizante Instrumental (GONDS_Metal.002)',
    tag: 'Móvil Acelerado',
    category: 'Masa Experimental',
    summary: 'Vehículo de aleación metálica con rodamientos miniatura que abraza la guía elevada.',
    description:
      'Carro móvil de baja fricción montado sobre 4 rodamientos de precisión. Sirve como plataforma portadora para el servomotor TowerPro SG90, la pantalla LCD y los sensores cinemáticos a bordo.',
    specs: [
      { label: 'Masa base', value: '150 g ajustables' },
      { label: 'Rodamientos', value: '4× ABEC-5 acero cromo' },
      { label: 'Coef. fricción', value: 'μ < 0.005' },
      { label: 'Material', value: 'Aleación ligera mecanizada' },
    ],
    physicsRole:
      'Representa la masa inercial m sobre la que se miden la velocidad v(t) y la aceleración a = F/m.',
    glbMesh: 'GONDS_Metal.002',
  },
  sg90: {
    id: 'sg90',
    name: 'Servomotor TowerPro SG90 Azul Onboard',
    tag: 'Actuador Onboard',
    category: 'Control Electromecánico',
    summary: 'Micro-servo de 9g en carcasa azul translúcida montado directamente sobre el carro móvil.',
    description:
      'Actuador micro de 9 gramos con carcasa de policarbonato azul característico (`blue`). Acciona un brazo de leva o mecanismo de enganche/freno para liberación o acople dinámico durante la prueba.',
    specs: [
      { label: 'Peso del servo', value: '9.0 gramos' },
      { label: 'Torque a 4.8V', value: '1.8 kg·cm (0.176 N·m)' },
      { label: 'Velocidad', value: '0.10 s / 60°' },
      { label: 'Carcasa', value: 'Azul translúcido (SG90 TowerPro)' },
    ],
    physicsRole:
      'Gatillo móvil o freno dinámico para retención en puntos intermedios de la carrera.',
    glbMesh: 'blue / SG90-Servo-9-gms...',
  },
  lcd: {
    id: 'lcd',
    name: 'Display LCD & Módulo Sensor Onboard (lcd.obj.cleaner)',
    tag: 'Telemetría Digital',
    category: 'Instrumentación Embebida',
    summary: 'Módulo de pantalla LCD y codificador óptico para lectura y transmisión de telemetría.',
    description:
      'Unidad de instrumentación compacta montada en el frontal del carro móvil. Despliega en tiempo real la velocidad de desplazamiento y se comunica mediante bus serie con el controlador central.',
    specs: [
      { label: 'Display', value: 'Matriz LCD de alto contraste' },
      { label: 'Codificador', value: 'Disco óptico de pulsos (Circle.001)' },
      { label: 'Tasa de muestreo', value: '500 Hz' },
    ],
    physicsRole:
      'Adquisición in-situ de la cinemática sin cables que introduzcan rozamientos mecánicos.',
    glbMesh: 'lcd.obj.cleaner + Circle.001',
  },
  leftBracket: {
    id: 'leftBracket',
    name: 'Torreta de Retención Izquierda (Cube.034)',
    tag: 'Tope Terminal',
    category: 'Soporte Mecánico',
    summary: 'Montante vertical negro de anclaje del riel y tope amortiguador del origen.',
    description:
      'Bloque de anclaje ubicado en el extremo izquierdo del riel con almohadilla de elastómero que detiene el carro de forma segura en la posición inicial x = 0.',
    specs: [
      { label: 'Dimensiones', value: '12 × 24 × 20 mm' },
      { label: 'Amortiguador', value: 'Pad de caucho de alta densidad' },
      { label: 'Material', value: 'Aluminio anodizado' },
    ],
    physicsRole:
      'Establece el origen geométrico x = 0 y absorbe impactos en el rebote.',
    glbMesh: 'Cube.034',
  },
  nameplate: {
    id: 'nameplate',
    name: 'Placa Técnica de Identificación',
    tag: 'Metrología & Trazabilidad',
    category: 'Marcado de Laboratorio',
    summary: 'Placa de latón grabada con código oficial de calibración Betty IoT Lab.',
    description:
      'Elemento de identificación metrológica fijado a la bancada que vincula el gemelo digital en Betty con el equipo físico en el laboratorio.',
    specs: [
      { label: 'Material', value: 'Latón pulido de 0.8 mm' },
      { label: 'Identificador', value: 'BETTY-NEWTON-EXP-02' },
      { label: 'Fijación', value: 'Micro-remaches M1.5' },
    ],
    physicsRole: 'Certifica la calibración y metrología del equipo.',
    glbMesh: 'Placa grabada',
  },
};

const PART_KEYS = Object.keys(NEWTON_PARTS);

export function RielNewtonAnatomyFigure() {
  const [cartTravel, setCartTravel] = useState<number>(140); // 0 to 225 mm (default in the middle matching glb)
  const [cartMass, setCartMass] = useState<number>(0.15); // kg
  const [impulseForce, setImpulseForce] = useState<number>(2.5); // N
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  const pose = computeNewtonPose(cartTravel, cartMass, 0.05);
  const readout = formatNewtonReadout(pose.state);

  const activePartInfo = selectedPart ? NEWTON_PARTS[selectedPart] : null;

  // Realistic pneumatic/solenoid launch animation from right to left or gliding
  const handleLaunch = () => {
    if (isRunning) return;
    setIsRunning(true);
    setCartTravel(0);

    const startTime = performance.now();
    const a = impulseForce / cartMass; // a = F/m (m/s^2)
    const totalTravelMm = 225;
    const totalTimeSec = Math.sqrt((2 * (totalTravelMm / 1000)) / a);

    const frame = (now: number) => {
      const elapsedMs = now - startTime;
      const tSec = elapsedMs / 1000;

      if (tSec < totalTimeSec) {
        const currentM = 0.5 * a * tSec * tSec;
        const currentMm = Math.min(totalTravelMm, currentM * 1000);
        setCartTravel(Math.round(currentMm * 10) / 10);
        animationRef.current = requestAnimationFrame(frame);
      } else {
        setCartTravel(totalTravelMm);
        setIsRunning(false);
      }
    };

    animationRef.current = requestAnimationFrame(frame);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleReset = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    setCartTravel(0);
  };

  const handleNextPart = () => {
    if (!selectedPart) {
      setSelectedPart(PART_KEYS[0]);
      return;
    }
    const idx = PART_KEYS.indexOf(selectedPart);
    const nextIdx = (idx + 1) % PART_KEYS.length;
    setSelectedPart(PART_KEYS[nextIdx]);
  };

  const handlePrevPart = () => {
    if (!selectedPart) {
      setSelectedPart(PART_KEYS[PART_KEYS.length - 1]);
      return;
    }
    const idx = PART_KEYS.indexOf(selectedPart);
    const prevIdx = (idx - 1 + PART_KEYS.length) % PART_KEYS.length;
    setSelectedPart(PART_KEYS[prevIdx]);
  };

  const getGroupStyle = (partId: string) => {
    const isSelected = selectedPart === partId;
    const isHovered = hoveredPart === partId;

    if (isSelected) {
      return {
        cursor: 'pointer',
        filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.95)) brightness(1.2)',
        transition: 'all 0.2s ease',
      };
    }
    if (isHovered) {
      return {
        cursor: 'pointer',
        filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.85)) brightness(1.15)',
        transition: 'all 0.2s ease',
      };
    }
    return {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };
  };

  return (
    <div className="space-y-4">
      {/* Interactive Exploration Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border bg-card/60 backdrop-blur-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Info className="h-4 w-4 text-sky-500" />
          <span>Anatomía Mecánica Fiel al Modelo 3D (GLB):</span>
          <span className="text-[11px] font-normal text-muted-foreground hidden sm:inline">
            Tocá cualquier parte en el diagrama o seleccioná en la barra:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {PART_KEYS.map((key) => {
            const part = NEWTON_PARTS[key];
            const isSelected = selectedPart === key;
            return (
              <Button
                key={key}
                variant={isSelected ? 'default' : 'outline'}
                size="xs"
                onClick={() => setSelectedPart(isSelected ? null : key)}
                className={`text-[11px] h-6.5 px-2 rounded-lg transition-all ${
                  isSelected ? 'shadow-xs font-bold' : 'hover:border-primary/50'
                }`}
              >
                {part.name.split(' ')[0]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 1. Anatomy Standard Framed Plate */}
      <div className="relative">
        <Plate
          fig="Fig 1"
          title="Riel de Newton & Dinámica Clásica ESP32"
          hint="Presioná 'Disparar Lanzador' o arrastrá la posición para ver deslizar el carro con servo SG90 y display"
          readout={readout}
          keys={[
            { mark: 'raised', label: 'Bancada negra y riel lineal elevado' },
            { mark: 'edge', label: 'Cilindro lanzador coaxial y vástago plateado' },
            { mark: 'dotted', label: 'Carro móvil y servo micro SG90 azul' },
            { mark: 'lit', label: 'Display digital LCD onboard y telemetría' },
          ]}
          caption={`Modelo isométrico reconstruido con fidelidad 1:1 a partir de riel_newton.glb. Banco de ensayo con bancada negra CNC (Cube.028), viga de deslizamiento suspendida (Plane.002), cilindro lanzador con pistón plateado telescópico (Cylinder.001/.004) y carro instrumental con servomotor azul TowerPro SG90 y display LCD a bordo.`}
        >
          <svg
            className="iso-svg"
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            role="img"
            aria-label="Diagrama isométrico fiel al modelo 3D de Riel de Newton"
            focusable="false"
          >
            {/* A. Heavy Black Bench Table & 4 Support Legs (Cube.028 + Cube.030) */}
            <g
              key="bench-group"
              onClick={() => setSelectedPart('bench')}
              onMouseEnter={() => setHoveredPart('bench')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('bench')}
              className="cursor-pointer"
            >
              {/* 4 Square support legs */}
              {BENCH_ART.legs.map((legSolid, idx) => (
                <Solid key={`leg-${idx}`} paths={legSolid} className="mat-servo-black" tone="lo" crease="faint" />
              ))}

              {/* Bench slab */}
              <Solid paths={BENCH_ART.slab} className="mat-chassis" tone="hi" crease="faint" />
              <Line d={BENCH_ART.groove} tone="lo" />

              {/* Brass Identification Nameplate */}
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPart('nameplate');
                }}
                onMouseEnter={() => setHoveredPart('nameplate')}
                onMouseLeave={() => setHoveredPart(null)}
                style={getGroupStyle('nameplate')}
              >
                <Solid paths={BENCH_ART.plate} className="mat-brass" tone="hi" crease="none" />
                <Line d={BENCH_ART.plateLine} tone="faint" />
                <Line d={BENCH_ART.plateRule} tone="lo" />
                <Dots points={BENCH_ART.plateRivets} size={0.45} tone="hi" />
              </g>
            </g>

            {/* B. Elevated Linear Guide Rail & Riser Pillars (Plane.002 / Cube.014) */}
            <g
              key="rail-group"
              onClick={() => setSelectedPart('rail')}
              onMouseEnter={() => setHoveredPart('rail')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('rail')}
              className="cursor-pointer"
            >
              {/* Pillar risers */}
              {RAIL_ART.risers.map((riserSolid, i) => (
                <Solid key={`riser-${i}`} paths={riserSolid} className="mat-servo-black" tone="mid" crease="faint" />
              ))}

              {/* Elevated rail beam */}
              <Solid paths={RAIL_ART.beam} className="mat-chassis" tone="hi" crease="faint" />
              <Line d={RAIL_ART.slot} tone="lit" />
              <Line d={RAIL_ART.ticks} tone="mid" />
            </g>

            {/* C. Left Upright Stop Bracket (Cube.034) */}
            <g
              key="leftBracket-group"
              onClick={() => setSelectedPart('leftBracket')}
              onMouseEnter={() => setHoveredPart('leftBracket')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('leftBracket')}
              className="cursor-pointer"
            >
              <Solid paths={LEFT_BRACKET_ART.solid} className="mat-servo-black" tone="mid" crease="faint" />
              <Solid paths={LEFT_BRACKET_ART.pad} className="mat-steel" tone="lo" crease="none" />
            </g>

            {/* D. Right Pneumatic/Solenoid Launcher Barrel & Chrome Piston (Cylinder.001 / .004) */}
            <g
              key="launcher-group"
              onClick={() => setSelectedPart('launcher')}
              onMouseEnter={() => setHoveredPart('launcher')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('launcher')}
              className="cursor-pointer"
            >
              {/* Mounting cradle */}
              <Solid paths={LAUNCHER_ART.cradle} className="mat-servo-black" tone="mid" crease="faint" />

              {/* Horizontal black cylinder barrel */}
              <Solid paths={LAUNCHER_ART.barrel} className="mat-chassis" tone="hi" crease="faint" />
              <Solid paths={LAUNCHER_ART.collar} className="mat-steel" tone="hi" crease="none" />

              {/* Telescopic chrome piston shaft extending out to the right */}
              <Solid paths={LAUNCHER_ART.piston} className="mat-steel" tone="hi" crease="faint" />
              <Solid paths={LAUNCHER_ART.tip} className="mat-steel" tone="mid" crease="none" />
            </g>

            {/* E. Mobile Glider Carriage (GONDS_Metal.002) */}
            <g
              key="glider-group"
              onClick={() => setSelectedPart('glider')}
              onMouseEnter={() => setHoveredPart('glider')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('glider')}
              className="cursor-pointer"
            >
              {/* 4 Roller wheels */}
              {pose.glider.wheels.map((wSolid, idx) => (
                <Solid key={`wheel-${idx}`} paths={wSolid} className="mat-steel" tone="hi" crease="none" />
              ))}

              {/* Glider metallic carriage body */}
              <Solid paths={pose.glider.body} className="mat-steel" tone="hi" crease="faint" />
            </g>

            {/* F. TowerPro SG90 Blue Micro-Servo Onboard (blue / SG90-Servo) */}
            <g
              key="sg90-group"
              onClick={() => setSelectedPart('sg90')}
              onMouseEnter={() => setHoveredPart('sg90')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('sg90')}
              className="cursor-pointer"
            >
              <Solid paths={pose.sg90.ears} className="mat-servo-blue" tone="mid" crease="none" />
              <Solid paths={pose.sg90.casing} className="mat-servo-blue" tone="hi" crease="faint" />
              <Solid paths={pose.sg90.horn} className="mat-cube" tone="hi" crease="none" />
              <circle cx={pose.sg90.pin[0]} cy={pose.sg90.pin[1]} r={1.6} fill="#fbbf24" />
            </g>

            {/* G. Onboard LCD Module & Digital Matrix Display (lcd.obj.cleaner) */}
            <g
              key="lcd-group"
              onClick={() => setSelectedPart('lcd')}
              onMouseEnter={() => setHoveredPart('lcd')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('lcd')}
              className="cursor-pointer"
            >
              <Solid paths={pose.lcd.bezel} className="mat-servo-black" tone="lo" crease="faint" />
              <Solid paths={pose.lcd.screen} className="mat-servo-black" tone="hi" lit crease="none" />
              <circle cx={pose.lcd.led[0]} cy={pose.lcd.led[1]} r={1.8} fill="#22c55e" />
            </g>
          </svg>
        </Plate>

        {/* Floating Interactive Pop-up Detail Card */}
        {activePartInfo && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-80 sm:w-96 rounded-2xl border border-border/90 bg-background/95 backdrop-blur-md shadow-2xl p-4 sm:p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            {/* Pop-up Header */}
            <div className="flex items-start justify-between gap-2 border-b pb-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0">
                    {activePartInfo.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    #{activePartInfo.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">
                  {activePartInfo.name}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handlePrevPart}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Elemento anterior"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleNextPart}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Siguiente elemento"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setSelectedPart(null)}
                  className="h-6 w-6 text-muted-foreground hover:text-rose-500 ml-1"
                  title="Cerrar ventana"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Summary */}
            <p className="text-xs font-semibold text-primary/90 leading-snug">
              {activePartInfo.summary}
            </p>

            {/* Detailed Description */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {activePartInfo.description}
            </p>

            {/* Specs Grid */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Especificaciones Técnicas (Mapeo GLB: {activePartInfo.glbMesh})
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {activePartInfo.specs.map((spec, i) => (
                  <div key={i} className="p-1.5 rounded-lg bg-muted/40 border border-border/40 text-[10px]">
                    <span className="text-muted-foreground block text-[9px]">{spec.label}</span>
                    <span className="font-mono font-semibold text-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Physics & Telemetry Callout */}
            <div className="p-2 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-[11px]">
              <div className="flex items-center gap-1 font-bold text-primary text-[10px] uppercase">
                <Zap className="h-3 w-3" />
                <span>Rol Físico en el Experimento:</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {activePartInfo.physicsRole}
              </p>
            </div>

            {/* Live Metrics for the Selected Component */}
            {activePartInfo.id === 'glider' && (
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] flex items-center justify-between">
                <span className="text-sky-600 dark:text-sky-400 font-semibold text-[10px]">Posición en riel / Velocidad:</span>
                <span className="font-mono font-bold text-sky-500">
                  {cartTravel.toFixed(1)} mm / {pose.state.currentVelocity.toFixed(2)} m/s
                </span>
              </div>
            )}

            {activePartInfo.id === 'launcher' && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] flex items-center justify-between">
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px]">Fuerza de eyección configurada:</span>
                <span className="font-mono font-bold text-amber-500">{impulseForce.toFixed(2)} N</span>
              </div>
            )}

            {activePartInfo.id === 'sg90' && (
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] flex items-center justify-between">
                <span className="text-sky-600 dark:text-sky-400 font-semibold text-[10px]">Estado Servo SG90:</span>
                <span className="font-mono font-bold text-sky-500">{isRunning ? 'Liberado (0°)' : 'Enclavado (90°)'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Interactive Dynamics Physics Workbench */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-xs">
        {/* Col 1: Simulation & Launch Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-primary" />
              <span>Desplazamiento del Carro (x)</span>
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              {cartTravel.toFixed(1)} mm
            </Badge>
          </div>

          <div className="py-2">
            <input
              type="range"
              min={0}
              max={225}
              step={0.5}
              value={cartTravel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (isRunning && animationRef.current) {
                  cancelAnimationFrame(animationRef.current);
                }
                setIsRunning(false);
                setCartTravel(parseFloat(e.target.value));
              }}
              disabled={isRunning}
              className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
              <span>0 (Tope Izq.)</span>
              <span>112 (Punto Medio)</span>
              <span>225 (Lanzador Der.)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="default"
              size="xs"
              onClick={handleLaunch}
              disabled={isRunning}
              className="text-xs h-7.5 gap-1.5 font-semibold flex-1 shadow-xs"
            >
              <Play className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Disparando...' : '▶ Disparar Lanzador'}</span>
            </Button>

            <Button
              variant="outline"
              size="icon-xs"
              onClick={handleReset}
              className="h-7.5 w-7.5"
              title="Resetear posición"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Col 2: Dynamics Control (Impulse force & Mass) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-amber-500" />
              <span>Fuerza de Eyección & Masa</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              a = {(impulseForce / cartMass).toFixed(2)} m/s²
            </Badge>
          </div>

          {/* Impulse force */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Fuerza del cilindro (F):</span>
              <span className="font-mono font-bold text-amber-500">{impulseForce.toFixed(2)} N</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5.0}
              step={0.1}
              value={impulseForce}
              onChange={(e) => setImpulseForce(parseFloat(e.target.value))}
              disabled={isRunning}
              className="w-full accent-amber-500 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Glider Mass m1 */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Masa del carro (m):</span>
              <span className="font-mono font-bold text-sky-500">{(cartMass * 1000).toFixed(0)} g</span>
            </div>
            <input
              type="range"
              min={0.10}
              max={0.30}
              step={0.01}
              value={cartMass}
              onChange={(e) => setCartMass(parseFloat(e.target.value))}
              disabled={isRunning}
              className="w-full accent-sky-500 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Col 3: Real-Time Dynamic Kinematics */}
        <div className="space-y-2 border-l pl-4 hidden md:block">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-sky-500" />
            <span>Cinemática del Lanzamiento</span>
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-1.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[10px]">Aceleración (a)</span>
              <span className="font-mono font-semibold text-foreground">
                {(impulseForce / cartMass).toFixed(2)} m/s²
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[10px]">Velocidad v(x)</span>
              <span className="font-mono font-semibold text-sky-500">
                {pose.state.currentVelocity.toFixed(3)} m/s
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[10px]">Energía Cinética</span>
              <span className="font-mono font-semibold text-foreground">
                {(0.5 * cartMass * Math.pow(pose.state.currentVelocity, 2)).toFixed(3)} J
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[10px]">Estado Cerrojo SG90</span>
              <span
                className={`font-mono font-semibold ${
                  isRunning ? 'text-amber-500' : 'text-emerald-500'
                }`}
              >
                {isRunning ? 'Disparado' : 'Listo'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
