'use client';

import React, { useEffect, useRef } from 'react';

interface DigitalTwinCanvasProps {
  currentAngle: number;
  targetAngle: number;
}

export function DigitalTwinCanvas({ currentAngle, targetAngle }: DigitalTwinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.2
      );
      bgGrad.addColorStop(0, '#151c27');
      bgGrad.addColorStop(1, '#090d14');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Wooden Table Base (Bottom)
      const tableY = 270;
      ctx.fillStyle = '#1c1510';
      ctx.fillRect(0, tableY, width, height - tableY);
      ctx.fillStyle = '#3a2b21';
      ctx.fillRect(0, tableY - 4, width, 4);

      // Grid subtle markings on table
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, tableY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Pivot position
      const pivotX = 120;
      const pivotY = 250;
      const plankLength = 340;
      const plankThickness = 28;

      const currentRad = (currentAngle * Math.PI) / 180;
      const targetRad = (targetAngle * Math.PI) / 180;

      // Target ghost arc & angle indicator
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 160, 0, -targetRad, true);
      ctx.stroke();
      ctx.setLineDash([]);

      // Angular Arc Ruler (0 to 90 degrees)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 160, 0, -Math.PI / 2, true);
      ctx.stroke();

      // Active travel arc (Blue Glow)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 160, 0, -currentRad, true);
      ctx.stroke();

      // Degree Text near the arc
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillText(
        `${currentAngle.toFixed(1)}°`,
        pivotX + 175 * Math.cos(-currentRad / 2),
        pivotY + 175 * Math.sin(-currentRad / 2)
      );

      // Save context for rotating the wooden plank
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(-currentRad);

      // Wooden Plank (Ramp)
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

      // Plank Outer Stroke
      ctx.strokeStyle = '#42220e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Wood Grain details
      ctx.strokeStyle = 'rgba(66, 34, 14, 0.45)';
      ctx.lineWidth = 1;
      for (let i = 20; i < plankLength - 20; i += 38) {
        ctx.beginPath();
        ctx.moveTo(i, -plankThickness + 4);
        ctx.bezierCurveTo(i + 14, -plankThickness + 9, i + 24, -plankThickness + 17, i + 34, -4);
        ctx.stroke();
      }

      // Metal Stop End Plate at the tip
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(plankLength - 8, -plankThickness - 18, 8, 20);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(plankLength - 14, -plankThickness - 2, 14, 4);

      // Small screws on metal plate
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(plankLength - 4, -plankThickness - 10, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Servomotors at the base (Realistic MG996R dual setup)
      // Servo Body (Black Case)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(pivotX - 35, pivotY - 25, 45, 50);

      // MG996R Characteristic Red Band
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(pivotX - 35, pivotY - 12, 45, 24);

      // Servo label branding
      ctx.fillStyle = '#ffffff';
      ctx.font = '7px sans-serif';
      ctx.fillText('MG996R', pivotX - 31, pivotY + 2);

      // Plastic Zip-Tie (Brida de sujeción blanca)
      ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
      ctx.fillRect(pivotX - 16, pivotY - 26, 6, 52);

      // Lateral Metal Bracket Support
      ctx.fillStyle = '#64748b';
      ctx.fillRect(pivotX - 42, pivotY + 18, 55, 12);
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(pivotX - 36, pivotY + 24, 2, 0, Math.PI * 2);
      ctx.arc(pivotX + 6, pivotY + 24, 2, 0, Math.PI * 2);
      ctx.fill();

      // Center Rotation Hub & Shaft
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center Axis Screw
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentAngle, targetAngle]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border/80 shadow-inner bg-slate-950">
      <canvas
        ref={canvasRef}
        width={600}
        height={320}
        className="w-full h-[280px] sm:h-[320px] block object-contain"
      />
      <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-border/60 text-[11px] font-mono font-semibold text-muted-foreground flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Gemelo 2D a 60 FPS</span>
      </div>
      <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-border/60 text-[11px] font-mono text-muted-foreground">
        Maqueta Madera & 2x MG996R
      </div>
    </div>
  );
}
