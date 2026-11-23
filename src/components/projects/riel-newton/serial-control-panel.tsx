'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Usb,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Send,
  Zap,
  Terminal,
  Play,
  RotateCw,
  Sliders,
  Radio,
  Settings,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { ESP32ConfigDialog } from './esp32-config-dialog';

// Nordic UART Service (NUS) standard BLE UUIDs (ESP32 BotutoBleUart)
const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Web -> ESP32
const NUS_TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ESP32 -> Web

export interface RielTelemetryPacketData {
  transitTime: number;
  distance: number;
  averageVelocity: number;
  finalVelocity: number;
  acceleration: number;
  netForce: number;
  kineticEnergy: number;
  momentum: number;
  leverPosition: number;
  servoAngle: number;
  impactDetected: boolean;
  inTransit: boolean;
  transitProgress: number;
  sensorsState: {
    s1: boolean;
    s2: boolean;
    s3: boolean;
    s4: boolean;
    fsr: boolean;
  };
}

export interface RielSerialControlPanelProps {
  leverPosition: number;
  servoAngle: number;
  inTransit: boolean;
  cartMassKg: number;
  onLeverChange: (notch: number) => void;
  onServoAngleChange: (angle: number) => void;
  onCartMassChange: (mass: number) => void;
  onTelemetryPacket: (data: RielTelemetryPacketData) => void;
  onConnectionChange?: (connected: boolean, type?: 'bluetooth' | 'usb') => void;
  sensorId?: string;
}

export function SerialControlPanel({
  leverPosition,
  servoAngle,
  inTransit,
  cartMassKg,
  onLeverChange,
  onServoAngleChange,
  onCartMassChange,
  onTelemetryPacket,
  onConnectionChange,
  sensorId = 'f74a812b-4d6e-4c3a-9e1f-8a0d92e5b721',
}: RielSerialControlPanelProps) {
  // Conectividad Hardware
  const [port, setPort] = useState<any>(null);
  const [isSerialConnected, setIsSerialConnected] = useState<boolean>(false);
  const [bleDevice, setBleDevice] = useState<any>(null);
  const [bleRxChar, setBleRxChar] = useState<any>(null);
  const [isBleConnected, setIsBleConnected] = useState<boolean>(false);

  // Terminal & Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[INIT] Estación de control para Riel de Newton lista.',
    '[INFO] Selecciona USB Serial (115200) o Bluetooth BLE NUS.',
    '[INFO] En ausencia de hardware físico, el modo simulador está activo.',
  ]);
  const [commandInput, setCommandInput] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Diálogo Config ESP32
  const [configOpen, setConfigOpen] = useState<boolean>(false);

  // Animación de simulación
  const simulationRef = useRef<number | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => {
      const next = [...prev, `[${timestamp}] ${msg}`];
      if (next.length > 200) next.shift();
      return next;
    });
  };

  // Enviar comando a hardware (Serial o BLE)
  const sendCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    appendLog(`TX >> ${trimmed}`);

    if (isBleConnected && bleRxChar) {
      try {
        const encoder = new TextEncoder();
        await bleRxChar.writeValue(encoder.encode(`${trimmed}\n`));
      } catch (err: any) {
        appendLog(`[ERROR BLE TX] ${err?.message || err}`);
      }
    } else if (isSerialConnected && port && port.writable) {
      try {
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(`${trimmed}\n`));
        writer.releaseLock();
      } catch (err: any) {
        appendLog(`[ERROR SERIAL TX] ${err?.message || err}`);
      }
    } else {
      // Modo simulador local
      handleSimulatedCommand(trimmed);
    }
  };

  // Simulación física local de Newton
  const handleSimulatedCommand = (cmd: string) => {
    const upper = cmd.toUpperCase();

    if (upper === 'OPEN') {
      onServoAngleChange(90);
      appendLog('<< [SIM] Compuerta abierta a 90° (TLM:SERVO,90)');
    } else if (upper === 'CLOSE') {
      onServoAngleChange(0);
      appendLog('<< [SIM] Compuerta cerrada a 0° (TLM:SERVO,0)');
    } else if (upper.startsWith('LAUNCH') || upper === 'TEST' || upper === 'TRIGGER') {
      runSimulatedLaunch();
    } else if (upper.startsWith('POS')) {
      const parts = upper.split(' ');
      const notch = parseInt(parts[1] || '1', 10);
      onLeverChange(Math.min(4, Math.max(1, notch)));
      appendLog(`<< [SIM] Muesca de resorte ajustada a: ${notch}`);
    } else if (upper === 'INV_SENSOR') {
      appendLog('<< [SIM] Polaridad óptica invertida (ACK:POLARITY,LOW)');
    } else if (upper === 'STATUS') {
      appendLog('<< [SIM] STATUS: S1:1 S2:0 S3:0 S4:0 FSR:0 Servo:0° Temp:28.4°C Heap:184320B');
    } else {
      appendLog(`<< [SIM] Comando '${cmd}' recibido en modo simulación.`);
    }
  };

  // Correr eyección y carrera simulada con física newtoniana
  const runSimulatedLaunch = () => {
    if (inTransit) {
      toast.warning('Hay una carrera en curso.');
      return;
    }

    const notch = leverPosition || 1;
    // Fuerzas estimadas por compresión de resorte: Ley de Hooke F = k * x
    const forceN = 0.5 + notch * 0.75; // 1.25 N a 3.5 N
    const mass = cartMassKg || 0.15; // 150 g
    const accel = forceN / mass; // a = F / m
    const dist = 0.475; // 47.5 cm

    // t = sqrt(2 * d / a)
    const transitSeconds = Math.sqrt((2 * dist) / accel);
    const finalV = accel * transitSeconds;
    const avgV = dist / transitSeconds;
    const ek = 0.5 * mass * Math.pow(finalV, 2);
    const p = mass * finalV;

    appendLog(`>>> DISPARADOR ACTIVADO (Muesca ${notch}) - F=${forceN.toFixed(3)}N | a=${accel.toFixed(2)}m/s²`);
    onServoAngleChange(90);

    const startTime = Date.now();
    const durationMs = transitSeconds * 1000;

    const frameStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Estado de fotocompuertas durante el paso del carro
      const s1 = progress < 0.08;
      const s2 = progress >= 0.04 && progress <= 0.12;
      const s3 = progress >= 0.09 && progress <= 0.18;
      const s4 = progress >= 0.14 && progress <= 0.24;
      const fsr = progress >= 0.98;

      onTelemetryPacket({
        transitTime: (elapsed / 1000),
        distance: dist * progress,
        averageVelocity: avgV * progress,
        finalVelocity: finalV * progress,
        acceleration: accel,
        netForce: forceN,
        kineticEnergy: ek * Math.pow(progress, 2),
        momentum: p * progress,
        leverPosition: notch,
        servoAngle: 90,
        impactDetected: fsr,
        inTransit: progress < 1.0,
        transitProgress: progress,
        sensorsState: { s1, s2, s3, s4, fsr },
      });

      if (progress < 1.0) {
        simulationRef.current = requestAnimationFrame(frameStep);
      } else {
        // Impacto final
        onServoAngleChange(0);
        appendLog(`==============================================`);
        appendLog(`¡IMPACTO EN META CONFIRMADO!`);
        appendLog(`Distancia (d): ${dist.toFixed(3)} m | Tiempo (Dt): ${transitSeconds.toFixed(3)} s`);
        appendLog(`Velocidad Media: ${avgV.toFixed(3)} m/s | Velocidad Final: ${finalV.toFixed(3)} m/s`);
        appendLog(`Aceleración (a): ${accel.toFixed(3)} m/s² | Fuerza (F=m·a): ${forceN.toFixed(4)} N`);
        appendLog(`Energía Cinética: ${ek.toFixed(4)} J | Momento: ${p.toFixed(4)} N·s`);
        appendLog(`==============================================`);
        toast.success(`¡Impacto en meta a ${finalV.toFixed(2)} m/s! (F = ${forceN.toFixed(3)} N)`);
      }
    };

    simulationRef.current = requestAnimationFrame(frameStep);
  };

  // Conexión Web Bluetooth
  const connectBluetooth = async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      toast.error('Web Bluetooth no es compatible con este navegador. Usa Chrome o Edge.');
      return;
    }

    try {
      appendLog('[BLE] Solicitando dispositivo Botuto Riel de Newton...');
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: 'Botuto' }, { namePrefix: 'Riel' }, { namePrefix: 'ESP32' }],
        optionalServices: [NUS_SERVICE_UUID],
      });

      appendLog(`[BLE] Conectando a ${device.name || 'Dispositivo'}...`);
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(NUS_SERVICE_UUID);

      const rx = await service.getCharacteristic(NUS_RX_UUID);
      const tx = await service.getCharacteristic(NUS_TX_UUID);

      await tx.startNotifications();
      tx.addEventListener('characteristicvaluechanged', (event: any) => {
        const val = new TextDecoder().decode(event.target.value);
        handleIncomingLine(val);
      });

      setBleDevice(device);
      setBleRxChar(rx);
      setIsBleConnected(true);
      onConnectionChange?.(true, 'bluetooth');
      appendLog('✅ [BLE] Conectado exitosamente con perfil Nordic UART.');
      toast.success('Riel de Newton conectado por Bluetooth BLE');
    } catch (err: any) {
      appendLog(`[BLE ERROR] ${err?.message || err}`);
      toast.error('Error al conectar por Bluetooth');
    }
  };

  const disconnectBluetooth = async () => {
    if (bleDevice && bleDevice.gatt.connected) {
      bleDevice.gatt.disconnect();
    }
    setBleDevice(null);
    setBleRxChar(null);
    setIsBleConnected(false);
    onConnectionChange?.(false);
    appendLog('[BLE] Desconectado.');
  };

  // Conexión Web Serial
  const connectSerial = async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).serial) {
      toast.error('Web Serial no es compatible con este navegador. Usa Chrome o Edge.');
      return;
    }

    try {
      appendLog('[SERIAL] Solicitando puerto COM a 115200 baudios...');
      const sPort = await (navigator as any).serial.requestPort();
      await sPort.open({ baudRate: 115200 });

      setPort(sPort);
      setIsSerialConnected(true);
      onConnectionChange?.(true, 'usb');
      appendLog('✅ [SERIAL] Puerto abierto a 115200 baudios.');
      toast.success('ESP32 Riel conectado por USB Serial');

      readSerialLoop(sPort);
    } catch (err: any) {
      appendLog(`[SERIAL ERROR] ${err?.message || err}`);
      toast.error('Error al abrir el puerto serial.');
    }
  };

  const disconnectSerial = async () => {
    if (port) {
      try {
        await port.close();
      } catch (e) {}
    }
    setPort(null);
    setIsSerialConnected(false);
    onConnectionChange?.(false);
    appendLog('[SERIAL] Puerto cerrado.');
  };

  const readSerialLoop = async (sPort: any) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = sPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            handleIncomingLine(line);
          }
        }
      }
    } catch (err) {
      appendLog(`[SERIAL READ ERROR] ${err}`);
    } finally {
      reader.releaseLock();
    }
  };

  // Procesamiento de tramas recibidas de hardware
  const handleIncomingLine = (rawLine: string) => {
    const line = rawLine.trim();
    if (!line) return;

    appendLog(`RX << ${line}`);

    // Parseo de tramas TLM
    if (line.startsWith('TLM:RESULT,')) {
      // TLM:RESULT,Dt,dist,v_avg,v_final,accel,netForce,ek,momentum
      const parts = line.substring(11).split(',');
      if (parts.length >= 8) {
        const dt = parseFloat(parts[0]) || 0;
        const d = parseFloat(parts[1]) || 0.475;
        const vAvg = parseFloat(parts[2]) || 0;
        const vFinal = parseFloat(parts[3]) || 0;
        const a = parseFloat(parts[4]) || 0;
        const f = parseFloat(parts[5]) || 0;
        const ek = parseFloat(parts[6]) || 0;
        const p = parseFloat(parts[7]) || 0;

        onTelemetryPacket({
          transitTime: dt,
          distance: d,
          averageVelocity: vAvg,
          finalVelocity: vFinal,
          acceleration: a,
          netForce: f,
          kineticEnergy: ek,
          momentum: p,
          leverPosition,
          servoAngle: 0,
          impactDetected: true,
          inTransit: false,
          transitProgress: 1.0,
          sensorsState: { s1: false, s2: false, s3: false, s4: false, fsr: true },
        });
      }
    } else if (line.startsWith('TLM:POS,')) {
      const pos = parseInt(line.substring(8), 10);
      onLeverChange(pos);
    } else if (line === 'TLM:LAUNCH') {
      onServoAngleChange(90);
    } else if (line.startsWith('TLM:SERVO,')) {
      const sAng = parseInt(line.substring(10), 10);
      onServoAngleChange(sAng);
    }
  };

  return (
    <Card className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-md">
      <CardHeader className="p-4 pb-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Radio className="h-4 w-4 text-sky-500 animate-pulse" />
            <span>Panel de Enlace & Experimentación</span>
          </CardTitle>

          <Button
            variant="outline"
            size="xs"
            onClick={() => setConfigOpen(true)}
            className="h-7 text-xs gap-1 border-border/80"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Config ESP32</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Botones de Conexión Física */}
        <div className="grid grid-cols-2 gap-2">
          {/* Web Bluetooth */}
          <Button
            variant={isBleConnected ? 'default' : 'outline'}
            size="sm"
            onClick={isBleConnected ? disconnectBluetooth : connectBluetooth}
            className={`gap-1.5 text-xs h-9 font-semibold ${
              isBleConnected
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-blue-500/40 hover:bg-blue-500/10 text-blue-400'
            }`}
          >
            {isBleConnected ? (
              <BluetoothConnected className="h-4 w-4" />
            ) : (
              <Bluetooth className="h-4 w-4" />
            )}
            <span>{isBleConnected ? 'Desconectar BLE' : 'Conectar BLE (NUS)'}</span>
          </Button>

          {/* Web Serial */}
          <Button
            variant={isSerialConnected ? 'default' : 'outline'}
            size="sm"
            onClick={isSerialConnected ? disconnectSerial : connectSerial}
            className={`gap-1.5 text-xs h-9 font-semibold ${
              isSerialConnected
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <Usb className="h-4 w-4" />
            <span>{isSerialConnected ? 'Cerrar Puerto' : 'Web Serial (115200)'}</span>
          </Button>
        </div>

        {/* Parámetros de Ensayo Dinámico */}
        <div className="p-3 rounded-xl border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>Muesca de Compresión del Resorte (Palanca)</span>
            </Label>
            <Badge variant="outline" className="font-mono text-xs font-bold text-sky-400">
              Muesca {leverPosition}
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((notch) => (
              <Button
                key={notch}
                variant={leverPosition === notch ? 'default' : 'outline'}
                size="xs"
                onClick={() => {
                  onLeverChange(notch);
                  sendCommand(`POS ${notch}`);
                }}
                className={`text-xs h-8 font-bold ${
                  leverPosition === notch
                    ? 'bg-sky-500 hover:bg-sky-600 text-white'
                    : 'text-muted-foreground'
                }`}
              >
                #{notch} ({0.5 + notch * 0.75} N)
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <Label className="text-[11px] text-muted-foreground">Masa del Carro Móvil (kg)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.05"
                max="1.0"
                value={cartMassKg}
                onChange={(e) => onCartMassChange(parseFloat(e.target.value) || 0.15)}
                className="h-8 text-xs font-mono mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Compuerta Servo Actual</Label>
              <div className="h-8 rounded-md border bg-background/50 flex items-center justify-between px-2.5 mt-1">
                <span className="text-xs font-mono font-bold text-foreground">
                  {servoAngle === 90 ? 'Abierta (90°)' : 'Bloqueada (0°)'}
                </span>
                {servoAngle === 90 ? (
                  <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas del Riel */}
        <div className="grid grid-cols-3 gap-2">
          {/* Botón Principal Disparar */}
          <Button
            size="sm"
            onClick={() => sendCommand('LAUNCH')}
            className="col-span-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold gap-2 h-10 shadow-md"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>DISPARAR ENSAYO (LAUNCH)</span>
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => sendCommand('OPEN')}
            className="text-xs h-8 gap-1 border-border/80"
          >
            <Unlock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Abrir Servo</span>
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => sendCommand('CLOSE')}
            className="text-xs h-8 gap-1 border-border/80"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Cerrar Servo</span>
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => sendCommand('INV_SENSOR')}
            className="text-xs h-8 gap-1 border-border/80"
          >
            <RotateCw className="h-3.5 w-3.5 text-sky-400" />
            <span>Inv. Polaridad</span>
          </Button>
        </div>

        {/* Terminal Interactivo de Salida */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Consola Serial (115200 bps)</span>
            </span>

            <Button
              variant="ghost"
              size="xs"
              onClick={() => setTerminalLogs([])}
              className="h-6 text-[10px] text-muted-foreground hover:text-foreground gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Limpiar</span>
            </Button>
          </div>

          <div className="h-40 w-full overflow-y-auto rounded-xl border border-border/70 bg-black/80 p-2.5 font-mono text-[11px] text-emerald-400 space-y-0.5 shadow-inner">
            {terminalLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('TX >>')
                    ? 'text-sky-300 font-bold'
                    : log.includes('IMPACTO')
                    ? 'text-rose-400 font-extrabold'
                    : log.includes('ERROR')
                    ? 'text-rose-500'
                    : 'text-emerald-400/90'
                }
              >
                {log}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Input de comandos personalizados */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (commandInput.trim()) {
                sendCommand(commandInput);
                setCommandInput('');
              }
            }}
            className="flex items-center gap-2 pt-1"
          >
            <Input
              type="text"
              placeholder="Escribe comando (LAUNCH, OPEN, CLOSE, POS 2, STATUS)..."
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="h-8 text-xs font-mono"
            />
            <Button type="submit" size="sm" className="h-8 px-3 gap-1 text-xs">
              <Send className="h-3 w-3" />
              <span>Enviar</span>
            </Button>
          </form>
        </div>
      </CardContent>

      {/* Diálogo de configuración NVS del ESP32 */}
      <ESP32ConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onSaveConfig={async (cfg) => {
          appendLog(`[CFG] Guardando WiFi (${cfg.ssid}) y Betty Sensor (${cfg.sensorUuid})`);
          await sendCommand(`SET_WIFI ${cfg.ssid} ${cfg.password}`);
          await sendCommand(`SET_UUID ${cfg.sensorUuid}`);
          toast.success('Configuración enviada al microcontrolador ESP32');
        }}
        initialSensorId={sensorId}
      />
    </Card>
  );
}
