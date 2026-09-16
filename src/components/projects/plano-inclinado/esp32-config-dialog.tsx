'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  Key,
  Database,
  RefreshCw,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Radio,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Cpu,
  Info,
} from 'lucide-react';
import { toast } from '@/lib/toast';

export interface ESP32Config {
  ssid: string;
  pass: string;
  broker: string;
  port: number;
  sensor_id: string;
  api_key: string;
  enabled: boolean;
  wifi_connected?: boolean;
  ip?: string;
  mqtt_connected?: boolean;
  topic_data?: string;
  topic_command?: string;
}

interface ESP32ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  sendCommand: (cmd: string) => Promise<boolean>;
  lastReportedConfig?: ESP32Config | null;
  defaultSensorId?: string;
}

const DEFAULT_CONFIG: ESP32Config = {
  ssid: '',
  pass: '',
  broker: 'betty-api.laboratorio3d.online',
  port: 1883,
  sensor_id: 'e290f30a-201e-482c-ac7e-a9d02583068d',
  api_key: 'live_df26b0ebb5465d7233ff34d8ce69b7c69df8e79fcdaffb9c',
  enabled: true,
};

export function ESP32ConfigDialog({
  open,
  onOpenChange,
  isConnected,
  sendCommand,
  lastReportedConfig,
  defaultSensorId,
}: ESP32ConfigDialogProps) {
  const [config, setConfig] = useState<ESP32Config>(() => ({
    ...DEFAULT_CONFIG,
    sensor_id: defaultSensorId || DEFAULT_CONFIG.sensor_id,
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar cuando el ESP32 responda con CFG:{...}
  useEffect(() => {
    if (lastReportedConfig) {
      setConfig((prev) => ({
        ...prev,
        ...lastReportedConfig,
        // No sobreescribir el password si viene con asteriscos a menos que el usuario no haya escrito uno
        pass: lastReportedConfig.pass?.includes('*') ? prev.pass : (lastReportedConfig.pass || prev.pass),
      }));
    }
  }, [lastReportedConfig]);

  // Si abrimos y estamos conectados, solicitar automáticamente la configuración actual
  useEffect(() => {
    if (open && isConnected) {
      handleReadConfig();
    }
  }, [open, isConnected]);

  const handleReadConfig = async () => {
    if (!isConnected) {
      toast.error('Conecta primero el ESP32 por USB Serial');
      return;
    }
    setIsReading(true);
    try {
      await sendCommand('GET_CONFIG');
      toast.info('Solicitando configuración actual del ESP32...');
    } finally {
      setTimeout(() => setIsReading(false), 800);
    }
  };

  const handleSaveConfig = async () => {
    if (!isConnected) {
      toast.error('Conecta primero el ESP32 por USB Serial');
      return;
    }

    if (!config.sensor_id.trim()) {
      toast.error('El Sensor ID (UUID) es requerido para Betty IoT');
      return;
    }

    setIsSaving(true);
    try {
      // Construir payload JSON para SET_CONFIG
      const payload: Record<string, any> = {
        ssid: config.ssid.trim(),
        sensor_id: config.sensor_id.trim(),
        api_key: config.api_key.trim(),
        broker: config.broker.trim() || 'betty-api.laboratorio3d.online',
        port: Number(config.port) || 1883,
        enabled: Boolean(config.enabled),
      };

      // Si el usuario ingresó contraseña nueva (no asteriscos ni vacía), incluirla
      if (config.pass && !config.pass.includes('*')) {
        payload.pass = config.pass;
      }

      const jsonString = JSON.stringify(payload);
      const ok = await sendCommand(`SET_CONFIG ${jsonString}`);

      if (ok) {
        toast.success('¡Configuración enviada al ESP32! Guardada en NVS Flash.');
      } else {
        toast.error('Error al enviar la configuración.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReboot = async () => {
    if (!isConnected) {
      toast.error('Conecta primero el ESP32 por USB Serial');
      return;
    }
    await sendCommand('REBOOT');
    toast.warning('Reiniciando ESP32... Reconectará en breves instantes.');
  };

  const handleResetDefaults = () => {
    setConfig({
      ...DEFAULT_CONFIG,
      sensor_id: defaultSensorId || DEFAULT_CONFIG.sensor_id,
    });
    toast.info('Valores restaurados por defecto en el formulario.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <Cpu className="h-6 w-6 text-sky-400" />
              <DialogTitle className="text-xl font-bold text-foreground">
                Configuración del ESP32 & Betty IoT Platform
              </DialogTitle>
            </div>
            <Badge
              variant="outline"
              className={
                isConnected
                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                  : 'border-rose-500/50 text-rose-400 bg-rose-500/10'
              }
            >
              {isConnected ? 'USB Conectado' : 'USB Desconectado'}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Configura las credenciales de red WiFi y los parámetros de conexión MQTT hacia el
            broker de Betty. Estos valores se guardan en la memoria permanente Flash (NVS) del ESP32.
          </DialogDescription>
        </DialogHeader>

        {/* Estado actual en vivo del ESP32 si está disponible */}
        {lastReportedConfig && (
          <div className="p-3 rounded-lg bg-muted/40 border border-border/80 text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-sky-400" />
                Diagnóstico del ESP32:
              </span>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={
                    lastReportedConfig.wifi_connected
                      ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-[10px]'
                      : 'border-amber-500/50 text-amber-400 bg-amber-500/10 text-[10px]'
                  }
                >
                  {lastReportedConfig.wifi_connected
                    ? `WiFi OK (${lastReportedConfig.ip || 'Conectado'})`
                    : 'WiFi Desconectado'}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    lastReportedConfig.mqtt_connected
                      ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-[10px]'
                      : 'border-zinc-500/50 text-zinc-400 bg-zinc-500/10 text-[10px]'
                  }
                >
                  {lastReportedConfig.mqtt_connected ? 'MQTT Betty OK' : 'MQTT Betty Offline'}
                </Badge>
              </div>
            </div>
            {lastReportedConfig.topic_data && (
              <div className="text-[11px] font-mono text-muted-foreground truncate">
                📡 Tópico Pub: <span className="text-sky-300">{lastReportedConfig.topic_data}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-5 pt-2">
          {/* Sección 1: Red WiFi */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-background/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-sky-400" />
                <h4 className="text-sm font-semibold text-foreground">Red WiFi 2.4 GHz</h4>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="wifi-enable" className="text-xs text-muted-foreground">
                  Habilitar WiFi
                </Label>
                <Switch
                  id="wifi-enable"
                  checked={config.enabled}
                  onCheckedChange={(val) => setConfig((prev) => ({ ...prev, enabled: val }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Nombre de Red (SSID)</Label>
                <Input
                  placeholder="Ej: MiRedWiFi_2.4G"
                  value={config.ssid}
                  onChange={(e) => setConfig((prev) => ({ ...prev, ssid: e.target.value }))}
                  className="font-mono text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={lastReportedConfig?.pass ? '******** (Sin cambios)' : 'Clave de WiFi'}
                    value={config.pass}
                    onChange={(e) => setConfig((prev) => ({ ...prev, pass: e.target.value }))}
                    className="font-mono text-xs h-8 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3 text-sky-400 flex-shrink-0" />
              Si el ESP32 no logra conectarse, emitirá su Portal Cautivo AP:{' '}
              <strong className="text-foreground">PlanoInclinado-Setup</strong> (Pass:{' '}
              <strong className="text-foreground">admin1234</strong>) en IP 192.168.4.1.
            </p>
          </div>

          {/* Sección 2: Parámetros Betty IoT Platform */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-background/50">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-foreground">Conexión Betty IoT Platform (MQTT)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-medium text-foreground">Broker Host</Label>
                <Input
                  placeholder="betty-api.laboratorio3d.online"
                  value={config.broker}
                  onChange={(e) => setConfig((prev) => ({ ...prev, broker: e.target.value }))}
                  className="font-mono text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Puerto MQTT</Label>
                <Input
                  type="number"
                  placeholder="1883"
                  value={config.port}
                  onChange={(e) => setConfig((prev) => ({ ...prev, port: parseInt(e.target.value) || 1883 }))}
                  className="font-mono text-xs h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-foreground">
                Sensor ID (UUID Registrado en Betty)
              </Label>
              <Input
                placeholder="Ej: e290f30a-201e-482c-ac7e-a9d02583068d"
                value={config.sensor_id}
                onChange={(e) => setConfig((prev) => ({ ...prev, sensor_id: e.target.value }))}
                className="font-mono text-xs h-8 text-sky-400"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-foreground">
                Sensor API Key / Token de Autenticación
              </Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="live_..."
                  value={config.api_key}
                  onChange={(e) => setConfig((prev) => ({ ...prev, api_key: e.target.value }))}
                  className="font-mono text-xs h-8 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border/60 pt-4">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetDefaults}
              className="text-xs h-8 border-border/80"
              title="Restaurar valores sugeridos de fábrica"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Defaults
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReboot}
              disabled={!isConnected}
              className="text-xs h-8 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
              title="Reiniciar microcontrolador ESP32"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Reiniciar ESP32
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReadConfig}
              disabled={!isConnected || isReading}
              className="text-xs h-8 border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isReading ? 'animate-spin' : ''}`} />
              Leer del ESP32
            </Button>
            <Button
              size="sm"
              onClick={handleSaveConfig}
              disabled={!isConnected || isSaving}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {isSaving ? 'Guardando...' : 'Guardar en ESP32'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
