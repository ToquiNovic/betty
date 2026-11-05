'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plate, Solid, Line, Wire, Dots } from '@/components/iso/draw';
import {
  BASE_ART,
  PIVOT_ART,
  SERVO1_ART,
  SERVO2_ART,
  DIAL_ART,
  ESP32_ART,
} from './geometry';
import { computePlanoPose } from './pose';
import {
  AnatomyEasing,
  evaluateEasing,
  formatPlanoReadout,
  CRITICAL_SLIP_ANGLE,
} from './model';
import { VIEW_WIDTH, VIEW_HEIGHT } from './view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  RotateCcw,
  Sliders,
  Activity,
  Sparkles,
  X,
  Info,
  Cpu,
  Wrench,
  Layers,
  Box,
  Compass,
  ChevronRight,
  ChevronLeft,
  Zap,
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
  telemetrySource?: string;
}

export const ANATOMY_PARTS: Record<string, AnatomyPartInfo> = {
  ramp: {
    id: 'ramp',
    name: 'Rampa Basculante Ranurada',
    tag: 'Viga Principal',
    category: 'Cinemática & Estructura',
    summary: 'Pista de rodadura y deslizamiento con inclinación angular variable de 0° a 75°.',
    description:
      'Perfil guía mecanizado en aleación ligera de aluminio con ranura central de deslizamiento y tope superior de retención de seguridad. Diseñada con momento de inercia reducido para garantizar una respuesta ágil ante perfiles de aceleración senoidal y polinómica.',
    specs: [
      { label: 'Longitud útil', value: '350 mm' },
      { label: 'Rango angular', value: '0.0° a 75.0°' },
      { label: 'Tope superior', value: 'Chapa de aluminio 2 mm' },
      { label: 'Material', value: 'Aluminio 6061-T6 anodizado' },
    ],
    physicsRole:
      'Determina la descomposición gravitatoria del cuerpo de prueba en fuerza tangencial impulsora (Ft = m·g·sen θ) y fuerza normal de compresión (Fn = m·g·cos θ).',
    telemetrySource: 'Cálculo analítico en tiempo real derivado de la posición servo S1.',
  },
  cube: {
    id: 'cube',
    name: 'Cubo Sensorizado (Masa de Prueba)',
    tag: 'Carga Instrumental',
    category: 'Detección & Fricción',
    summary: 'Masa de ensayo de 50g con detector óptico infrarrojo TCRT5000 y telemetría de resbalamiento.',
    description:
      'Cuerpo de prueba instrumentado situado sobre la rampa. En reposo se mantiene adherido por fricción estática hasta que la pendiente alcanza el ángulo crítico θc = 30.1°, momento en el cual el sensor óptico detecta el inicio del deslizamiento y congela la medición.',
    specs: [
      { label: 'Masa calibrada', value: '50.0 g' },
      { label: 'Detector óptico', value: 'TCRT5000 Infrarrojo' },
      { label: 'Ángulo crítico (θc)', value: '30.1°' },
      { label: 'Coef. fricción (μs)', value: 'tan(30.1°) ≈ 0.5797' },
    ],
    physicsRole:
      'Permite la deducción experimental directa de la ley de rozamiento estático de Coulomb-Amontons (μs = tan θc).',
    telemetrySource: 'Pin digital GPIO 4 del ESP32 (interrupción DO activa en caída).',
  },
  servos: {
    id: 'servos',
    name: 'Servomotores MG996R Duales',
    tag: 'Actuación de Potencia',
    category: 'Accionamiento Electromecánico',
    summary: 'Par de servomotores con engranajes metálicos operando en simetría invertida (180° - θ).',
    description:
      'Actuadores de alta torsión instalados simétricamente a ambos lados de la base. Operan en contra-fase angular sincronizada (S1: GPIO 18, S2: GPIO 5) para balancear la carga torsional y anular momentos flectores asimétricos sobre el eje de elevación.',
    specs: [
      { label: 'Torque nominal', value: '11.0 kg·cm a 4.8V (1.08 N·m)' },
      { label: 'Tren de engranajes', value: 'Bronce fosforado y acero' },
      { label: 'Control PWM', value: 'LEDC hardware 50 Hz (20 ms)' },
      { label: 'Distribución pines', value: 'S1: GPIO 18 | S2: GPIO 5' },
    ],
    physicsRole:
      'Vencen el par gravitatorio resistente de la viga τ = m_rampa · g · r_cm · cos(θ) mediante un eslabonamiento articulado de biela-manivela.',
    telemetrySource: 'Registros de posición angular en tiempo real emitidos por Web Serial en la trama TLM.',
  },
  esp32: {
    id: 'esp32',
    name: 'Microcontrolador ESP32 DevKit V1',
    tag: 'Cerebro de Control',
    category: 'Electrónica & Firmware',
    summary: 'SoC dual-core a 240 MHz con generación de curvas de easing por hardware y enlace Web Serial.',
    description:
      'Nodo inteligente de procesamiento embebido que ejecuta el algoritmo cinemático en tiempo real. Genera las señales PWM sincrónicas, muestrea el sensor óptico a alta frecuencia y transmite telemetría estructurada hacia Betty Platform a 115200 baudios.',
    specs: [
      { label: 'Microprocesador', value: 'Xtensa Dual-Core 32-bit LX6 240MHz' },
      { label: 'Velocidad serie', value: '115200 baudios (USB UART)' },
      { label: 'Resolución timer', value: 'Timers por hardware de 64-bit' },
      { label: 'Alimentación', value: '5V externa estabilizada 3A' },
    ],
    physicsRole:
      'Ejecuta la discretización temporal del movimiento evaluando funciones de easing cúbicas y trigonométricas para evitar saltos de aceleración (jerk nulo).',
    telemetrySource: 'Puerto serie virtual Web Serial API y WebSockets Betty Cloud.',
  },
  pushrods: {
    id: 'pushrods',
    name: 'Bielas Mecánicas & Varillaje',
    tag: 'Transmisión Cinemática',
    category: 'Eslabones Mecánicos',
    summary: 'Varillas de tracción en acero templado con rótulas esféricas micrométricas.',
    description:
      'Eslabones mecánicos de precisión que comunican los brazos de palanca de los servomotores con los puntos de anclaje de la rampa basculante, traduciendo el giro del servomotor en elevación vertical estable.',
    specs: [
      { label: 'Material', value: 'Acero templado pulido Ø 2 mm' },
      { label: 'Terminales', value: 'Rótulas esféricas M2 micro' },
      { label: 'Longitud entre ejes', value: '95 mm calibrados' },
      { label: 'Capacidad axial', value: '45 N sin pandeo' },
    ],
    physicsRole:
      'Transmite la fuerza impulsora de los servos hacia el plano respetando la geometría del cuadrilátero articulado.',
  },
  pivot: {
    id: 'pivot',
    name: 'Eje Pivote & Cojinetes de Bronce',
    tag: 'Centro de Rotación',
    category: 'Elementos Mecánicos',
    summary: 'Eje transversal rectificado apoyado sobre cojinetes sinterizados autolubricados.',
    description:
      'Centro de giro del plano inclinado fijado a la bancada principal. Asegura una rotación pura con coeficiente de fricción residual mínimo para evitar pérdidas dinámicas durante la experimentación.',
    specs: [
      { label: 'Diámetro de eje', value: 'Ø 6.0 mm tolerancia h7' },
      { label: 'Material de eje', value: 'Acero inoxidable AISI 304' },
      { label: 'Cojinetes', value: 'Bronce sinterizado autolubricado SAE 660' },
      { label: 'Holgura radial', value: '< 0.02 mm' },
    ],
    physicsRole:
      'Define el origen de coordenadas inercial (0,0) del sistema cinemático y absorbe las cargas normales del experimento.',
  },
  dial: {
    id: 'dial',
    name: 'Goniómetro / Dial Analógico',
    tag: 'Lectura Visual Directa',
    category: 'Instrumentación Analógica',
    summary: 'Escala graduada de 0° a 90° con aguja móvil acoplada mecánicamente al plano.',
    description:
      'Indicador visual de referencia analógica con carcasa metálica que permite al experimentador contrastar visualmente la lectura angular física contra la telemetría digital calculada por el ESP32.',
    specs: [
      { label: 'Rango de cuadrante', value: '0° a 90° sexagesimales' },
      { label: 'Resolución de marca', value: '1.0° (divisiones menores)' },
      { label: 'Carcasa', value: 'Acero inoxidable estampado' },
      { label: 'Diámetro esfera', value: '55 mm' },
    ],
    physicsRole:
      'Garantiza la trazabilidad y calibración visual independiente de la electrónica digital.',
  },
  chassis: {
    id: 'chassis',
    name: 'Chasis Base Mecanizado',
    tag: 'Bancada Rígida',
    category: 'Estructura & Soporte',
    summary: 'Plataforma soporte de aluminio anodizado con apoyos elastoméricos antivibración.',
    description:
      'Bancada inferior sobre la que se anclan con precisión micrométrica los soportes del pivote, los servomotores MG996R y la placa de control ESP32. Proporciona masa y rigidez para evitar desplazamientos por inercia.',
    specs: [
      { label: 'Dimensiones', value: '420 × 95 × 18 mm' },
      { label: 'Apoyos', value: '4 patas de caucho sintético NBR' },
      { label: 'Tornillería', value: 'Acero inoxidable M3 Allen' },
      { label: 'Acabado', value: 'Anodizado negro mate' },
    ],
    physicsRole:
      'Soporta la reacción total del sistema y mantiene la nivelación horizontal del banco de pruebas.',
  },
  nameplate: {
    id: 'nameplate',
    name: 'Placa Técnica de Identificación',
    tag: 'Metrología & Trazabilidad',
    category: 'Marcado de Laboratorio',
    summary: 'Placa de latón grabada al aguafuerte con código de calibración Betty IoT Lab.',
    description:
      'Elemento de identificación metrológica que vincula la maqueta física con su registro digital unificado en la base de datos de la plataforma.',
    specs: [
      { label: 'Material', value: 'Latón pulido de 0.8 mm' },
      { label: 'Fijación', value: 'Micro-remaches de latón Ø 1.5 mm' },
      { label: 'Identificador', value: 'EXP-PLANO-ESP32-01' },
    ],
    physicsRole:
      'Asegura la trazabilidad de los experimentos y constantes físicas del banco.',
  },
};

const PART_KEYS = Object.keys(ANATOMY_PARTS);

export function PlanoInclinadoAnatomyFigure() {
  const [angle, setAngle] = useState<number>(24.0);
  const [easing, setEasing] = useState<AnatomyEasing>('SMOOTHERSTEP');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  const pose = computePlanoPose(angle);
  const readout = formatPlanoReadout(pose.state);

  const activePartInfo = selectedPart ? ANATOMY_PARTS[selectedPart] : null;

  // Play easing motion demonstration
  const handlePlayEasing = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAngle(0);

    const startTime = performance.now();
    const duration = 2400; // ms
    const targetAngle = 45;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedT = evaluateEasing(easing, progress);
      const current = easedT * targetAngle;

      setAngle(Math.round(current * 10) / 10);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(frame);
      } else {
        setIsAnimating(false);
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
    setIsAnimating(false);
    setAngle(0);
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

  // Helper for svg interaction styling
  const getGroupStyle = (partId: string) => {
    const isSelected = selectedPart === partId;
    const isHovered = hoveredPart === partId;

    if (isSelected) {
      return {
        cursor: 'pointer',
        filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.9)) brightness(1.2)',
        transition: 'all 0.2s ease',
      };
    }
    if (isHovered) {
      return {
        cursor: 'pointer',
        filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.8)) brightness(1.15)',
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
          <Info className="h-4 w-4 text-amber-500" />
          <span>Explorador de Anatomía:</span>
          <span className="text-[11px] font-normal text-muted-foreground hidden sm:inline">
            Tocá cualquier pieza en el diagrama o seleccioná abajo:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {PART_KEYS.map((key) => {
            const part = ANATOMY_PARTS[key];
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
          title="Plano Inclinado & Telemetría ESP32"
          hint="Hacé clic en cualquier componente para ver su ficha técnica e interactuar con el modelo"
          readout={readout}
          keys={[
            { mark: 'raised', label: 'Rampa de aluminio y cubo sensorizado' },
            { mark: 'edge', label: 'Bielas mecánicas y servos MG996R' },
            { mark: 'dotted', label: 'Rango de inclinación 0°–75°' },
            { mark: 'lit', label: 'ESP32 & Enlace Web Serial 115200' },
          ]}
          caption={`Maqueta experimental para control de cinemática y telemetría en tiempo real. Utiliza dos servomotores MG996R con torque simétrico invertido (S1: ${pose.state.servo1Angle}° / S2: ${pose.state.servo2Angle}°), compensación por torque gravitatorio (τ = ${pose.state.torqueNm} N·m) y análisis de fricción estática con ángulo crítico de deslizamiento en ${CRITICAL_SLIP_ANGLE}°.`}
        >
          <svg
            className="iso-svg"
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            role="img"
            aria-label="Diagrama isométrico interactivo de la maqueta de Plano Inclinado"
            focusable="false"
          >
            {/* A. Long Track Base Chassis & Feet */}
            <g
              key="base-group"
              onClick={() => setSelectedPart('chassis')}
              onMouseEnter={() => setHoveredPart('chassis')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('chassis')}
              className="cursor-pointer"
            >
              <path className="iso-halo" d={BASE_ART.halo} />
              {BASE_ART.feet.map((footSolids, idx) => (
                <g key={`foot-${idx}`}>
                  <Solid paths={footSolids[0]} className="mat-servo-black" tone="lo" crease="faint" />
                  <Solid paths={footSolids[1]} className="mat-steel" tone="hi" crease="faint" />
                </g>
              ))}
              <Solid paths={BASE_ART.slab} className="mat-chassis" tone="hi" crease="faint" />
              <Line d={BASE_ART.groove} tone="lo" />
              <Line d={BASE_ART.screwRings} tone="lo" />
              <Dots points={BASE_ART.screws} size={0.55} tone="hi" />

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
                <Solid paths={BASE_ART.plate} className="mat-brass" tone="hi" crease="none" />
                <Line d={BASE_ART.plateLine} tone="faint" />
                <Line d={BASE_ART.plateRule} tone="lo" />
                <Dots points={BASE_ART.plateRivets} size={0.45} tone="hi" />
              </g>
            </g>

            {/* B. Pivot Journal Brackets & Cross-Axle Pin */}
            <g
              key="pivot-group"
              onClick={() => setSelectedPart('pivot')}
              onMouseEnter={() => setHoveredPart('pivot')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('pivot')}
              className="cursor-pointer"
            >
              <Solid paths={PIVOT_ART.leftBracket} className="mat-steel" tone="mid" crease="faint" />
              <Solid paths={PIVOT_ART.rightBracket} className="mat-steel" tone="mid" crease="faint" />
              <Solid paths={PIVOT_ART.leftBearing} className="mat-brass" tone="hi" crease="none" />
              <Solid paths={PIVOT_ART.rightBearing} className="mat-brass" tone="hi" crease="none" />
              {/* Cross-Axle pin */}
              <Line
                d={`M${PIVOT_ART.axlePointL[0]} ${PIVOT_ART.axlePointL[1]} L${PIVOT_ART.axlePointR[0]} ${PIVOT_ART.axlePointR[1]}`}
                tone="lit"
              />
            </g>

            {/* C. Dual MG996R Servomotors (Real Red & Black Casing + Brass Horns) */}
            <g
              key="servos-group"
              onClick={() => setSelectedPart('servos')}
              onMouseEnter={() => setHoveredPart('servos')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('servos')}
              className="cursor-pointer"
            >
              {/* Servo 1 (GPIO 18) */}
              <Solid paths={SERVO1_ART.ears} className="mat-servo-black" tone="lo" crease="faint" />
              <Solid paths={SERVO1_ART.redBody} className="mat-servo-red" tone="hi" crease="faint" />
              <Solid paths={SERVO1_ART.topCase} className="mat-servo-black" tone="mid" crease="faint" />
              <Solid paths={SERVO1_ART.hornHub} className="mat-brass" tone="hi" crease="none" />
              <Solid paths={SERVO1_ART.hornArm} className="mat-brass" tone="hi" crease="faint" />
              <Dots points={SERVO1_ART.screws} size={0.45} tone="hi" />

              {/* Servo 2 (GPIO 5) */}
              <Solid paths={SERVO2_ART.ears} className="mat-servo-black" tone="lo" crease="faint" />
              <Solid paths={SERVO2_ART.redBody} className="mat-servo-red" tone="hi" crease="faint" />
              <Solid paths={SERVO2_ART.topCase} className="mat-servo-black" tone="mid" crease="faint" />
              <Solid paths={SERVO2_ART.hornHub} className="mat-brass" tone="hi" crease="none" />
              <Solid paths={SERVO2_ART.hornArm} className="mat-brass" tone="hi" crease="faint" />
              <Dots points={SERVO2_ART.screws} size={0.45} tone="hi" />
            </g>

            {/* D. ESP32 Microcontroller Unit (Green PCB, Shield & LEDs) */}
            <g
              key="esp32-group"
              onClick={() => setSelectedPart('esp32')}
              onMouseEnter={() => setHoveredPart('esp32')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('esp32')}
              className="cursor-pointer"
            >
              {ESP32_ART.standoffs.map((standoff, i) => (
                <Solid key={`st-${i}`} paths={standoff} className="mat-brass" tone="mid" crease="none" />
              ))}
              <Solid paths={ESP32_ART.pcb} className="mat-pcb" tone="hi" crease="faint" />
              <Solid paths={ESP32_ART.shield} className="mat-steel" tone="hi" crease="faint" />
              <Solid paths={ESP32_ART.usb} className="mat-servo-black" tone="hi" crease="faint" />
              <Line d={ESP32_ART.headers} tone="lo" />
              <Dots points={ESP32_ART.leds} size={0.65} tone="hi" pulse />

              {/* USB Web Serial Cable */}
              <Wire
                from={ESP32_ART.usbPortCenter}
                to={[ESP32_ART.usbPortCenter[0] + 55, ESP32_ART.usbPortCenter[1] + 20]}
                tone="lit"
                ends="both"
                size={1.6}
              />
            </g>

            {/* E. Angle Dial Gauge (0° to 90°) */}
            <g
              key="dial-group"
              onClick={() => setSelectedPart('dial')}
              onMouseEnter={() => setHoveredPart('dial')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('dial')}
              className="cursor-pointer"
            >
              <Solid paths={DIAL_ART.stem} className="mat-steel" tone="lo" crease="none" />
              <Solid paths={DIAL_ART.casing} className="mat-steel" tone="mid" crease="faint" />
              <Line d={DIAL_ART.bezel} tone="hi" />
              <Line d={DIAL_ART.innerFace} tone="faint" />
              <Line d={DIAL_ART.ticksMinor} tone="lo" />
              <Line d={DIAL_ART.ticksMajor} tone="mid" />

              {/* Moving Needle */}
              <Line d={pose.dial.needle} tone="lit" />
              <circle
                className="iso-wire-end"
                cx={pose.dial.hub[0]}
                cy={pose.dial.hub[1]}
                r={2.4}
              />
            </g>

            {/* F. Mechanical Pushrods (Steel Linkages) */}
            <g
              key="pushrods-group"
              onClick={() => setSelectedPart('pushrods')}
              onMouseEnter={() => setHoveredPart('pushrods')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('pushrods')}
              className="cursor-pointer"
            >
              <Line d={pose.pushrods.rod1} tone="lit" />
              <Line d={pose.pushrods.rod2} tone="lit" />
              <circle
                className="iso-wire-end"
                cx={pose.pushrods.lugL[0]}
                cy={pose.pushrods.lugL[1]}
                r={2.0}
              />
              <circle
                className="iso-wire-end"
                cx={pose.pushrods.lugR[0]}
                cy={pose.pushrods.lugR[1]}
                r={2.0}
              />
            </g>

            {/* G. Dynamic Incline Ramp Beam (Matching 3D Reference Model) */}
            <g
              key="ramp-group"
              className="iso-solid mat-beam cursor-pointer"
              onClick={() => setSelectedPart('ramp')}
              onMouseEnter={() => setHoveredPart('ramp')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('ramp')}
            >
              {/* Shaded sides */}
              <path className="iso-shade" data-shade="1" d={pose.ramp.right} />
              <path className="iso-shade" data-shade="2" d={pose.ramp.front} />
              <path className="iso-shade" data-shade="0" d={pose.ramp.left} />
              <path className="iso-top" d={pose.ramp.top} />
              <path className="iso-line iso-edge" data-tone="hi" d={pose.ramp.outline} />

              {/* Central guide groove & millimeter ticks */}
              <Line d={pose.ramp.groove} tone="lo" />
              <Line d={pose.ramp.ticks} tone="mid" />
              <path className="iso-fill" d={pose.ramp.stop} />
              <path className="iso-line iso-edge" data-tone="hi" d={pose.ramp.stop} />
            </g>

            {/* H. Sliding Sensor Cube Cargo (White Alabaster Body) */}
            <g
              key="cargo-group"
              className="iso-solid mat-cube cursor-pointer"
              data-lit=""
              onClick={() => setSelectedPart('cube')}
              onMouseEnter={() => setHoveredPart('cube')}
              onMouseLeave={() => setHoveredPart(null)}
              style={getGroupStyle('cube')}
            >
              <path className="iso-shade" data-shade="1" d={pose.cube.right} />
              <path className="iso-shade" data-shade="2" d={pose.cube.front} />
              <path className="iso-shade" data-shade="0" d={pose.cube.left} />
              <path className="iso-top" d={pose.cube.top} />
              <path
                className="iso-line iso-edge"
                data-tone={pose.state.isSliding ? 'red' : 'lit'}
                d={pose.cube.outline}
              />
              {/* Telemetry IMU Active Sensor Indicator */}
              <circle
                cx={pose.cube.center[0]}
                cy={pose.cube.center[1]}
                r={2.4}
                fill="var(--anatomy-lit)"
              />
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
                Especificaciones Técnicas
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
                <span>Rol en la Física & Telemetría:</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {activePartInfo.physicsRole}
              </p>
              {activePartInfo.telemetrySource && (
                <div className="text-[9px] font-mono text-primary/80 pt-0.5 border-t border-primary/10">
                  📡 {activePartInfo.telemetrySource}
                </div>
              )}
            </div>

            {/* Live Metrics for the Selected Component */}
            {activePartInfo.id === 'ramp' && (
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] flex items-center justify-between">
                <span className="text-sky-600 dark:text-sky-400 font-semibold text-[10px]">Ángulo en vivo:</span>
                <span className="font-mono font-bold text-sky-500">{angle.toFixed(1)}°</span>
              </div>
            )}

            {activePartInfo.id === 'servos' && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] flex items-center justify-between">
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px]">S1 / S2 en vivo:</span>
                <span className="font-mono font-bold text-amber-500">{pose.state.servo1Angle}° / {pose.state.servo2Angle}°</span>
              </div>
            )}

            {activePartInfo.id === 'cube' && (
              <div className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                pose.state.isSliding ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              }`}>
                <span className="font-semibold text-[10px]">Estado de movimiento:</span>
                <span className="font-mono font-bold">{pose.state.isSliding ? '🛑 DESLIZANDO' : '✅ ADHERIDO'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Interactive Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-xs">
        {/* Col 1: Manual Angle Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>Ángulo de Elevación (θ)</span>
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              {angle.toFixed(1)}°
            </Badge>
          </div>

          <div className="py-2">
            <input
              type="range"
              min={0}
              max={75}
              step={0.5}
              value={angle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (isAnimating && animationRef.current) {
                  cancelAnimationFrame(animationRef.current);
                }
                setIsAnimating(false);
                setAngle(parseFloat(e.target.value));
              }}
              disabled={isAnimating}
              className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
              <span>0° (Plano)</span>
              <span>30.1° (Fricción)</span>
              <span>75° (Máx)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[0, 15, 30.1, 45, 60].map((preset) => (
              <Button
                key={preset}
                variant={Math.abs(angle - preset) < 0.2 ? 'default' : 'outline'}
                size="xs"
                onClick={() => setAngle(preset)}
                disabled={isAnimating}
                className="text-[11px] h-6 px-2"
              >
                {preset === 30.1 ? '30.1° (μ Fricción)' : `${preset}°`}
              </Button>
            ))}
          </div>
        </div>

        {/* Col 2: Easing Curve Simulator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Curva de Easing Física</span>
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              {easing}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['SMOOTHERSTEP', 'CUBIC', 'SINE', 'QUAD', 'LINEAR'] as AnatomyEasing[]).map(
              (curve) => (
                <Button
                  key={curve}
                  variant={easing === curve ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => setEasing(curve)}
                  disabled={isAnimating}
                  className="text-[11px] h-6 px-2 font-mono"
                >
                  {curve}
                </Button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="default"
              size="xs"
              onClick={handlePlayEasing}
              disabled={isAnimating}
              className="text-xs h-7 gap-1.5 font-semibold flex-1"
            >
              <Play className={`h-3 w-3 ${isAnimating ? 'animate-spin' : ''}`} />
              <span>{isAnimating ? 'Simulando...' : 'Probar Easing'}</span>
            </Button>

            <Button
              variant="outline"
              size="icon-xs"
              onClick={handleReset}
              className="h-7 w-7"
              title="Resetear a 0°"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Col 3: Real-Time Physical Metrics */}
        <div className="space-y-2 border-l pl-4 hidden md:block">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-sky-500" />
            <span>Métricas Cinemáticas</span>
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-1.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[10px]">Servo 1 / Servo 2</span>
              <span className="font-mono font-semibold text-foreground">
                {pose.state.servo1Angle}° / {pose.state.servo2Angle}°
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[10px]">Torque Servos</span>
              <span className="font-mono font-semibold text-amber-500">
                {pose.state.torqueNm} N·m
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[10px]">Fuerza Normal (N)</span>
              <span className="font-mono font-semibold text-foreground">
                {pose.state.normalForceN} N
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[10px]">Estado Cubo</span>
              <span
                className={`font-mono font-semibold ${
                  pose.state.isSliding ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {pose.state.isSliding ? 'Deslizando' : 'Estático'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
