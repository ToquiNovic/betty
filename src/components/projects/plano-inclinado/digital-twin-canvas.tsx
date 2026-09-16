'use client';

import React, { useEffect, useRef } from 'react';

export interface DigitalTwinCanvasProps {
  plankAngle?: number;
  currentAngle?: number; // compatibilidad
  servoAngle?: number;
  targetAngle?: number;
  sensorCubePresent?: boolean;
  slipAngle?: number;
  isConnected?: boolean;
  connectionSource?: 'usb' | 'cloud' | 'none';
}

export function DigitalTwinCanvas({
  plankAngle,
  currentAngle,
  servoAngle,
  targetAngle = 0,
  sensorCubePresent = true,
  slipAngle = 0,
  isConnected = false,
  connectionSource = 'none',
}: DigitalTwinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cubeSlideOffsetRef = useRef<number>(0);

  // Fallback para ángulos si no se especifican ambos
  const actualPlankAngle = plankAngle ?? currentAngle ?? 0;
  const actualServoAngle = servoAngle ?? currentAngle ?? actualPlankAngle;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Limpiar Canvas y dibujar fondo
      ctx.clearRect(0, 0, width, height);

      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.1
      );
      bgGrad.addColorStop(0, '#151d28');
      bgGrad.addColorStop(1, '#090d14');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Base de la mesa de madera
      const tableY = 275;
      ctx.fillStyle = '#1c1510';
      ctx.fillRect(0, tableY, width, height - tableY);
      ctx.fillStyle = '#2d221a';
      ctx.fillRect(0, tableY - 4, width, 4);

      // Líneas sutiles de la mesa
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, tableY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 3. Geometría del Plano Inclinado
      const pivotX = 110;
      const pivotY = 255;
      const plankLength = 360;
      const plankThickness = 26;

      const plankRad = (actualPlankAngle * Math.PI) / 180;
      const servoRad = (actualServoAngle * Math.PI) / 180;
      const isSlip = slipAngle > 0;

      // 4. Arco transportador de grados
      ctx.save();
      ctx.translate(pivotX, pivotY);

      // Arco guía de 90° en celeste tenue
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, -Math.PI / 2, true);
      ctx.stroke();

      // Arco activo recorrido
      ctx.strokeStyle = isSlip ? '#f85149' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, -plankRad, true);
      ctx.stroke();

      // Etiqueta numérica del ángulo
      ctx.fillStyle = isSlip ? '#f85149' : '#38bdf8';
      ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(
        `θ = ${actualPlankAngle.toFixed(1)}°`,
        195 * Math.cos(-plankRad / 2),
        195 * Math.sin(-plankRad / 2)
      );

      // 5. Rotación de la Rampa de Madera
      ctx.rotate(-plankRad);

      // Viga de madera con bisel y gradiente
      const woodGrad = ctx.createLinearGradient(0, -plankThickness, 0, 0);
      woodGrad.addColorStop(0, '#8c5027');
      woodGrad.addColorStop(0.3, '#b87742');
      woodGrad.addColorStop(0.7, '#a26435');
      woodGrad.addColorStop(1, '#5e3215');

      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, -plankThickness, plankLength, plankThickness, [2, 8, 8, 2]);
      } else {
        ctx.rect(0, -plankThickness, plankLength, plankThickness);
      }
      ctx.fill();

      ctx.strokeStyle = '#42220e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Vetas de madera
      ctx.strokeStyle = 'rgba(66, 34, 14, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 20; i < plankLength - 20; i += 45) {
        ctx.beginPath();
        ctx.moveTo(i, -plankThickness + 4);
        ctx.bezierCurveTo(i + 15, -plankThickness + 10, i + 25, -plankThickness + 18, i + 35, -4);
        ctx.stroke();
      }

      // Chapa metálica / Tope en la punta
      ctx.fillStyle = '#8b949e';
      ctx.fillRect(plankLength - 6, -plankThickness - 16, 6, 18);

      // ----------------------------------------------------
      // SENSOR TCRT5000 EN LA PUNTA DE LA TABLA
      // ----------------------------------------------------
      const sensorX = plankLength - 40;
      const sensorY = -plankThickness - 14;

      // Placa PCB azul del sensor
      ctx.fillStyle = '#0969da';
      ctx.fillRect(sensorX, sensorY, 32, 12);
      ctx.strokeStyle = '#54aeff';
      ctx.lineWidth = 1;
      ctx.strokeRect(sensorX, sensorY, 32, 12);

      // Potenciómetro azul de ajuste con tornillo
      ctx.fillStyle = '#1f6feb';
      ctx.fillRect(sensorX + 6, sensorY + 2, 7, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sensorX + 8, sensorY + 4, 3, 3);

      // Diodos IR (Fototransistor negro y LED azul emisor)
      ctx.fillStyle = '#0d1117';
      ctx.beginPath();
      ctx.arc(sensorX + 22, sensorY + 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(sensorX + 28, sensorY + 6, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Haz infrarrojo emitido dinámico
      if (sensorCubePresent) {
        const beamGrad = ctx.createLinearGradient(sensorX + 20, sensorY + 6, sensorX - 60, sensorY + 6);
        beamGrad.addColorStop(0, 'rgba(34, 197, 94, 0.7)');
        beamGrad.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(sensorX + 20, sensorY + 3);
        ctx.lineTo(sensorX - 60, sensorY - 10);
        ctx.lineTo(sensorX - 60, sensorY + 20);
        ctx.lineTo(sensorX + 20, sensorY + 9);
        ctx.fill();
      } else {
        const beamGrad = ctx.createLinearGradient(sensorX + 20, sensorY + 6, sensorX - 100, sensorY + 6);
        beamGrad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        beamGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(sensorX + 20, sensorY + 2);
        ctx.lineTo(sensorX - 100, sensorY - 15);
        ctx.lineTo(sensorX - 100, sensorY + 25);
        ctx.lineTo(sensorX + 20, sensorY + 10);
        ctx.fill();
      }

      // ----------------------------------------------------
      // CUBO DE PRUEBA SOBRE LA TABLA (DESLIZAMIENTO DINÁMICO)
      // ----------------------------------------------------
      const cubeBaseX = plankLength - 95;
      if (!sensorCubePresent) {
        cubeSlideOffsetRef.current = Math.min(140, cubeSlideOffsetRef.current + 3);
      } else {
        cubeSlideOffsetRef.current = 0;
      }

      const cubeX = cubeBaseX - cubeSlideOffsetRef.current;
      const cubeSize = 34;
      const cubeY = -plankThickness - cubeSize;

      // Cubo con textura dorada/madera
      ctx.fillStyle = '#eab308';
      ctx.fillRect(cubeX, cubeY, cubeSize, cubeSize);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.strokeRect(cubeX, cubeY, cubeSize, cubeSize);

      // Sombra inferior del cubo
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(cubeX, cubeY + cubeSize - 6, cubeSize, 6);

      // Letra 'm' de masa
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillText('m', cubeX + 11, cubeY + 21);

      // Vectores de fuerza newtoniana sobre el cubo
      if (actualPlankAngle > 2) {
        // Vector Normal (perpendicular hacia arriba)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cubeX + cubeSize / 2, cubeY);
        ctx.lineTo(cubeX + cubeSize / 2, cubeY - 24);
        ctx.stroke();

        // Punta flecha Normal
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(cubeX + cubeSize / 2, cubeY - 27);
        ctx.lineTo(cubeX + cubeSize / 2 - 3, cubeY - 22);
        ctx.lineTo(cubeX + cubeSize / 2 + 3, cubeY - 22);
        ctx.fill();

        // Vector Gravedad Paralela (hacia abajo de la rampa)
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cubeX, cubeY + cubeSize / 2);
        ctx.lineTo(cubeX - 25, cubeY + cubeSize / 2);
        ctx.stroke();

        // Punta flecha Paralela
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(cubeX - 28, cubeY + cubeSize / 2);
        ctx.lineTo(cubeX - 23, cubeY + cubeSize / 2 - 3);
        ctx.lineTo(cubeX - 23, cubeY + cubeSize / 2 + 3);
        ctx.fill();
      }

      ctx.restore();

      // ----------------------------------------------------
      // SERVOMOTORES EN LA BASE (Cuerpo Negro/Rojo + Horn Giratorio)
      // ----------------------------------------------------
      // Soporte metálico lateral
      ctx.fillStyle = '#475569';
      ctx.fillRect(pivotX - 42, pivotY + 18, 55, 12);

      // Carcasa del servomotor (MG996R negro)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(pivotX - 35, pivotY - 22, 45, 46);

      // Franja roja distintiva
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(pivotX - 35, pivotY - 10, 45, 22);

      // Pestañas y tornillos de fijación
      ctx.fillStyle = '#334155';
      ctx.fillRect(pivotX - 40, pivotY - 16, 5, 8);
      ctx.fillRect(pivotX + 10, pivotY - 16, 5, 8);

      // Horn blanco giratorio del servo (rota según actualServoAngle)
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(-servoRad);

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-6, -6, 32, 12, 6);
      } else {
        ctx.rect(-6, -6, 32, 12);
      }
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Agujeros en el horn blanco
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(10, 0, 1.5, 0, Math.PI * 2);
      ctx.arc(16, 0, 1.5, 0, Math.PI * 2);
      ctx.arc(22, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Corona metálica central y tornillo del eje
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [actualPlankAngle, actualServoAngle, sensorCubePresent, slipAngle]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border/80 shadow-inner bg-slate-950">
      <canvas
        ref={canvasRef}
        width={600}
        height={330}
        className="w-full h-[280px] sm:h-[330px] block object-contain"
      />
      <div className="absolute top-3 left-3 bg-background/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-border/60 text-[11px] font-mono font-semibold flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
          }`}
        />
        <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
          {isConnected
            ? connectionSource === 'usb'
              ? 'ESP32 USB (115200 baud)'
              : 'ESP32 Betty Cloud'
            : 'Hardware Desconectado'}
        </span>
      </div>
      <div className="absolute top-3 right-3 bg-background/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-border/60 text-[11px] font-mono text-muted-foreground">
        TCRT5000 IR & Cubo & Servos MG996R
      </div>
    </div>
  );
}
