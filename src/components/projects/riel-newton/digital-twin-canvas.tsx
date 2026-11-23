'use client';

import React, { useEffect, useRef } from 'react';

export interface RielDigitalTwinCanvasProps {
  leverPosition?: number; // 0 (reposo), 1, 2, 3, 4 (muescas de tensado)
  servoAngle?: number; // 0° (cerrado) a 90° (abierto)
  isBallPresent?: boolean; // Carro/bola lista en la zona de lanzamiento
  inTransit?: boolean; // Si el móvil está recorriendo el riel
  impactDetected?: boolean; // Si impactó la meta
  transitProgress?: number; // 0.0 (inicio S1) a 1.0 (meta)
  sensorsState?: {
    s1: boolean; // true = obstruido / activo
    s2: boolean;
    s3: boolean;
    s4: boolean;
    fsr: boolean;
  };
  currentVelocity?: number; // m/s
  finalVelocity?: number; // m/s
  transitTime?: number; // segundos
  netForce?: number; // N
  acceleration?: number; // m/s²
  kineticEnergy?: number; // J
  momentum?: number; // N·s
  isConnected?: boolean;
  connectionSource?: 'bluetooth' | 'usb' | 'cloud' | 'none';
}

export function DigitalTwinCanvas({
  leverPosition = 1,
  servoAngle = 0,
  isBallPresent = true,
  inTransit = false,
  impactDetected = false,
  transitProgress = 0,
  sensorsState = { s1: true, s2: false, s3: false, s4: false, fsr: false },
  currentVelocity = 0,
  finalVelocity = 0,
  transitTime = 0,
  netForce = 0,
  acceleration = 0,
  kineticEnergy = 0,
  momentum = 0,
  isConnected = false,
  connectionSource = 'none',
}: RielDigitalTwinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animProgressRef = useRef<number>(transitProgress);
  const impactFlashRef = useRef<number>(0);

  // Mantener referencia al progreso animado
  useEffect(() => {
    animProgressRef.current = transitProgress;
  }, [transitProgress]);

  useEffect(() => {
    if (impactDetected) {
      impactFlashRef.current = 1.0;
    }
  }, [impactDetected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Limpieza y Fondo Gradiente Alta Tecnología
      ctx.clearRect(0, 0, width, height);

      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        15,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.1
      );
      bgGrad.addColorStop(0, '#101722');
      bgGrad.addColorStop(1, '#070b10');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Rejilla técnica tenue
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Geometría y Coordenadas del Riel
      const marginX = 80;
      const startX = marginX + 30; // Posición S1 / Origen
      const endX = width - marginX - 15; // Meta FSR
      const railLength = endX - startX;
      const railY = height * 0.58;

      // Bancada inferior de soporte
      ctx.fillStyle = '#182430';
      ctx.fillRect(marginX - 20, railY + 12, railLength + 70, 16);
      ctx.fillStyle = '#223242';
      ctx.fillRect(marginX - 20, railY + 12, railLength + 70, 2);

      // Patas de bancada
      ctx.fillStyle = '#121b24';
      ctx.fillRect(marginX - 10, railY + 28, 14, 24);
      ctx.fillRect(marginX + railLength / 2 + 5, railY + 28, 14, 24);
      ctx.fillRect(endX + 20, railY + 28, 14, 24);

      // Soportes elevadores de la guía
      ctx.fillStyle = '#2e4152';
      ctx.fillRect(startX - 15, railY + 2, 10, 10);
      ctx.fillRect(startX + railLength * 0.35, railY + 2, 10, 10);
      ctx.fillRect(startX + railLength * 0.7, railY + 2, 10, 10);
      ctx.fillRect(endX - 5, railY + 2, 10, 10);

      // Viga principal del riel lineal (aluminio anodizado)
      const railGrad = ctx.createLinearGradient(0, railY - 6, 0, railY + 6);
      railGrad.addColorStop(0, '#537188');
      railGrad.addColorStop(0.5, '#2e4050');
      railGrad.addColorStop(1, '#1b2631');
      ctx.fillStyle = railGrad;
      ctx.beginPath();
      ctx.roundRect(startX - 25, railY - 6, railLength + 45, 12, 3);
      ctx.fill();

      // Ranura central de guía
      ctx.strokeStyle = '#0e1720';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX - 20, railY);
      ctx.lineTo(endX + 10, railY);
      ctx.stroke();

      // Escala milimétrica grabada
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      const ticks = 40;
      for (let i = 0; i <= ticks; i++) {
        const tx = startX + (i / ticks) * railLength;
        const tickH = i % 5 === 0 ? 6 : 3;
        ctx.beginPath();
        ctx.moveTo(tx, railY - 6);
        ctx.lineTo(tx, railY - 6 + tickH);
        ctx.stroke();
      }

      // 3. Mecanismo de Tensado y Émbolo Percutor (Lado Izquierdo)
      const clampedLever = Math.max(0, Math.min(4, leverPosition));
      const pullbackPx = clampedLever * 7;
      const plungerX = startX - 22 - pullbackPx;

      // Cilindro coaxial del percutor
      ctx.fillStyle = '#1c2834';
      ctx.fillRect(startX - 58, railY - 8, 32, 16);
      ctx.strokeStyle = '#3d5265';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startX - 58, railY - 8, 32, 16);

      // Resorte helicoidal (comprimido según pullbackPx)
      const springStartX = startX - 54;
      const springEndX = plungerX - 2;
      const springSegments = 8;
      const springStep = (springEndX - springStartX) / springSegments;

      ctx.beginPath();
      ctx.strokeStyle = clampedLever > 0 ? '#f59e0b' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.moveTo(springStartX, railY);
      for (let i = 0; i < springSegments; i++) {
        const sx = springStartX + springStep * (i + 0.5);
        const sy = i % 2 === 0 ? railY - 6 : railY + 6;
        ctx.lineTo(sx, sy);
      }
      ctx.lineTo(springEndX, railY);
      ctx.stroke();

      // Cabeza y vástago cromado del émbolo
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(plungerX, railY - 9, 6, 18);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(plungerX - 12, railY - 3, 12, 6);

      // Palanca vertical de tensado con perilla
      ctx.strokeStyle = clampedLever > 0 ? '#38bdf8' : '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(plungerX + 3, railY - 8);
      ctx.lineTo(plungerX + 3, railY - 26);
      ctx.stroke();

      ctx.fillStyle = clampedLever > 0 ? '#38bdf8' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(plungerX + 3, railY - 28, 5, 0, Math.PI * 2);
      ctx.fill();

      // Etiqueta de muesca
      ctx.fillStyle = clampedLever > 0 ? '#38bdf8' : '#64748b';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        clampedLever === 0 ? 'REPOSO' : `MUESCA ${clampedLever}`,
        plungerX + 3,
        railY - 38
      );

      // 4. Servomotor Onboard / Compuerta de Gatillo
      const gateX = startX - 6;
      ctx.fillStyle = '#0284c7'; // Azul TowerPro SG90
      ctx.fillRect(gateX - 8, railY - 28, 16, 14);

      // Brazo de leva del servo (rotación según servoAngle)
      const servoRad = (servoAngle * Math.PI) / 180;
      const leverArmLen = 14;
      const armEndX = gateX + Math.sin(servoRad) * leverArmLen;
      const armEndY = railY - 14 - Math.cos(servoRad) * leverArmLen;

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(gateX, railY - 14);
      ctx.lineTo(armEndX, armEndY);
      ctx.stroke();

      // 5. Fotocompuertas Infrarrojas (S1, S2, S3, S4)
      const sensorPositions = [
        { id: 'S1', x: startX, active: sensorsState.s1, label: '0 cm (S1)' },
        { id: 'S2', x: startX + railLength * 0.05, active: sensorsState.s2, label: '2.4 cm (S2)' },
        { id: 'S3', x: startX + railLength * 0.10, active: sensorsState.s3, label: '4.8 cm (S3)' },
        { id: 'S4', x: startX + railLength * 0.15, active: sensorsState.s4, label: '7.2 cm (S4)' },
      ];

      sensorPositions.forEach((s) => {
        // Soporte en "U" de la fotocompuerta
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(s.x - 4, railY - 20, 8, 10);
        ctx.fillRect(s.x - 4, railY + 10, 8, 8);

        // Haz óptico infrarrojo
        ctx.strokeStyle = s.active ? '#ef4444' : 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = s.active ? 2 : 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(s.x, railY - 10);
        ctx.lineTo(s.x, railY + 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // LED indicador en el sensor
        ctx.fillStyle = s.active ? '#22c55e' : '#64748b';
        ctx.beginPath();
        ctx.arc(s.x, railY - 22, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Etiqueta de la fotocompuerta
        ctx.fillStyle = s.active ? '#22c55e' : '#94a3b8';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(s.id, s.x, railY - 28);
      });

      // 6. Sensor de Impacto FSR en Meta (Extremo Derecho)
      const goalX = endX;
      ctx.fillStyle = '#334155';
      ctx.fillRect(goalX, railY - 18, 12, 34);

      // Almohadilla piezoeléctrica / FSR
      const isFlashing = impactFlashRef.current > 0;
      ctx.fillStyle = isFlashing ? '#f43f5e' : '#059669';
      ctx.fillRect(goalX - 3, railY - 14, 4, 26);

      if (isFlashing) {
        // Ondas de choque visuales de colisión
        ctx.strokeStyle = `rgba(244, 63, 94, ${impactFlashRef.current})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(goalX - 2, railY, 15 * (2 - impactFlashRef.current), 0, Math.PI * 2);
        ctx.stroke();
        impactFlashRef.current = Math.max(0, impactFlashRef.current - 0.03);
      }

      // Etiqueta Meta FSR
      ctx.fillStyle = isFlashing ? '#f43f5e' : '#10b981';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('META FSR', goalX + 6, railY - 24);

      // 7. Carro Móvil Deslizante (Glider)
      if (isBallPresent || inTransit || transitProgress > 0) {
        // Calcular posición interpolada X
        let currentX = startX;
        if (inTransit || transitProgress > 0) {
          currentX = startX + Math.min(1.0, Math.max(0.0, animProgressRef.current)) * railLength;
        }

        // Chasis metálico del carro
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(currentX - 16, railY - 15, 32, 14, 3);
        ctx.fill();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4 Rodamientos miniatura bajo el carro
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(currentX - 10, railY + 1, 3.5, 0, Math.PI * 2);
        ctx.arc(currentX + 10, railY + 1, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Aleta indicadora de corte óptico
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(currentX - 1.5, railY - 23, 3, 9);

        // Display LCD Onboard miniatura
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(currentX - 12, railY - 13, 24, 7);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 6px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${currentVelocity.toFixed(1)}m/s`,
          currentX,
          railY - 8
        );
      }

      // 8. Réplica física del Display LCD 1602 montado en la bancada del Riel
      let cvLine0 = 'Riel de Newton  ';
      let cvLine1 = 'Sistema Listo   ';
      let cvTag = 'LCD 1602 (I2C 0x27) · LISTO';

      if (inTransit) {
        cvLine0 = 'Viajando...     ';
        cvLine1 = 'Esperando choque';
        cvTag = 'LCD 1602 · EN TRÁNSITO';
      } else if (impactDetected || transitTime > 0) {
        const page = Math.floor(Date.now() / 2500) % 3;
        if (page === 0) {
          cvLine0 = `T:${transitTime.toFixed(2)}s V:${(currentVelocity || (finalVelocity / 2)).toFixed(2)}`.padEnd(16, ' ').substring(0, 16);
          cvLine1 = `Vf:${finalVelocity.toFixed(2)} a:${acceleration.toFixed(2)}`.padEnd(16, ' ').substring(0, 16);
          cvTag = 'LCD 1602 · 1/3 CINEMÁTICA';
        } else if (page === 1) {
          cvLine0 = `F.Neta: ${netForce.toFixed(3)} N`.padEnd(16, ' ').substring(0, 16);
          cvLine1 = '2da Ley: F=m*a  ';
          cvTag = 'LCD 1602 · 2/3 DINÁMICA F=m·a';
        } else {
          cvLine0 = `Ek: ${kineticEnergy.toFixed(4)} J`.padEnd(16, ' ').substring(0, 16);
          cvLine1 = `p : ${momentum.toFixed(4)} N*s`.padEnd(16, ' ').substring(0, 16);
          cvTag = 'LCD 1602 · 3/3 ENERGÍA & IMPULSO';
        }
      } else if (clampedLever > 0) {
        cvLine0 = `Palanca Muesca ${clampedLever}`.padEnd(16, ' ').substring(0, 16);
        cvLine1 = 'Listo p/disparar';
        cvTag = 'LCD 1602 · TENSADO';
      } else if (!isBallPresent) {
        cvLine0 = 'Esperando carga ';
        cvLine1 = 'Halar palanca   ';
        cvTag = 'LCD 1602 · ESPERANDO CARGA';
      }

      const lcdX = width * 0.5 - 130;
      const lcdY = railY + 44;
      const lcdW = 260;
      const lcdH = 68;

      // PCB verde oscuro del módulo LCD
      ctx.fillStyle = '#0f3a1e';
      ctx.beginPath();
      ctx.roundRect(lcdX - 8, lcdY - 14, lcdW + 16, lcdH + 20, 6);
      ctx.fill();
      ctx.strokeStyle = '#238636';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Tornillos dorados en las 4 esquinas
      const screws = [
        [lcdX - 3, lcdY - 9],
        [lcdX + lcdW + 3, lcdY - 9],
        [lcdX - 3, lcdY + lcdH + 1],
        [lcdX + lcdW + 3, lcdY + lcdH + 1],
      ];
      screws.forEach(([sx, sy]) => {
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5c4300';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Título del módulo LCD
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cvTag, lcdX + 2, lcdY - 4);

      // Marco del display LCD
      ctx.fillStyle = '#161b22';
      ctx.fillRect(lcdX, lcdY, lcdW, lcdH);
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1;
      ctx.strokeRect(lcdX, lcdY, lcdW, lcdH);

      // Fondo azul retroiluminado activo
      ctx.fillStyle = '#002b66';
      ctx.fillRect(lcdX + 6, lcdY + 6, lcdW - 12, lcdH - 12);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(lcdX + 6, lcdY + 6, lcdW - 12, lcdH - 12);

      // Texto en matriz de caracteres 16x2
      ctx.fillStyle = '#99ccff';
      ctx.font = 'bold 13px "Courier New", Courier, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cvLine0, lcdX + 16, lcdY + 26);
      ctx.fillText(cvLine1, lcdX + 16, lcdY + 46);

      // 9. HUD & Overlay de Telemetría Dinámica
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('GEMELO DIGITAL 2D - RIEL DE NEWTON', 16, 24);

      // Estado de Enlace
      const connText =
        connectionSource === 'bluetooth'
          ? 'BLE NUS CONECTADO'
          : connectionSource === 'usb'
          ? 'WEB SERIAL (115200)'
          : connectionSource === 'cloud'
          ? 'BETTY CLOUD WS'
          : 'MODO SIMULADOR';
      const connColor =
        connectionSource === 'none'
          ? '#eab308'
          : connectionSource === 'bluetooth'
          ? '#3b82f6'
          : '#10b981';

      ctx.fillStyle = connColor;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`● ${connText}`, 16, 40);

      // Estado del Ensayo
      ctx.textAlign = 'right';
      ctx.font = 'bold 10px monospace';
      if (inTransit) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('ESTADO: CARRERA EN TRÁNSITO...', width - 16, 24);
      } else if (impactDetected || isFlashing) {
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('ESTADO: ¡IMPACTO EN META!', width - 16, 24);
      } else if (isBallPresent && clampedLever > 0) {
        ctx.fillStyle = '#10b981';
        ctx.fillText('ESTADO: TENSADO - LISTO P/ DISPARO', width - 16, 24);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('ESTADO: EN REPOSO', width - 16, 24);
      }

      if (finalVelocity > 0 || currentVelocity > 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(
          `v: ${(inTransit ? currentVelocity : finalVelocity).toFixed(3)} m/s | t: ${transitTime.toFixed(3)} s | F: ${netForce.toFixed(3)} N`,
          width - 16,
          40
        );
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    leverPosition,
    servoAngle,
    isBallPresent,
    inTransit,
    impactDetected,
    transitProgress,
    sensorsState,
    currentVelocity,
    finalVelocity,
    transitTime,
    netForce,
    isConnected,
    connectionSource,
    acceleration,
    kineticEnergy,
    momentum,
  ]);

  // Carrusel cíclico de 3 páginas para la réplica JSX del LCD 1602 (cada 2.5s, igual que DisplayManager.cpp)
  const [resultsPage, setResultsPage] = React.useState<number>(0);
  React.useEffect(() => {
    if (!impactDetected && transitTime <= 0) return;
    const timer = setInterval(() => {
      setResultsPage((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(timer);
  }, [impactDetected, transitTime]);

  // Generación de textos para el LCD 1602 réplica del firmware real
  let lcdLine0 = 'Riel de Newton  ';
  let lcdLine1 = 'Sistema Listo   ';
  let lcdTag = 'LISTO';

  if (inTransit) {
    lcdLine0 = 'Viajando...     ';
    lcdLine1 = 'Esperando choque';
    lcdTag = 'EN TRÁNSITO';
  } else if (impactDetected || transitTime > 0) {
    if (resultsPage === 0) {
      lcdLine0 = `T:${transitTime.toFixed(2)}s V:${(currentVelocity || (finalVelocity / 2)).toFixed(2)}`.padEnd(16, ' ').substring(0, 16);
      lcdLine1 = `Vf:${finalVelocity.toFixed(2)} a:${acceleration.toFixed(2)}`.padEnd(16, ' ').substring(0, 16);
      lcdTag = 'PÁG 1/3: CINEMÁTICA';
    } else if (resultsPage === 1) {
      lcdLine0 = `F.Neta: ${netForce.toFixed(3)} N`.padEnd(16, ' ').substring(0, 16);
      lcdLine1 = '2da Ley: F=m*a  ';
      lcdTag = 'PÁG 2/3: 2da LEY F=m·a';
    } else {
      lcdLine0 = `Ek: ${kineticEnergy.toFixed(4)} J`.padEnd(16, ' ').substring(0, 16);
      lcdLine1 = `p : ${momentum.toFixed(4)} N*s`.padEnd(16, ' ').substring(0, 16);
      lcdTag = 'PÁG 3/3: ENERGÍA & IMPULSO';
    }
  } else if (leverPosition > 0) {
    lcdLine0 = `Palanca Muesca ${leverPosition}`.padEnd(16, ' ').substring(0, 16);
    lcdLine1 = 'Listo p/disparar';
    lcdTag = 'TENSADO';
  } else if (!isBallPresent) {
    lcdLine0 = 'Esperando carga ';
    lcdLine1 = 'Halar palanca   ';
    lcdTag = 'ESPERANDO CARGA';
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/80 bg-background/50 shadow-md">
      <canvas
        ref={canvasRef}
        width={720}
        height={320}
        className="w-full h-auto block aspect-[9/4]"
      />

      {/* Réplica de Alta Fidelidad del Display LCD 1602 Físico del Riel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-[#090d13] border-t border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-[10px] font-mono font-bold text-sky-400">
            📟 RÉPLICA LCD 1602 REAL
          </div>
          <span className="text-[11px] font-mono text-muted-foreground font-semibold">
            Modo 16×2 · {lcdTag}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className="px-3.5 py-1.5 rounded-lg bg-[#001e4d] border-2 border-[#1a365d] shadow-inner font-mono text-xs sm:text-sm font-bold text-[#99ccff] tracking-widest leading-relaxed flex flex-col justify-center">
            <div className="whitespace-pre">{lcdLine0}</div>
            <div className="whitespace-pre">{lcdLine1}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
