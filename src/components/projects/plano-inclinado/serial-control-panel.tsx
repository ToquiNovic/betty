'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ESP32ConfigDialog, type ESP32Config } from './esp32-config-dialog';
import {
  Usb,
  Bluetooth,
  BluetoothConnected,
  Play,
  AlertCircle,
  Sliders,
  Radio,
  Flame,
  Cloud,
  Settings,
  Square,
  RotateCcw,
} from 'lucide-react';
import { toast } from '@/lib/toast';

// Nordic UART Service (NUS) standard BLE UUIDs (ESP32 BotutoBleUart)
const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Web -> ESP32 (Write)
const NUS_TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ESP32 -> Web (Notify)

const MAX_SERVO_ANGLE = 150;
const ANGLE_PRESETS = [0, 30, 60, 90, 120, 150] as const;

function clampServoAngle(angle: number): number {
  if (!Number.isFinite(angle)) return 0;
  return Math.max(0, Math.min(MAX_SERVO_ANGLE, Math.round(angle)));
}

interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

interface BleNotificationEventLike {
  target: { value?: DataView | null };
}

interface BleCharacteristicLike {
  writeValueWithoutResponse?(data: BufferSource): Promise<void>;
  writeValue(data: BufferSource): Promise<void>;
  startNotifications(): Promise<void>;
  stopNotifications(): Promise<void>;
  addEventListener(type: string, listener: (event: BleNotificationEventLike) => void): void;
  removeEventListener(type: string, listener: (event: BleNotificationEventLike) => void): void;
}

interface BleServiceLike {
  getCharacteristic(uuid: string): Promise<BleCharacteristicLike>;
}

interface BleServerLike {
  connected?: boolean;
  connect(): Promise<BleServerLike>;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<BleServiceLike>;
}

interface BleDeviceLike {
  name?: string;
  gatt?: BleServerLike;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

interface NavigatorWithHardware {
  bluetooth?: { requestDevice(options: unknown): Promise<BleDeviceLike> };
  serial?: { requestPort(): Promise<SerialPortLike> };
}

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
  currentPlankAngle: number;
  maxPlankAngle: number;
  duration: number;
  onAngleChange: (angle: number) => void;
  onResetToZero?: () => void;
  onTelemetryPacket: (data: TelemetryPacketData) => void;
  onConnectionChange?: (connected: boolean, type?: 'bluetooth' | 'usb') => void;
  sensorId?: string;
}

export function SerialControlPanel({
  currentServoAngle,
  currentPlankAngle,
  maxPlankAngle,
  duration,
  onAngleChange,
  onResetToZero,
  onTelemetryPacket,
  onConnectionChange,
  sensorId = 'e290f30a-201e-482c-ac7e-a9d02583068d',
}: SerialControlPanelProps) {
  const [sliderVal, setSliderVal] = useState<number>(45);

  // Selección de canal y estado de conexión
  const [preferredMethod, setPreferredMethod] = useState<'bluetooth' | 'usb'>('bluetooth');
  const [connectionType, setConnectionType] = useState<'none' | 'bluetooth' | 'usb'>('none');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string>('');
  const [allowDemoSimulation, setAllowDemoSimulation] = useState<boolean>(false);

  // Web Serial refs
  const portRef = useRef<SerialPortLike | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef<boolean>(false);

  // Web Bluetooth (Nordic UART Service) refs
  const bleDeviceRef = useRef<BleDeviceLike | null>(null);
  const bleServerRef = useRef<BleServerLike | null>(null);
  const bleRxCharRef = useRef<BleCharacteristicLike | null>(null);
  const bleTxCharRef = useRef<BleCharacteristicLike | null>(null);
  const bleDisconnectListenerRef = useRef<(() => void) | null>(null);
  const bleNotificationListenerRef = useRef<((event: BleNotificationEventLike) => void) | null>(null);

  // Betty IoT Platform Sync state
  const [isBettySyncActive, setIsBettySyncActive] = useState<boolean>(false);
  const [, setBettyPacketsCount] = useState<number>(0);
  const lastBettyPostTimeRef = useRef<number>(0);

  // ESP32 NVS Config state
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState<boolean>(false);
  const [esp32Config, setEsp32Config] = useState<ESP32Config | null>(null);

  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup serial, bluetooth y temporizadores al desmontar
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
      if (bleDeviceRef.current) {
        try {
          if (bleDeviceRef.current.gatt?.connected) {
            bleDeviceRef.current.gatt.disconnect();
          }
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
      } catch (e) {
        console.error('Error parseando CFG JSON:', e);
      }
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
      }
    } catch {
      // Silenciar fallo transitorio de red en telemetría continua
    }
  };

  // Envío de comandos segmentados vía Bluetooth BLE (fragmentos de 20 bytes para respetar MTU BLE)
  const sendBleCommand = async (cmdStr: string): Promise<boolean> => {
    if (!bleRxCharRef.current) return false;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(cmdStr + '\n');
      const CHUNK_SIZE = 20;

      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        if (bleRxCharRef.current.writeValueWithoutResponse) {
          await bleRxCharRef.current.writeValueWithoutResponse(chunk);
        } else {
          await bleRxCharRef.current.writeValue(chunk);
        }
        if (data.length > CHUNK_SIZE) {
          await new Promise((resolve) => setTimeout(resolve, 15));
        }
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error enviando por Bluetooth: ${msg}`);
      return false;
    }
  };

  // Envío de comando (físico por Bluetooth BLE, USB Serial o simulación local)
  const sendCommand = async (cmdStr: string): Promise<boolean> => {
    cmdStr = cmdStr.trim();

    if (connectionType === 'bluetooth' && bleRxCharRef.current) {
      return await sendBleCommand(cmdStr);
    } else if (connectionType === 'usb' && writerRef.current) {
      try {
        const encoder = new TextEncoder();
        await writerRef.current.write(encoder.encode(cmdStr + '\n'));
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Error enviando por USB: ${msg}`);
        return false;
      }
    } else if (allowDemoSimulation) {
      // Modo Simulación Local Interactiva (solo si el usuario lo activó explícitamente)
      if (cmdStr.startsWith('BOTH,')) {
        const deg = clampServoAngle(parseFloat(cmdStr.substring(5)));
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
      const canalStr = preferredMethod === 'bluetooth' ? 'Bluetooth (BLE)' : 'cable USB';
      toast.warning(`Dispositivo no conectado. Conecta el ESP32 vía ${canalStr} para operar la maqueta.`);
      return false;
    }
  };

  // Motor de simulación local cinemática (curva cúbica fija, máximo 150°)
  const simulateLocalMovement = (destServo: number) => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    const clampedDest = clampServoAngle(destServo);
    const startServo = currentServoAngle;
    const startTime = Date.now();
    const dur = duration || 2500;
    onAngleChange(clampedDest);

    simTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1.0, elapsed / dur);
      const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const curServo = startServo + (clampedDest - startServo) * k;
      const curPlank = (curServo / 180.0) * maxPlankAngle;

      onTelemetryPacket({
        servo1: curServo,
        servo2: 180 - curServo,
        target: clampedDest,
        progress: k,
        sensorCubePresent: true,
        slipAngle: 0,
        plankAngle: curPlank,
        angularVelocity: Math.abs((clampedDest - startServo) / (dur / 1000)),
      });

      if (t >= 1.0 && simTimerRef.current) {
        clearInterval(simTimerRef.current);
      }
    }, 25);
  };

  // Simulación del experimento de fricción (0 a 90° en 20s con disparo a 18.5°)
  const simulateAutomatedExperiment = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    const simCriticalPlank = 18.5;
    const startServo = currentServoAngle;
    const targetServo = 90.0;
    const startTime = Date.now();
    const dur = 20000;

    simTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1.0, elapsed / dur);

      const curServo = startServo + (targetServo - startServo) * t;
      const curPlank = (curServo / 180.0) * maxPlankAngle;

      if (curPlank >= simCriticalPlank) {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        const mu_s = Math.tan((simCriticalPlank * Math.PI) / 180);
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

  const applyManualAngle = (rawDeg: number) => {
    const clamped = clampServoAngle(rawDeg);
    setSliderVal(clamped);
    onAngleChange(clamped);
    void sendCommand(`BOTH,${clamped}`);
  };

  const handleResetToZero = async () => {
    setSliderVal(0);
    onAngleChange(0);
    onResetToZero?.();
    const cleared = await sendCommand('CLEAR');
    if (cleared) {
      await sendCommand('BOTH,0');
    }
  };

  // Desconexión limpia de Bluetooth BLE
  const disconnectBluetooth = async () => {
    try {
      if (bleTxCharRef.current && bleNotificationListenerRef.current) {
        try {
          bleTxCharRef.current.removeEventListener(
            'characteristicvaluechanged',
            bleNotificationListenerRef.current
          );
          await bleTxCharRef.current.stopNotifications();
        } catch (e) {
          console.warn('Error al detener notificaciones BLE:', e);
        }
      }
      if (bleDeviceRef.current) {
        if (bleDisconnectListenerRef.current) {
          bleDeviceRef.current.removeEventListener(
            'gattserverdisconnected',
            bleDisconnectListenerRef.current
          );
        }
        if (bleDeviceRef.current.gatt?.connected) {
          bleDeviceRef.current.gatt.disconnect();
        }
      }
    } catch (e) {
      console.error('Error al desconectar BLE:', e);
    } finally {
      bleDeviceRef.current = null;
      bleServerRef.current = null;
      bleRxCharRef.current = null;
      bleTxCharRef.current = null;
      bleDisconnectListenerRef.current = null;
      bleNotificationListenerRef.current = null;
      setIsConnected(false);
      setConnectionType('none');
      setConnectedDeviceName('');
      onConnectionChange?.(false);
      toast.info('Bluetooth desconectado');
    }
  };

  // Conexión Web Bluetooth API (Nordic UART Service - NUS)
  const connectBluetooth = async () => {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithHardware) : undefined;
    if (!nav?.bluetooth) {
      toast.error('Tu navegador no soporta Web Bluetooth API. Usa Google Chrome o Microsoft Edge.');
      return;
    }

    try {
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { services: [NUS_SERVICE_UUID] },
          { namePrefix: 'Botuto' },
          { namePrefix: 'ESP32' },
          { namePrefix: 'Plano' },
        ],
        optionalServices: [NUS_SERVICE_UUID],
      });

      if (!device.gatt) {
        throw new Error('Dispositivo sin interfaz GATT disponible');
      }

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(NUS_SERVICE_UUID);
      const rxChar = await service.getCharacteristic(NUS_RX_UUID);
      const txChar = await service.getCharacteristic(NUS_TX_UUID);

      await txChar.startNotifications();

      let bleIncomingBuffer = '';
      const handleBleNotification = (event: BleNotificationEventLike) => {
        const value = event.target.value;
        if (!value) return;
        const chunk = new TextDecoder().decode(value);
        bleIncomingBuffer += chunk;
        const lines = bleIncomingBuffer.split('\n');
        bleIncomingBuffer = lines.pop() || '';

        for (const line of lines) {
          handleIncomingLine(line);
        }
      };

      const handleBleDisconnect = () => {
        bleDeviceRef.current = null;
        bleServerRef.current = null;
        bleRxCharRef.current = null;
        bleTxCharRef.current = null;
        bleDisconnectListenerRef.current = null;
        bleNotificationListenerRef.current = null;
        setIsConnected(false);
        setConnectionType('none');
        setConnectedDeviceName('');
        onConnectionChange?.(false);
        toast.info('ESP32 Bluetooth desconectado');
      };

      txChar.addEventListener('characteristicvaluechanged', handleBleNotification);
      device.addEventListener('gattserverdisconnected', handleBleDisconnect);

      bleDeviceRef.current = device;
      bleServerRef.current = server;
      bleRxCharRef.current = rxChar;
      bleTxCharRef.current = txChar;
      bleDisconnectListenerRef.current = handleBleDisconnect;
      bleNotificationListenerRef.current = handleBleNotification;

      setIsConnected(true);
      setConnectionType('bluetooth');
      setConnectedDeviceName(device.name || 'Botuto-Plano');
      onConnectionChange?.(true, 'bluetooth');
      toast.success(`ESP32 Conectado por Bluetooth ("${device.name || 'Botuto-Plano'}")`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotFoundError') {
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al conectar Bluetooth: ${msg}`);
    }
  };

  // Desconexión limpia de Web Serial (USB)
  const disconnectWebSerial = async () => {
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
    setConnectionType('none');
    setConnectedDeviceName('');
    onConnectionChange?.(false);
    toast.info('Puerto USB desconectado');
  };

  // Conexión Web Serial por navegador (USB)
  const connectWebSerial = async () => {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithHardware) : undefined;
    if (!nav?.serial) {
      toast.error('Tu navegador no soporta Web Serial API. Usa Google Chrome o Microsoft Edge.');
      return;
    }

    try {
      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 115200 });
      if (!port.writable) {
        throw new Error('Puerto serial sin canal de escritura');
      }

      portRef.current = port;
      writerRef.current = port.writable.getWriter();
      keepReadingRef.current = true;
      setIsConnected(true);
      setConnectionType('usb');
      setConnectedDeviceName('ESP32 USB');
      onConnectionChange?.(true, 'usb');

      toast.success('ESP32 Conectado por USB a 115200 baudios');
      readSerialLoop(port);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al conectar USB: ${msg}`);
    }
  };

  // Toggle general de enlace según el canal preferido
  const toggleConnection = async () => {
    if (isConnected) {
      if (connectionType === 'bluetooth') {
        await disconnectBluetooth();
      } else {
        await disconnectWebSerial();
      }
    } else {
      if (preferredMethod === 'bluetooth') {
        await connectBluetooth();
      } else {
        await connectWebSerial();
      }
    }
  };

  const readSerialLoop = async (port: SerialPortLike) => {
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
        toast.success('Betty Cloud Sync Activado');
      } else {
        toast.info('Betty Cloud Sync Pausado');
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
                  Control experimental y enlace ESP32
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-[10px] font-mono shrink-0 px-2 py-0.5 ${
                isConnected
                  ? connectionType === 'bluetooth'
                    ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                    : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                  : allowDemoSimulation
                  ? 'border-sky-500/40 text-sky-400 bg-sky-500/10'
                  : 'border-zinc-700/80 text-zinc-400 bg-zinc-800/40'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${
                  isConnected
                    ? connectionType === 'bluetooth'
                      ? 'bg-blue-400 animate-pulse'
                      : 'bg-emerald-400 animate-pulse'
                    : allowDemoSimulation
                    ? 'bg-sky-400'
                    : 'bg-zinc-500'
                }`}
              />
              {isConnected
                ? connectionType === 'bluetooth'
                  ? `BLE: ${connectedDeviceName || 'Conectado'}`
                  : 'USB Conectado'
                : allowDemoSimulation
                ? 'Demo Virtual'
                : 'Sin Dispositivo'}
            </Badge>
          </div>

          {/* Fila 1.5: Selector de Canal de Enlace (Bluetooth BLE vs USB Serial) */}
          <div className="flex items-center justify-between text-[11px] bg-muted/30 px-2.5 py-1 rounded-lg border border-border/50">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-sky-400" /> Canal de Enlace:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isConnected}
                onClick={() => setPreferredMethod('bluetooth')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  preferredMethod === 'bluetooth'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                } ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Conexión inalámbrica BLE vía Nordic UART Service (NUS)"
              >
                <Bluetooth className="h-3 w-3" /> Bluetooth (BLE)
              </button>
              <button
                type="button"
                disabled={isConnected}
                onClick={() => setPreferredMethod('usb')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  preferredMethod === 'usb'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                } ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Conexión cableada por Web Serial API (115200 baudios)"
              >
                <Usb className="h-3 w-3" /> USB Serial
              </button>
            </div>
          </div>

          {/* Fila 2: Barra de Herramientas (Grid 3 columnas simétrico) */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Conexión Hardware (Bluetooth o USB) */}
            <Button
              size="sm"
              variant={isConnected ? 'outline' : 'default'}
              onClick={toggleConnection}
              className={`h-8 text-xs font-semibold gap-1.5 shadow-xs transition-all ${
                isConnected
                  ? connectionType === 'bluetooth'
                    ? 'border-blue-500/50 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                    : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                  : preferredMethod === 'bluetooth'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
              }`}
            >
              {isConnected ? (
                connectionType === 'bluetooth' ? (
                  <BluetoothConnected className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Usb className="h-3.5 w-3.5 shrink-0" />
                )
              ) : preferredMethod === 'bluetooth' ? (
                <Bluetooth className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Usb className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">
                {isConnected
                  ? 'Desconectar'
                  : preferredMethod === 'bluetooth'
                  ? 'Conectar BLE'
                  : 'Conectar USB'}
              </span>
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
              <div className="space-y-4">
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
                          ? 'Estás operando en modo virtual local. Los movimientos son de prueba y no afectan a ningún dispositivo físico.'
                          : preferredMethod === 'bluetooth'
                          ? 'Enciende tu ESP32 con Bluetooth activo y pulsa "Conectar BLE" para enlazarlo, o activa la simulación demo abajo.'
                          : 'Conecta el ESP32 por USB y pulsa "Conectar USB", o activa la simulación demo abajo.'}
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
                    Eleva la rampa suavemente hasta que el sensor TCRT5000 detecta deslizamiento y calcula μs = tan(θc).
                  </p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!canControl}
                      onClick={() => void sendCommand('EXP')}
                      className="flex-1 h-8 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold gap-1.5 shadow-xs"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Iniciar EXP</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!canControl}
                      onClick={() => void sendCommand('STOP')}
                      className="w-24 h-8 font-semibold disabled:opacity-40 disabled:cursor-not-allowed gap-1"
                    >
                      <Square className="h-3 w-3 fill-current" />
                      <span>STOP</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canControl}
                      onClick={() => void handleResetToZero()}
                      className="w-24 h-8 border-border/80 disabled:opacity-40 disabled:cursor-not-allowed gap-1"
                      title="Desbloquear y regresar la rampa a 0°"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Ir a 0°</span>
                    </Button>
                  </div>
                </div>

                {/* 2. Control Manual de Ángulo (0° - 150°) */}
                <div className="space-y-2.5 p-3 rounded-xl border border-border/70 bg-background/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Ángulo Manual (0–150°):</span>
                    <span className="font-mono font-bold text-sky-400 text-sm">{sliderVal}°</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={MAX_SERVO_ANGLE}
                      value={sliderVal}
                      disabled={!canControl}
                      onChange={(e) => setSliderVal(clampServoAngle(parseInt(e.target.value, 10)))}
                      className={`flex-1 accent-sky-500 h-1.5 bg-muted rounded-lg ${
                        !canControl ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    />
                    <Button
                      size="sm"
                      disabled={!canControl}
                      onClick={() => applyManualAngle(sliderVal)}
                      className="h-7 px-3 text-xs bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold"
                    >
                      Enviar
                    </Button>
                  </div>

                  {/* Presets rápidos hasta 150° */}
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {ANGLE_PRESETS.map((deg) => (
                      <Button
                        key={deg}
                        size="sm"
                        variant="outline"
                        disabled={!canControl}
                        onClick={() => applyManualAngle(deg)}
                        className={`h-7 px-1 text-[11px] font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          sliderVal === deg
                            ? 'border-sky-500/70 bg-sky-500/20 text-sky-300 font-bold shadow-xs'
                            : 'border-border/70 hover:border-sky-500/40 text-muted-foreground hover:text-foreground'
                        }`}
                        title={deg === 0 ? '0° Reposo' : deg === 150 ? '150° Máximo' : `${deg}°`}
                      >
                        {deg}°
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 3. Toggle para pruebas sin hardware (Demo) */}
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
                        } else {
                          toast.info('Modo simulación demo desactivado');
                        }
                      }}
                    />
                  </div>
                )}
              </div>
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
