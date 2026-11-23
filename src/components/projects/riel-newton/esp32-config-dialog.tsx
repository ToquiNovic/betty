'use client';

import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  Key,
  Radio,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Cpu,
} from 'lucide-react';
import { toast } from '@/lib/toast';

export interface ESP32ConfigData {
  ssid: string;
  password: string;
  sensorUuid: string;
  gatewayPsk: string;
}

export interface ESP32ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveConfig: (config: ESP32ConfigData) => Promise<void>;
  initialSensorId?: string;
}

export function ESP32ConfigDialog({
  open,
  onOpenChange,
  onSaveConfig,
  initialSensorId = 'f74a812b-4d6e-4c3a-9e1f-8a0d92e5b721',
}: ESP32ConfigDialogProps) {
  const [ssid, setSsid] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [sensorUuid, setSensorUuid] = useState<string>(initialSensorId);
  const [gatewayPsk, setGatewayPsk] = useState<string>('betty1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveConfig({
        ssid,
        password,
        sensorUuid,
        gatewayPsk,
      });
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Error al guardar configuración en ESP32');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Cpu className="h-5 w-5 text-sky-500" />
            <span>Configuración NVS ESP32 (Riel de Newton)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ajusta los parámetros de red Wi-Fi y enlace seguro con Betty Cloud / TimescaleDB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Wi-Fi SSID */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-primary" />
              <span>Red Wi-Fi (SSID)</span>
            </Label>
            <Input
              placeholder="Nombre de red Wi-Fi 2.4 GHz"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Wi-Fi Password */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-primary" />
              <span>Contraseña Wi-Fi</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 text-xs font-mono pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Betty Cloud Sensor UUID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-sky-400" />
                <span>UUID del Sensor en Betty Cloud</span>
              </Label>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                TimescaleDB
              </Badge>
            </div>
            <Input
              value={sensorUuid}
              onChange={(e) => setSensorUuid(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Gateway PSK */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-amber-400" />
              <span>Clave Master del Gateway (PSK)</span>
            </Label>
            <Input
              value={gatewayPsk}
              onChange={(e) => setGatewayPsk(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Cancelar
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 text-xs h-8 bg-sky-600 hover:bg-sky-500 text-white font-bold"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Guardando...' : 'Guardar en Flash NVS'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
