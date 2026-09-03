'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EasingType } from './mathematical-model-card';
import {
  Usb,
  Send,
  Zap,
  ArrowUp,
  ArrowDown,
  Terminal,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface SerialControlPanelProps {
  currentAngle: number;
  targetAngle: number;
  easingType: EasingType;
  onAngleChange: (angle: number) => void;
  onEasingChange: (type: EasingType) => void;
  onTelemetryPacket: (s1: number, s2: number, target: number, progress: number) => void;
  onLogMessage: (msg: string) => void;
}

export function SerialControlPanel({
  currentAngle,
  targetAngle,
  easingType,
  onAngleChange,
  onEasingChange,
  onTelemetryPacket,
  onLogMessage,
}: SerialControlPanelProps) {
  const [sliderVal, setSliderVal] = useState<number>(45);
  const [isDynamicTime, setIsDynamicTime] = useState<boolean>(true);
  const [manualDuration, setManualDuration] = useState<number>(2500);
  const [customCmd, setCustomCmd] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([
    '[Sistema en espera. Conecta el dispositivo ESP32 mediante el puerto USB Serial para habilitar el control en vivo]',
  ]);

  // Serial state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const portRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef<boolean>(false);

  const logBoxRef = useRef<HTMLDivElement | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => {
      const next = [...prev, msg];
      if (next.length > 50) next.shift();
      return next;
    });
    onLogMessage(msg);
  };

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  // Cleanup serial on unmount
  useEffect(() => {
    return () => {
      if (keepReadingRef.current && portRef.current) {
        keepReadingRef.current = false;
        try {
          if (readerRef.current) readerRef.current.cancel();
          if (writerRef.current) writerRef.current.close();
          if (portRef.current) portRef.current.close();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  // Calculate dynamic duration with gravity torque factor
  const calcDynamicDuration = (startDeg: number, targetDeg: number) => {
    const delta = Math.abs(targetDeg - startDeg);
    if (delta === 0) return 450;

    let dur = 450 + delta * 30;
    const avgRad = ((startDeg + targetDeg) / 2) * (Math.PI / 180);
    const gravityFactor = Math.cos(avgRad); // 1.0 at 0°, 0.0 at 90°

    const isLifting = targetDeg > startDeg;
    if (isLifting) {
      dur *= 1.0 + 0.25 * gravityFactor; // +25% when lifting
    } else {
      dur *= 1.0 - 0.15 * gravityFactor; // -15% when descending
    }
    return Math.round(Math.min(15000, Math.max(450, dur)));
  };

  const estimatedDuration = calcDynamicDuration(currentAngle, sliderVal);
  const isLifting = sliderVal >= currentAngle;
  const avgRad = ((currentAngle + sliderVal) / 2) * (Math.PI / 180);
  const gravPct = Math.round(Math.cos(avgRad) * 100);

  // Send command through Web Serial
  const sendCommand = async (cmdStr: string) => {
    if (!isConnected) {
      toast.warning('Conecta un dispositivo USB para enviar comandos');
      return;
    }

    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    addLog(`→ ${trimmed}`);

    if (writerRef.current && isConnected) {
      try {
        const encoder = new TextEncoder();
        await writerRef.current.write(encoder.encode(trimmed + '\n'));
      } catch (err: any) {
        console.error('Error enviando datos seriales:', err);
        addLog(`❌ Error al enviar: ${err.message}`);
        toast.error('Error en la comunicación serial');
      }
    }
  };

  // Incoming serial line processor
  const handleIncomingSerialLine = (line: string) => {
    line = line.trim();
    if (!line) return;

    if (line.startsWith('TLM:')) {
      const parts = line.substring(4).split(',');
      if (parts.length >= 4) {
        const s1 = parseFloat(parts[0]);
        const s2 = parseFloat(parts[1]);
        const target = parseFloat(parts[2]);
        const progress = parseFloat(parts[3]);
        onTelemetryPacket(s1, s2, target, progress);
      }
    } else {
      addLog(`← ${line}`);
    }
  };

  // Toggle Web Serial Connection
  const toggleWebSerial = async () => {
    if (isConnected) {
      // Disconnect
      keepReadingRef.current = false;
      try {
        if (readerRef.current) await readerRef.current.cancel();
        if (writerRef.current) await writerRef.current.close();
        if (portRef.current) await portRef.current.close();
      } catch (err) {
        console.error('Error al cerrar puerto serial:', err);
      }
      portRef.current = null;
      readerRef.current = null;
      writerRef.current = null;
      setIsConnected(false);
      addLog('🔌 [Puerto USB Serial desconectado]');
      toast.info('Puerto USB Serial desconectado');
    } else {
      // Check Web Serial support
      if (typeof window === 'undefined' || !('serial' in navigator)) {
        toast.error(
          'Tu navegador no soporta la API Web Serial. Abre esta página en Google Chrome o Microsoft Edge para conectar por USB.',
          { duration: 6000 }
        );
        addLog('❌ Web Serial API no soportada en este navegador.');
        return;
      }

      try {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 115200 });

        portRef.current = port;
        const writableStreamClosed = port.writable;
        writerRef.current = writableStreamClosed.getWriter();

        setIsConnected(true);
        addLog('✅ [Conectado exitosamente por USB a 115200 baudios]');
        toast.success('¡ESP32 Conectado por puerto USB Serial!');

        keepReadingRef.current = true;
        readSerialLoop(port);
      } catch (err: any) {
        console.error('Error conectando Web Serial:', err);
        addLog(`❌ Error de conexión USB: ${err.message}`);
        toast.error('No se pudo conectar al puerto COM');
      }
    }
  };

  const readSerialLoop = async (port: any) => {
    let buffer = '';
    while (port && port.readable && keepReadingRef.current) {
      readerRef.current = port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) break;
          if (value) {
            const chunk = new TextDecoder().decode(value);
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              handleIncomingSerialLine(line);
            }
          }
        }
      } catch (error: any) {
        console.error('Error en lectura serial:', error);
      } finally {
        if (readerRef.current) {
          readerRef.current.releaseLock();
        }
      }
    }
  };

  const handleSendAngle = (deg: number) => {
    if (!isConnected) return;
    setSliderVal(deg);
    sendCommand(`BOTH,${deg}`);
  };

  const handleCustomCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    if (customCmd.trim()) {
      sendCommand(customCmd.trim());
      setCustomCmd('');
    }
  };

  return (
    <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg transition-colors ${
              isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span>Panel de Control del ESP32</span>
              {!isConnected && (
                <Badge variant="outline" className="text-[10px] font-mono py-0 text-amber-500 border-amber-500/30">
                  Bloqueado
                </Badge>
              )}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {isConnected
                ? 'Telemetría bidireccional y actuadores en vivo'
                : 'Conexión USB requerida para activar los controles'}
            </p>
          </div>
        </div>

        {/* Status Pill & Action Button */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono text-[11px] gap-1.5 py-1 px-2.5 transition-all ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 shadow-xs shadow-emerald-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span>{isConnected ? 'USB Conectado' : 'Desconectado'}</span>
          </Badge>

          <Button
            size="sm"
            variant={isConnected ? 'destructive' : 'default'}
            onClick={toggleWebSerial}
            className={`gap-1.5 text-xs font-semibold h-8 transition-all ${
              !isConnected ? 'bg-primary hover:bg-primary/90 shadow-sm' : ''
            }`}
          >
            <Usb className="h-3.5 w-3.5" />
            <span>{isConnected ? 'Desconectar' : 'Conectar USB'}</span>
          </Button>
        </div>
      </CardHeader>

      {/* Main Content Area (Blocked when !isConnected) */}
      <div className="relative">
        {/* Actions Controls Form */}
        <CardContent
          className={`p-4 space-y-4 transition-all duration-300 ${
            !isConnected ? 'opacity-35 pointer-events-none select-none filter blur-[0.4px]' : ''
          }`}
        >
          {/* Angle Slider and Preset Buttons */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Ángulo Deseado:{' '}
                <span className="font-mono font-bold text-sky-500 text-sm">{sliderVal}°</span>
              </Label>
              <Button
                size="sm"
                disabled={!isConnected}
                className="gap-1 text-xs h-7 px-3 bg-sky-600 hover:bg-sky-500 text-white"
                onClick={() => handleSendAngle(sliderVal)}
              >
                <Send className="h-3 w-3" />
                <span>Enviar Ángulo</span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground">0°</span>
              <input
                type="range"
                min={0}
                max={90}
                disabled={!isConnected}
                value={sliderVal}
                onChange={(e) => setSliderVal(parseInt(e.target.value))}
                className="flex-1 accent-sky-500 cursor-pointer h-2 bg-muted rounded-lg"
              />
              <span className="text-[10px] font-mono text-muted-foreground">90°</span>
            </div>

            {/* Preset Buttons Strip */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[0, 30, 45, 60, 90].map((deg) => (
                <Button
                  key={deg}
                  variant="outline"
                  size="sm"
                  disabled={!isConnected}
                  className={`h-7 px-2.5 text-[11px] font-mono ${
                    sliderVal === deg && isConnected
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold'
                      : ''
                  }`}
                  onClick={() => handleSendAngle(deg)}
                >
                  {deg === 0 ? '0° (Reposo)' : deg === 90 ? '90° (Vertical)' : `${deg}°`}
                </Button>
              ))}
            </div>
          </div>

          {/* Dynamic Time Mode Box */}
          <div className="p-3 rounded-lg border border-sky-500/30 bg-sky-950/20 space-y-1.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                <Zap className="h-3.5 w-3.5 text-sky-400" />
                <span>Tiempo Dinámico (Auto-Calculado con Gravedad)</span>
              </div>
              <input
                type="checkbox"
                disabled={!isConnected}
                checked={isDynamicTime}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setIsDynamicTime(enabled);
                  sendCommand(enabled ? 'AUTO_DUR ON' : 'AUTO_DUR OFF');
                }}
                className="accent-sky-500 h-4 w-4 rounded cursor-pointer"
              />
            </label>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between font-mono pt-1">
              <span>
                Estimación:{' '}
                <strong className="text-emerald-400 font-bold">{estimatedDuration} ms</strong>
              </span>
              <span className="text-[10px] text-muted-foreground/80">
                {isLifting
                  ? `(Subida: +${Math.round(25 * (gravPct / 100))}% por torque gravedad)`
                  : `(Descenso: -${Math.round(15 * (gravPct / 100))}% a favor de gravedad)`}
              </span>
            </div>
          </div>

          {/* Easing & Fixed Duration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">Curva de Easing:</Label>
              <select
                disabled={!isConnected}
                value={easingType}
                onChange={(e) => {
                  const newType = e.target.value as EasingType;
                  onEasingChange(newType);
                  sendCommand(`EASING ${newType}`);
                }}
                className="w-full bg-background border border-border/80 rounded-md px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-hidden"
              >
                <option value="CUBIC">Cubic Ease-In-Out (Recomendada)</option>
                <option value="SMOOTHERSTEP">SmootherStep (Quíntica Ken Perlin)</option>
                <option value="SINE">Sinusoidal (Armónica)</option>
                <option value="QUAD">Smoothstep (Cuadrática)</option>
                <option value="LINEAR">Lineal (Velocidad Constante)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">
                Duración Manual Fija (ms):
              </Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  disabled={!isConnected}
                  min={450}
                  max={15000}
                  step={250}
                  value={manualDuration}
                  onChange={(e) => setManualDuration(parseInt(e.target.value) || 2500)}
                  className="h-8 text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isConnected}
                  className="h-8 text-xs px-2.5 shrink-0"
                  onClick={() => {
                    sendCommand(`DUR ${manualDuration}`);
                    setIsDynamicTime(false);
                  }}
                >
                  Fijar
                </Button>
              </div>
            </div>
          </div>

          {/* Up / Down Nudges */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!isConnected}
              className="gap-1.5 text-xs h-8"
              onClick={() => sendCommand('UP 10')}
            >
              <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>Subir (+10°)</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isConnected}
              className="gap-1.5 text-xs h-8"
              onClick={() => sendCommand('DOWN 10')}
            >
              <ArrowDown className="h-3.5 w-3.5 text-rose-500" />
              <span>Bajar (-10°)</span>
            </Button>
          </div>

          {/* Terminal / Logs Box */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground font-mono">
              <div className="flex items-center gap-1">
                <Terminal className="h-3 w-3" />
                <span>CONSOLA SERIAL (LOGS):</span>
              </div>
              <span className="text-[10px] text-muted-foreground/60">{logs.length} líneas</span>
            </div>

            <div
              ref={logBoxRef}
              className="h-28 rounded-md bg-slate-950 border border-border/80 p-2 overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-0.5"
            >
              {logs.map((log, idx) => (
                <div key={idx} className="leading-tight break-all">
                  {log}
                </div>
              ))}
            </div>

            {/* Custom Command Input */}
            <form onSubmit={handleCustomCommandSubmit} className="flex gap-1.5 pt-1">
              <Input
                type="text"
                disabled={!isConnected}
                placeholder="Comando manual (ej. BOTH,45 o DUR 2500)"
                value={customCmd}
                onChange={(e) => setCustomCmd(e.target.value)}
                className="h-8 text-xs font-mono bg-background"
              />
              <Button
                type="submit"
                disabled={!isConnected}
                variant="secondary"
                size="sm"
                className="h-8 text-xs px-3"
              >
                Enviar
              </Button>
            </form>
          </div>
        </CardContent>

        {/* Lock Overlay when Disconnected */}
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-background/50 backdrop-blur-[2px] rounded-b-xl z-20 space-y-3">
            <div className="p-3 rounded-full bg-background border border-border shadow-lg text-primary animate-bounce">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>

            <div className="space-y-1 max-w-xs">
              <h4 className="text-sm font-bold text-foreground">Acciones Bloqueadas</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conecta tu microcontrolador ESP32 mediante el cable USB para habilitar el control de servomotores, curvas de easing y telemetría en tiempo real.
              </p>
            </div>

            <Button
              onClick={toggleWebSerial}
              className="gap-2 text-xs font-semibold shadow-md bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Usb className="h-4 w-4" />
              <span>Conectar Dispositivo USB</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
