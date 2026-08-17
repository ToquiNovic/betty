'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProjectFirmware } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Cpu,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Terminal as TerminalIcon,
  RotateCcw,
  Usb,
  Download,
  Info,
} from 'lucide-react';
import { ESPLoader, Transport } from 'esptool-js';

interface FirmwareFlasherProps {
  firmwares: ProjectFirmware[];
  boardType?: string;
}

export function FirmwareFlasher({ firmwares, boardType }: FirmwareFlasherProps) {
  const [selectedFwId, setSelectedFwId] = useState<string>(firmwares[0]?.id || '');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [flashSuccess, setFlashSuccess] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const transportRef = useRef<Transport | null>(null);

  useEffect(() => {
    // Check Web Serial API support
    if (typeof window !== 'undefined') {
      setIsSupported('serial' in navigator);
    }
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (text: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
  };

  const selectedFirmware = firmwares.find((f) => f.id === selectedFwId) || firmwares[0];

  const handleFlash = async () => {
    if (!selectedFirmware) return;

    setIsFlashing(true);
    setProgress(0);
    setFlashSuccess(false);
    setLogs([]);
    setStatusMessage('Solicitando puerto serial...');
    addLog(`Iniciando flashing de: ${selectedFirmware.name} (v${selectedFirmware.version})`);

    let device: any = null;
    let transport: Transport | null = null;

    try {
      // 1. Request serial port from user
      device = await (navigator as any).serial.requestPort();
      addLog('Puerto serial seleccionado por el usuario.');

      // 2. Setup Transport
      transport = new Transport(device, true);
      transportRef.current = transport;

      const baudrate = 921600; // Fast baudrate for flashing
      setStatusMessage('Conectando con la placa...');
      addLog(`Conectando con baudrate ${baudrate}...`);

      const espLoader = new ESPLoader({
        transport,
        baudrate,
        terminal: {
          clean: () => {},
          write: (line: string) => addLog(line.trim()),
          writeLine: (line: string) => addLog(line.trim()),
        },
      });

      // 3. Connect to ESP
      const chip = await espLoader.main();
      addLog(`¡Conectado exitosamente! Chip detectado: ${chip}`);
      setStatusMessage(`Conectado a chip ${chip}. Descargando binario...`);

      // 4. Download firmware binary from server
      addLog(`Descargando firmware desde: ${selectedFirmware.firmwareUrl}`);
      const resp = await fetch(selectedFirmware.firmwareUrl);
      if (!resp.ok) {
        throw new Error(`Error al descargar firmware desde el servidor (${resp.status})`);
      }
      const buffer = await resp.arrayBuffer();
      const binaryData = new Uint8Array(buffer);
      addLog(`Firmware descargado. Tamaño: ${(binaryData.length / 1024).toFixed(1)} KB`);

      // 5. Flash binary
      const offset = selectedFirmware.flashOffset
        ? parseInt(selectedFirmware.flashOffset, 16) || 0x10000
        : 0x10000;

      setStatusMessage('Escribiendo en memoria flash...');
      addLog(`Escribiendo en dirección de memoria 0x${offset.toString(16)}...`);

      const fileArray = [
        {
          data: binaryData,
          address: offset,
        },
      ];

      await espLoader.writeFlash({
        fileArray,
        flashSize: 'keep',
        flashMode: 'keep',
        flashFreq: 'keep',
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex: number, written: number, total: number) => {
          const pct = Math.round((written / total) * 100);
          setProgress(pct);
          setStatusMessage(`Escribiendo firmware: ${pct}%`);
        },
      });

      addLog('¡Escritura completada exitosamente!');
      setStatusMessage('Reiniciando placa...');

      // 6. Reset device
      await espLoader.after();
      await transport.disconnect();
      transportRef.current = null;

      addLog('Placa reiniciada con el nuevo firmware.');
      setProgress(100);
      setStatusMessage('¡Firmware instalado con éxito!');
      setFlashSuccess(true);
    } catch (err: any) {
      addLog(`ERROR: ${err?.message || err}`);
      setStatusMessage(`Error: ${err?.message || 'Fallo durante el flasheo'}`);
    } finally {
      setIsFlashing(false);
      if (transportRef.current) {
        try {
          await transportRef.current.disconnect();
        } catch {}
        transportRef.current = null;
      }
    }
  };

  if (!firmwares || firmwares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-muted/20 text-muted-foreground">
        <Zap className="h-10 w-10 mb-2 opacity-40 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Sin firmware disponible</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Este proyecto no tiene archivos de firmware cargados actualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Browser Compatibility Notice */}
      {!isSupported && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-sm">Navegador no compatible con Web Serial</div>
            <p>
              El instalador web requiere un navegador con soporte para <strong>Web Serial API</strong>.
              Por favor utiliza <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, <strong>Opera</strong> o <strong>Brave</strong> en PC/Mac para flashear directamente por USB.
            </p>
          </div>
        </div>
      )}

      {/* Main Flasher Card */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                <Usb className="h-4 w-4 text-primary" />
                Instalador de Firmware Directo por USB
              </CardTitle>
              <CardDescription className="text-xs">
                Flashea el microcontrolador de tu proyecto directamente desde el navegador
              </CardDescription>
            </div>

            {/* Firmware Version Selector */}
            {firmwares.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Versión:</span>
                <select
                  value={selectedFwId}
                  onChange={(e) => setSelectedFwId(e.target.value)}
                  disabled={isFlashing}
                  className="h-8 rounded-lg border bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {firmwares.map((fw) => (
                    <option key={fw.id} value={fw.id}>
                      {fw.name} (v{fw.version}) - {fw.chipFamily}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-5">
          {/* Selected Firmware Specs */}
          {selectedFirmware && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg border bg-muted/30 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Firmware:</span>
                <span className="font-semibold text-foreground">{selectedFirmware.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Chip Familia:</span>
                <Badge variant="secondary" className="font-mono text-[10px] mt-0.5">
                  {selectedFirmware.chipFamily}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Versión:</span>
                <span className="font-mono font-medium text-foreground">v{selectedFirmware.version}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Offset de Flash:</span>
                <span className="font-mono text-muted-foreground">
                  {selectedFirmware.flashOffset || '0x10000'}
                </span>
              </div>
            </div>
          )}

          {/* Flash Instructions */}
          {selectedFirmware?.flashInstructions && (
            <div className="p-3.5 rounded-lg border bg-primary/5 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Info className="h-3.5 w-3.5" />
                <span>Instrucciones de conexión:</span>
              </div>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {selectedFirmware.flashInstructions}
              </p>
            </div>
          )}

          {/* Progress Bar & Status */}
          {(isFlashing || progress > 0 || statusMessage) && (
            <div className="space-y-2 p-4 rounded-xl border bg-muted/40">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2">
                  {isFlashing && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                  {flashSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {statusMessage}
                </span>
                <span className="font-mono text-primary font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Terminal Console Logs */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <TerminalIcon className="h-3.5 w-3.5" /> Consola de Flasheo (Web Serial)
              </span>
              {logs.length > 0 && (
                <button
                  onClick={() => setLogs([])}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Limpiar consola
                </button>
              )}
            </div>

            <div className="h-44 w-full rounded-lg bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 overflow-y-auto border border-zinc-800 space-y-1">
              {logs.length === 0 ? (
                <span className="text-zinc-600 italic">
                  Conecta tu placa al puerto USB y haz clic en &quot;Flashear Firmware&quot; para iniciar...
                </span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="leading-tight">
                    {log}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-5 pt-0 border-t bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
          <div className="text-[11px] text-muted-foreground">
            💡 Mantén presionado el botón <strong>BOOT</strong> si el dispositivo no entra en modo de descarga.
          </div>

          <div className="flex items-center gap-2">
            {selectedFirmware?.firmwareUrl && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                render={
                  <a
                    href={selectedFirmware.firmwareUrl}
                    download={`${selectedFirmware.name}_v${selectedFirmware.version}.bin`}
                  />
                }
              >
                <Download className="h-3.5 w-3.5" />
                <span>Descargar .BIN</span>
              </Button>
            )}

            <Button
              onClick={handleFlash}
              disabled={!isSupported || isFlashing}
              size="sm"
              className="gap-1.5 text-xs font-semibold h-8"
            >
              {isFlashing ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Flasheando...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  <span>Flashear Firmware</span>
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
