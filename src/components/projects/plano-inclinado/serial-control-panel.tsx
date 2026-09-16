'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EasingType } from './mathematical-model-card';
import { ESP32ConfigDialog, type ESP32Config } from './esp32-config-dialog';
import {
  Usb,
  Send,
  Zap,
  Terminal,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Sliders,
  Shield,
  Radio,
  Flame,
  Cloud,
  Wifi,
  Settings,
  Square,
  Trash2,
} from 'lucide-react';
import { toast } from '@/lib/toast';

export interface TelemetryPacketData {
  servo1: number;
  servo2: number;
  target: number;
  progress: number;
  sensorCubePresent: boolean;
  slipAngle: number;
  plankAngle: number;
  rawAnalog?: number;
  analogVoltage?: number;
  reflectivity?: number;
  angularVelocity?: number;
}

export interface SerialControlPanelProps {
  currentServoAngle: number;
  targetServoAngle: number;
  currentPlankAngle: number;
  maxPlankAngle: number;
  easingType: EasingType;
  autoStop: boolean;
  dynamicTime: boolean;
  duration: number;
  onAngleChange: (angle: number) => void;
  onEasingChange: (type: EasingType) => void;
  onMaxPlankAngleChange: (val: number) => void;
  onAutoStopToggle: (val: boolean) => void;
  onDynamicTimeToggle: (val: boolean) => void;
  onDurationChange: (val: number) => void;
  onTelemetryPacket: (data: TelemetryPacketData) => void;
  onLogMessage?: (msg: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  sensorId?: string;
  // Compatibilidad hacia atrás
  currentAngle?: number;
  targetAngle?: number;
}

export function SerialControlPanel({
  currentServoAngle,
  targetServoAngle,
  currentPlankAngle,
  maxPlankAngle,
  easingType,
  autoStop,
  dynamicTime,
  duration,
  onAngleChange,
  onEasingChange,
  onMaxPlankAngleChange,
  onAutoStopToggle,
  onDynamicTimeToggle,
  onDurationChange,
  onTelemetryPacket,
  onLogMessage,
  onConnectionChange,
  sensorId = 'e290f30a-201e-482c-ac7e-a9d02583068d',
}: SerialControlPanelProps) {
  const [sliderVal, setSliderVal] = useState<number>(45);
  const [customCmd, setCustomCmd] = useState<string>('');
  const [calibVal, setCalibVal] = useState<number>(maxPlankAngle || 30);
  const [manualDurationVal, setManualDurationVal] = useState<number>(duration || 2500);

  const [logs, setLogs] = useState<string[]>([
    '[Sistema listo. Conecta tu ESP32 por USB Serial (115200 baudios) para operar la maqueta física]',
  ]);

  // Web Serial state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [allowDemoSimulation, setAllowDemoSimulation] = useState<boolean>(false);
  const portRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef<boolean>(false);

  // Betty IoT Platform Sync state
  const [isBettySyncActive, setIsBettySyncActive] = useState<boolean>(false);
  const [bettyPacketsCount, setBettyPacketsCount] = useState<number>(0);
  const [bettySyncStatus, setBettySyncStatus] = useState<string>('Inactivo');
  const lastBettyPostTimeRef = useRef<number>(0);

  // ESP32 NVS Config state
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState<boolean>(false);
  const [esp32Config, setEsp32Config] = useState<ESP32Config | null>(null);

  const logBoxRef = useRef<HTMLDivElement | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => {
      const next = [...prev, msg];
      if (next.length > 60) next.shift();
      return next;
    });
    if (onLogMessage) onLogMessage(msg);
  };

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  // Cleanup serial y temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
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

  // Parser de tramas seriales entrantes
  const handleIncomingLine = (line: string) => {
    line = line.trim();
    if (line.length === 0) return;

    if (line.startsWith('TLM:')) {
      const parts = line.substring(4).split(',');
      if (parts.length >= 4) {
        const s1 = parseFloat(parts[0]);
        const s2 = parseFloat(parts[1]);
        const target = parseFloat(parts[2]);
        const progress = parseFloat(parts[3]);
        const sensor = parts.length >= 5 ? parseInt(parts[4]) === 1 : true;
        const slip = parts.length >= 6 ? parseFloat(parts[5]) : 0;
        const plank = parts.length >= 7 ? parseFloat(parts[6]) : (s1 / 180) * maxPlankAngle;

        const rawAnalog = parts.length >= 8 ? parseInt(parts[7]) : undefined;
        const analogVoltage = parts.length >= 9 ? parseFloat(parts[8]) : undefined;
        const reflectivity = parts.length >= 10 ? parseFloat(parts[9]) : undefined;
        const angularVelocity = parts.length >= 11 ? parseFloat(parts[10]) : undefined;

        onTelemetryPacket({
          servo1: s1,
          servo2: s2,
          target,
          progress,
          sensorCubePresent: sensor,
          slipAngle: slip,
          plankAngle: plank,
          rawAnalog,
          analogVoltage,
          reflectivity,
          angularVelocity,
        });

        if (isBettySyncActive) {
          pushTelemetryToBetty(plank, s1, s2, sensor, angularVelocity || 0, slip);
        }
      }
    } else if (line.startsWith('{"telemetry":')) {
      try {
        const parsed = JSON.parse(line);
        const tlm = parsed.telemetry;
        const s1 = tlm.servos?.s1 ?? 0;
        const s2 = tlm.servos?.s2 ?? 0;
        const target = tlm.servos?.target ?? 0;
        const sensor = tlm.optical?.detected ?? true;
        const plank = tlm.kinematics?.plank_angle ?? (s1 / 180) * maxPlankAngle;
        const slip = tlm.friction?.slip_angle ?? 0;
        const angularVel = tlm.kinematics?.angular_vel_dps ?? 0;

        onTelemetryPacket({
          servo1: s1,
          servo2: s2,
          target,
          progress: 1.0,
          sensorCubePresent: sensor,
          slipAngle: slip,
          plankAngle: plank,
          angularVelocity: angularVel,
        });

        if (isBettySyncActive) {
          pushTelemetryToBetty(plank, s1, s2, sensor, angularVel, slip);
        }
      } catch (e) {
        console.error('Error parseando JSON de telemetría:', e);
      }
    } else if (line.startsWith('CFG:')) {
      try {
        const jsonStr = line.substring(4);
        const parsedCfg = JSON.parse(jsonStr) as ESP32Config;
        setEsp32Config(parsedCfg);
        addLog(`⚙️ [CONFIG ESP32]: SSID="${parsedCfg.ssid || '(vacio)'}", Sensor="${parsedCfg.sensor_id || 'N/A'}", WiFi=${parsedCfg.wifi_connected ? 'OK' : 'OFF'}`);
      } catch (e) {
        console.error('Error parseando CFG JSON:', e);
        addLog(`← ${line}`);
      }
    } else {
      addLog(`← ${line}`);
    }
  };

  // Envío de telemetría a Betty IoT Platform vía Webhook
  const pushTelemetryToBetty = async (
    plank: number,
    s1: number,
    s2: number,
    sensor: boolean,
    angVel: number,
    slip: number
  ) => {
    const now = Date.now();
    if (now - lastBettyPostTimeRef.current < 150) return;
    lastBettyPostTimeRef.current = now;

    const rad = (plank * Math.PI) / 180;
    const mu_s = slip > 0 ? Math.tan((slip * Math.PI) / 180) : 0;

    const payload = {
      origin_type: 'sensor',
      plank_angle: Number(plank.toFixed(2)),
      servo1: Math.round(s1),
      servo2: Math.round(s2),
      cube_detected: sensor,
      sensor_digital: sensor ? 1 : 0,
      angular_velocity: Number(angVel.toFixed(1)),
      slip_angle: Number(slip.toFixed(2)),
      mu_s: Number(mu_s.toFixed(4)),
      normal_force_ratio: Number(Math.cos(rad).toFixed(3)),
      parallel_force_ratio: Number(Math.sin(rad).toFixed(3)),
    };

    try {
      const res = await fetch('https://betty-api.laboratorio3d.online/api/mqtt/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `betty/sensor/${sensorId}/data`,
          payload,
        }),
      });

      if (res.ok) {
        setBettyPacketsCount((c) => c + 1);
        setBettySyncStatus(`Sincronizado (${bettyPacketsCount + 1})`);
      }
    } catch {
      setBettySyncStatus('Error de conexión');
    }
  };

  // Envío de comando (físico por USB o simulación local)
  const sendCommand = async (cmdStr: string): Promise<boolean> => {
    cmdStr = cmdStr.trim();
    addLog(`→ ${cmdStr}`);

    if (writerRef.current) {
      try {
        const encoder = new TextEncoder();
        await writerRef.current.write(encoder.encode(cmdStr + '\n'));
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`❌ Error enviando por USB: ${msg}`);
        return false;
      }
    } else if (allowDemoSimulation) {
      // Modo Simulación Local Interactiva (solo si el usuario lo activó explícitamente)
      addLog(`⚡ [MODO DEMO]: ${cmdStr}`);
      if (cmdStr.startsWith('BOTH,')) {
        const deg = parseFloat(cmdStr.substring(5)) || 0;
        simulateLocalMovement(deg);
      } else if (cmdStr === 'EXP') {
        simulateAutomatedExperiment();
      } else if (cmdStr === 'STOP' || cmdStr === 'CLEAR') {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        onTelemetryPacket({
          servo1: currentServoAngle,
          servo2: 180 - currentServoAngle,
          target: currentServoAngle,
          progress: 1.0,
          sensorCubePresent: true,
          slipAngle: 0,
          plankAngle: currentPlankAngle,
        });
      }
      return true;
    } else {
      // No hay hardware físico conectado y no se activó modo demo: BLOQUEADO
      toast.warning('Dispositivo no conectado. Conecta el ESP32 vía USB para operar la maqueta.');
      addLog('⚠️ [BLOQUEADO]: Conecta el cable USB del ESP32 para mover el plano inclinado.');
      return false;
    }
  };

  // Motor de simulación local cinemática
  const simulateLocalMovement = (destServo: number) => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    const startServo = currentServoAngle;
    const startTime = Date.now();
    const dur = duration || 2500;
    onAngleChange(destServo);

    simTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1.0, elapsed / dur);

      let k = t;
      if (easingType === 'CUBIC') {
        k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      } else if (easingType === 'SMOOTHERSTEP') {
        k = t * t * t * (t * (t * 6 - 15) + 10);
      } else if (easingType === 'SINE') {
        k = 0.5 * (1 - Math.cos(Math.PI * t));
      } else if (easingType === 'QUAD') {
        k = 3 * t * t - 2 * t * t * t;
      }

      const curServo = startServo + (destServo - startServo) * k;
      const curPlank = (curServo / 180.0) * maxPlankAngle;

      onTelemetryPacket({
        servo1: curServo,
        servo2: 180 - curServo,
        target: destServo,
        progress: k,
        sensorCubePresent: true,
        slipAngle: 0,
        plankAngle: curPlank,
        angularVelocity: Math.abs((destServo - startServo) / (dur / 1000)),
      });

      if (t >= 1.0) {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
      }
    }, 25);
  };

  // Simulación del experimento de fricción (0 a 90° en 20s con disparo a 18.5°)
  const simulateAutomatedExperiment = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    const simCriticalPlank = 18.5; // Ángulo crítico de la madera en simulación
    const startServo = currentServoAngle;
    const targetServo = 90.0;
    const startTime = Date.now();
    const dur = 20000;
    addLog('>> 🧪 [SIMULACIÓN]: Iniciando barrido lento de plano inclinado (20s)...');

    simTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1.0, elapsed / dur);

      const curServo = startServo + (targetServo - startServo) * t;
      const curPlank = (curServo / 180.0) * maxPlankAngle;

      if (curPlank >= simCriticalPlank) {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        const mu_s = Math.tan((simCriticalPlank * Math.PI) / 180);
        addLog(`>> 🛑 [SLIP DETECTADO]: Cubo resbaló a θ = ${simCriticalPlank.toFixed(1)}° (μs = ${mu_s.toFixed(4)})`);
        toast.error(`¡Deslizamiento Detectado a ${simCriticalPlank}°! μs = ${mu_s.toFixed(4)}`);

        onTelemetryPacket({
          servo1: curServo,
          servo2: 180 - curServo,
          target: curServo,
          progress: 1.0,
          sensorCubePresent: false,
          slipAngle: simCriticalPlank,
          plankAngle: curPlank,
          angularVelocity: 0,
        });
      } else {
        onTelemetryPacket({
          servo1: curServo,
          servo2: 180 - curServo,
          target: targetServo,
          progress: t,
          sensorCubePresent: true,
          slipAngle: 0,
          plankAngle: curPlank,
          angularVelocity: (targetServo - startServo) / 20.0,
        });
      }
    }, 30);
  };

  // Conexión Web Serial por navegador
  const toggleWebSerial = async () => {
    if (isConnected) {
      keepReadingRef.current = false;
      try {
        if (readerRef.current) await readerRef.current.cancel();
        if (writerRef.current) await writerRef.current.close();
        if (portRef.current) await portRef.current.close();
      } catch (e) {
        console.error(e);
      }
      portRef.current = null;
      readerRef.current = null;
      writerRef.current = null;
      setIsConnected(false);
      onConnectionChange?.(false);
      addLog('[Puerto USB Serial desconectado]');
      toast.info('Puerto USB desconectado');
    } else {
      if (typeof navigator === 'undefined' || !('serial' in navigator)) {
        toast.error('Tu navegador no soporta Web Serial API. Usa Google Chrome o Microsoft Edge.');
        return;
      }

      try {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 115200 });

        portRef.current = port;
        writerRef.current = port.writable.getWriter();
        keepReadingRef.current = true;
        setIsConnected(true);
        onConnectionChange?.(true);

        addLog('✅ [ESP32 Conectado exitosamente por USB a 115200 baudios]');
        toast.success('ESP32 Conectado por USB a 115200 baudios');

        // Bucle de lectura
        readSerialLoop(port);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`❌ Error al conectar USB: ${msg}`);
        toast.error(`Error al conectar USB: ${msg}`);
      }
    }
  };

  const readSerialLoop = async (port: any) => {
    let buffer = '';
    while (port && port.readable && keepReadingRef.current) {
      const reader = port.readable.getReader();
      readerRef.current = reader;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            const chunk = new TextDecoder().decode(value);
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              handleIncomingLine(line);
            }
          }
        }
      } catch (e) {
        console.error('Error en lectura serial:', e);
      } finally {
        reader.releaseLock();
      }
    }
  };

  const toggleBettySync = () => {
    setIsBettySyncActive((active) => {
      const next = !active;
      if (next) {
        addLog('☁️ [BETTY IOT]: Sincronización en vivo hacia la nube activada');
        toast.success('Betty Cloud Sync Activado');
      } else {
        addLog('☁️ [BETTY IOT]: Sincronización en vivo pausada');
        setBettySyncStatus('Inactivo');
      }
      return next;
    });
  };

  return (
    <>
      <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="p-4 pb-3.5 border-b border-border/60 space-y-3">
        {/* Fila 1: Título Principal, Icono e Indicador de Conexión */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <Sliders className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-bold tracking-tight text-foreground truncate">
                Panel de Control Físico
              </CardTitle>
              <p className="text-[11px] text-muted-foreground truncate">
                Cinemática, calibración y enlace ESP32
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] font-mono shrink-0 px-2 py-0.5 ${
              isConnected
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                : allowDemoSimulation
                ? 'border-sky-500/40 text-sky-400 bg-sky-500/10'
                : 'border-zinc-700/80 text-zinc-400 bg-zinc-800/40'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${
                isConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : allowDemoSimulation
                  ? 'bg-sky-400'
                  : 'bg-zinc-500'
              }`}
            />
            {isConnected
              ? 'USB Conectado'
              : allowDemoSimulation
              ? 'Demo Virtual'
              : 'Sin Dispositivo'}
          </Badge>
        </div>

        {/* Fila 2: Barra de Herramientas (Grid 3 columnas simétrico) */}
        <div className="grid grid-cols-3 gap-2">
          {/* 1. Conexión USB */}
          <Button
            size="sm"
            variant={isConnected ? 'outline' : 'default'}
            onClick={toggleWebSerial}
            className={`h-8 text-xs font-semibold gap-1.5 shadow-xs transition-all ${
              isConnected
                ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
            }`}
            title={isConnected ? 'Desconectar puerto USB Serial' : 'Conectar ESP32 por USB Serial'}
          >
            <Usb className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{isConnected ? 'Desconectar' : 'Conectar USB'}</span>
          </Button>

          {/* 2. Sincronización en la Nube Betty IoT Platform */}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleBettySync}
            className={`h-8 text-xs font-medium gap-1.5 border-border/80 transition-all ${
              isBettySyncActive
                ? 'border-purple-500/50 text-purple-300 bg-purple-500/15 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
            }`}
            title="Sincronizar telemetría con Betty IoT Platform en la nube vía Webhook"
          >
            <Cloud className={`h-3.5 w-3.5 shrink-0 ${isBettySyncActive ? 'text-purple-400 animate-pulse' : ''}`} />
            <span className="truncate">Betty Sync</span>
            {isBettySyncActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
            )}
          </Button>

          {/* 3. Configuración NVS ESP32 */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsConfigDialogOpen(true)}
            className="h-8 text-xs font-medium gap-1.5 border-border/80 text-muted-foreground hover:text-foreground hover:border-sky-500/50 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
            title="Configurar credenciales de WiFi y Betty IoT Platform en Flash NVS"
          >
            <Settings className="h-3.5 w-3.5 shrink-0 text-sky-400" />
            <span className="truncate">Config ESP32</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-xs flex-1 flex flex-col justify-between">
        {(() => {
          const canControl = isConnected || allowDemoSimulation;

          return (
            <>
              {/* Banner de Estado de Conexión de Hardware */}
              {!isConnected && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
                    allowDemoSimulation
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">
                        {allowDemoSimulation
                          ? 'Modo Simulación Demo Activo'
                          : 'Hardware Desconectado'}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          allowDemoSimulation
                            ? 'border-sky-500/40 text-sky-400'
                            : 'border-amber-500/40 text-amber-400'
                        }`}
                      >
                        {allowDemoSimulation ? 'Demo Virtual' : 'Sin Dispositivo'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {allowDemoSimulation
                        ? 'Estás interactuando en modo virtual local. Los movimientos visuales son de prueba y no afectan a ningún dispositivo físico.'
                        : 'Para operar la maqueta real, conecta el ESP32 por cable USB a tu ordenador y pulsa "Conectar USB". Sin hardware enlazado, los controles permanecen bloqueados para evitar movimientos falsos.'}
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Experimento Automático de Fricción (EXP) */}
              <div className="p-3 rounded-xl border border-purple-500/40 bg-purple-500/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-400 text-xs">
                    <Flame className="h-3.5 w-3.5" />
                    <span>Experimento de Plano Inclinado & Fricción</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-purple-500/30 text-purple-400"
                  >
                    Máx 90° | 20s
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Eleva la rampa suave y lentamente hasta que el sensor TCRT5000 detecta que el cubo resbala, congelando los motores y calculando μs = tan(θc).
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!canControl}
                    onClick={() => sendCommand('EXP')}
                    className="flex-1 h-8 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold gap-1.5 shadow-xs"
                    title={!canControl ? 'Conecta el ESP32 vía USB para iniciar el experimento' : ''}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Iniciar EXP (20s)</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!canControl}
                    onClick={() => sendCommand('STOP')}
                    className="w-24 h-8 font-semibold disabled:opacity-40 disabled:cursor-not-allowed gap-1"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span>STOP</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canControl}
                    onClick={() => sendCommand('CLEAR')}
                    className="w-24 h-8 border-border/80 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🔓 CLEAR
                  </Button>
                </div>
              </div>

              {/* 2. Control Manual de Ángulo y Presets */}
              <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-background/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Ángulo Manual:</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">{sliderVal}°</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={sliderVal}
                    disabled={!canControl}
                    onChange={(e) => setSliderVal(parseInt(e.target.value) || 0)}
                    className={`flex-1 accent-sky-500 h-1.5 bg-muted rounded-lg ${
                      !canControl ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  />
                  <Button
                    size="sm"
                    disabled={!canControl}
                    onClick={() => {
                      onAngleChange(sliderVal);
                      sendCommand(`BOTH,${sliderVal}`);
                    }}
                    className="h-7 px-3 text-xs bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold"
                  >
                    Enviar
                  </Button>
                </div>

                {/* Botones Presets */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[0, 45, 90, 135, 180].map((deg) => (
                    <Button
                      key={deg}
                      size="sm"
                      variant="outline"
                      disabled={!canControl}
                      onClick={() => {
                        setSliderVal(deg);
                        onAngleChange(deg);
                        sendCommand(`BOTH,${deg}`);
                      }}
                      className={`h-7 px-1 text-[11px] font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        sliderVal === deg
                          ? 'border-sky-500/70 bg-sky-500/20 text-sky-300 font-bold shadow-xs'
                          : 'border-border/70 hover:border-sky-500/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {deg}° {deg === 0 ? 'Reposo' : deg === 180 ? 'Máx' : ''}
                    </Button>
                  ))}
                </div>
              </div>

        {/* 3. Toggles de Auto-Stop y Tiempo Dinámico */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-lg border border-border/70 bg-background/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Auto-Stop Sensor
              </Label>
              <p className="text-[10px] text-muted-foreground">Congelar al deslizar</p>
            </div>
            <Switch
              checked={autoStop}
              disabled={!canControl}
              onCheckedChange={(val) => {
                onAutoStopToggle(val);
                sendCommand(val ? 'AUTO_STOP ON' : 'AUTO_STOP OFF');
              }}
            />
          </div>

          <div className="p-2.5 rounded-lg border border-border/70 bg-background/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[11px] font-semibold text-sky-400 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Tiempo Dinámico
              </Label>
              <p className="text-[10px] text-muted-foreground">Torque por gravedad</p>
            </div>
            <Switch
              checked={dynamicTime}
              disabled={!canControl}
              onCheckedChange={(val) => {
                onDynamicTimeToggle(val);
                sendCommand(val ? 'AUTO_DUR ON' : 'AUTO_DUR OFF');
              }}
            />
          </div>
        </div>

        {/* 4. Calibración Cinemática (Horn -> Madera) */}
        <div className="p-2.5 rounded-lg border border-border/70 bg-background/50 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-sky-400">Calibración Cinemática:</span>
            <p className="text-[10px] text-muted-foreground">Ángulo tabla real a 180° servo:</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="5"
              max="90"
              value={calibVal}
              disabled={!canControl}
              onChange={(e) => setCalibVal(parseFloat(e.target.value) || 30)}
              className="h-7 w-16 text-center font-mono text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <span className="font-mono text-xs text-muted-foreground">°</span>
            <Button
              size="sm"
              variant="outline"
              disabled={!canControl}
              onClick={() => {
                onMaxPlankAngleChange(calibVal);
                sendCommand(`CALIB ${calibVal}`);
                toast.success(`Calibración aplicada: ${calibVal}° máx`);
              }}
              className="h-7 px-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Fijar
            </Button>
          </div>
        </div>

        {/* 5. Selector de Curva de Easing y Duración Manual */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground">Curva de Easing:</Label>
            <select
              value={easingType}
              disabled={!canControl}
              onChange={(e) => {
                const nextType = e.target.value as EasingType;
                onEasingChange(nextType);
                sendCommand(`EASING ${nextType}`);
              }}
              className="w-full h-8 px-2 rounded-md border border-border/80 bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="CUBIC">Cubic (Recomendada)</option>
              <option value="SMOOTHERSTEP">SmootherStep (Quíntica)</option>
              <option value="SINE">Sinusoidal</option>
              <option value="QUAD">Smoothstep (Cuadrática)</option>
              <option value="LINEAR">Lineal (Constante)</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground">Duración Fija (ms):</Label>
            <div className="flex gap-1.5">
              <Input
                type="number"
                min="450"
                max="10000"
                step="250"
                value={manualDurationVal}
                disabled={!canControl}
                onChange={(e) => setManualDurationVal(parseInt(e.target.value) || 2500)}
                className="h-8 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!canControl}
                onClick={() => {
                  onDurationChange(manualDurationVal);
                  onDynamicTimeToggle(false);
                  sendCommand(`DUR ${manualDurationVal}`);
                  toast.success(`Duración fijada a ${manualDurationVal} ms`);
                }}
                className="h-8 px-2 text-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Fijar
              </Button>
            </div>
          </div>
        </div>

        {/* 6. Botones de Diagnóstico del Sensor & Portal Cautivo */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <Button
            size="sm"
            variant="outline"
            disabled={!canControl}
            onClick={() => sendCommand('INVERT_SENSOR')}
            className="h-6 px-2 text-[10px] font-mono border-border/70 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🔄 Invertir Polaridad DO
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!canControl}
            onClick={() => sendCommand('SENSOR')}
            className="h-6 px-2 text-[10px] font-mono border-border/70 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🔍 Test Sensor IR
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!canControl}
            onClick={() => sendCommand('PORTAL')}
            className="h-6 px-2 text-[10px] font-mono border-amber-500/50 text-amber-400 bg-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Levanta la red WiFi de configuración PlanoInclinado-Setup"
          >
            <Wifi className="h-3 w-3 mr-1" /> Portal WiFi
          </Button>
        </div>

        {/* 6.5 Toggle para pruebas sin hardware (Demo) */}
        {!isConnected && (
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/20 text-[11px]">
            <div className="space-y-0.5">
              <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" /> Simulación Virtual (Solo Demo)
              </span>
              <p className="text-[10px] text-muted-foreground">
                Habilitar controles sin hardware para pruebas visuales
              </p>
            </div>
            <Switch
              checked={allowDemoSimulation}
              onCheckedChange={(checked) => {
                setAllowDemoSimulation(checked);
                if (checked) {
                  toast.info('Modo simulación demo activado (sin hardware físico)');
                  addLog('⚡ [SIMULADOR]: Controles virtuales habilitados.');
                } else {
                  addLog('🔒 [SIMULADOR]: Controles bloqueados. Esperando hardware real.');
                }
              }}
            />
          </div>
        )}

        {/* 7. Consola Serial Interactiva */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Consola Serial:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px]">
                {isConnected
                  ? 'USB 115200 baud'
                  : allowDemoSimulation
                  ? 'Demo Virtual'
                  : 'Desconectado'}
              </span>
              <button
                type="button"
                onClick={() => setLogs(['[Consola limpiada]'])}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                title="Limpiar consola serial"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div
            ref={logBoxRef}
            className="h-28 p-2.5 rounded-lg border border-border/80 bg-slate-950/90 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-0.5 select-text"
          >
            {logs.map((line, i) => (
              <div key={i} className="leading-tight">
                {line}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={
                canControl
                  ? 'Comando libre (ej: EXP, BOTH,45 o SENSOR)'
                  : 'Conecta el ESP32 por USB para enviar comandos...'
              }
              value={customCmd}
              disabled={!canControl}
              onChange={(e) => setCustomCmd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customCmd.trim()) {
                  sendCommand(customCmd);
                  setCustomCmd('');
                }
              }}
              className="h-8 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <Button
              size="sm"
              disabled={!canControl}
              onClick={() => {
                if (customCmd.trim()) {
                  sendCommand(customCmd);
                  setCustomCmd('');
                }
              }}
              className="h-8 px-3 text-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </>
    );
  })()}
</CardContent>
    </Card>

    <ESP32ConfigDialog
      open={isConfigDialogOpen}
      onOpenChange={setIsConfigDialogOpen}
      isConnected={isConnected}
      sendCommand={sendCommand}
      lastReportedConfig={esp32Config}
      defaultSensorId={sensorId}
    />
  </>
);
}
