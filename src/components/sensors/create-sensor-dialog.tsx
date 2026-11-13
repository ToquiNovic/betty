'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sensorApi } from '@/lib/api/sensors';
import { useTeams } from '@/lib/api/teams';
import { ApiKeyDisplayDialog } from './api-key-display';
import {
  Plus,
  Loader2,
  Radio,
  Globe,
  Cpu,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { CreateSensorResponse } from '@/types';

const createSensorSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  description: z.string().optional(),
  teamId: z.string().optional(),
  originType: z.enum(['sensor', 'metaverso']),
  hardware: z.string().optional(),
  location: z.string().optional(),
  metadataJson: z.string().optional(),
});

type CreateSensorFormValues = z.infer<typeof createSensorSchema>;

interface CreateSensorDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const HARDWARE_PRESETS = [
  { id: 'ESP32', label: 'ESP32 (WiFi / BLE)' },
  { id: 'LoRaWAN', label: 'Nodo LoRa / LoRaWAN' },
  { id: 'Arduino', label: 'Arduino / ESP8266' },
  { id: 'RaspberryPi', label: 'Raspberry Pi / Linux SBC' },
  { id: 'OpenSimLSL', label: 'Objeto OpenSim (Script LSL)' },
  { id: 'ThreeJS', label: 'Simulación 3D (Three.js / Web)' },
  { id: 'Other', label: 'Otro Dispositivo' },
];

export function CreateSensorDialog({ onSuccess, trigger }: CreateSensorDialogProps) {
  const t = useTranslations('sensors');
  const common = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [createdData, setCreatedData] = useState<CreateSensorResponse | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  const { teams } = useTeams();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateSensorFormValues>({
    resolver: zodResolver(createSensorSchema),
    defaultValues: {
      teamId: 'personal',
      originType: 'sensor',
      hardware: 'ESP32',
      location: '',
      description: '',
      metadataJson: '',
    },
  });

  const selectedOriginType = watch('originType');
  const sensorName = watch('name');

  const onSubmit = async (data: CreateSensorFormValues) => {
    setIsLoading(true);
    try {
      let customMetadata: Record<string, unknown> = {};
      if (data.metadataJson?.trim()) {
        try {
          customMetadata = JSON.parse(data.metadataJson);
        } catch {
          toast.error('El formato de los metadatos JSON avanzados es inválido.');
          setIsLoading(false);
          return;
        }
      }

      const mergedMetadata: Record<string, unknown> = {
        origin_type: data.originType,
        hardware: data.hardware || undefined,
        location: data.location || undefined,
        ...customMetadata,
      };

      const response = await sensorApi.create({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        teamId: data.teamId === 'personal' ? undefined : data.teamId,
        metadata: mergedMetadata,
      });

      setCreatedData(response);
      setOpen(false);
      reset();
      setShowKeyDialog(true);
      if (onSuccess) onSuccess();
      toast.success('Dispositivo registrado exitosamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            trigger ? (
              (trigger as React.ReactElement)
            ) : (
              <Button size="sm" className="gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                <Plus className="h-4 w-4" />
                <span>{t('newSensor')}</span>
              </Button>
            )
          }
        />
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Registrar Dispositivo o Sensor
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Configura tu origen de telemetría y obtén tu API Key de acceso seguro.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Origin Type Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tipo de Origen
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setValue('originType', 'sensor')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    selectedOriginType === 'sensor'
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/40 shadow-xs'
                      : 'border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Radio className={`h-4 w-4 ${selectedOriginType === 'sensor' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-bold text-foreground">Hardware Físico</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    Placas y nodos reales (ESP32, LoRaWAN, Arduino).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('originType', 'metaverso')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    selectedOriginType === 'metaverso'
                      ? 'border-purple-500/60 bg-purple-500/10 text-foreground ring-1 ring-purple-500/40 shadow-xs'
                      : 'border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className={`h-4 w-4 ${selectedOriginType === 'metaverso' ? 'text-purple-500' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-bold text-foreground">Gemelo Digital 3D</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    Simulación virtual (OpenSim, Three.js, Unity).
                  </span>
                </button>
              </div>
            </div>

            {/* Sensor Name */}
            <div className="space-y-1.5">
              <Label htmlFor="sensor-name" className="text-xs font-semibold">
                Nombre del Dispositivo <span className="text-emerald-500">*</span>
              </Label>
              <Input
                id="sensor-name"
                placeholder={selectedOriginType === 'sensor' ? 'ej: Nodo LoRa - Estación Climática' : 'ej: Sensor Virtual - Campus Central'}
                disabled={isLoading}
                className="h-9 text-xs"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="sensor-desc" className="text-xs font-semibold">
                Descripción (opcional)
              </Label>
              <Input
                id="sensor-desc"
                placeholder="ej: Monitoreo de temperatura y humedad relativa en tiempo real"
                disabled={isLoading}
                className="h-9 text-xs"
                {...register('description')}
              />
            </div>

            {/* Hardware & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sensor-hw" className="text-xs font-semibold flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Tecnología / Hardware</span>
                </Label>
                <Select
                  defaultValue="ESP32"
                  onValueChange={(val) => setValue('hardware', val || undefined)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="sensor-hw" className="h-9 text-xs">
                    <SelectValue placeholder="Selecciona tecnología" />
                  </SelectTrigger>
                  <SelectContent>
                    {HARDWARE_PRESETS.map((hw) => (
                      <SelectItem key={hw.id} value={hw.id} className="text-xs">
                        {hw.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sensor-loc" className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Ubicación</span>
                </Label>
                <Input
                  id="sensor-loc"
                  placeholder="ej: Laboratorio 3D - Bloque C"
                  disabled={isLoading}
                  className="h-9 text-xs"
                  {...register('location')}
                />
              </div>
            </div>

            {/* Team Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="sensor-team" className="text-xs font-semibold">
                Asignación de Equipo
              </Label>
              <Select
                defaultValue="personal"
                onValueChange={(val) => setValue('teamId', val || undefined)}
                disabled={isLoading}
              >
                <SelectTrigger id="sensor-team" className="h-9 text-xs">
                  <SelectValue placeholder="Dispositivo Personal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal" className="text-xs">
                    Personal (Solo visible para ti)
                  </SelectItem>
                  {(teams || []).map((membership) => {
                    const teamId = membership.teamId || membership.team?.id;
                    const teamName = membership.teamName || membership.team?.name || 'Equipo';
                    if (!teamId) return null;
                    return (
                      <SelectItem key={teamId} value={teamId} className="text-xs">
                        {teamName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* MQTT Topic Preview */}
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider block">
                Tópico MQTT Asignado
              </span>
              <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                botuto/sensor/{sensorName?.trim() ? sensorName.toLowerCase().replace(/[^a-z0-9_-]/g, '-') : '<id-del-sensor>'}/data
              </p>
            </div>

            {/* Collapsible Advanced JSON */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <span>Metadatos JSON adicionales (opcional)</span>
              </button>

              {showAdvanced && (
                <div className="mt-2 space-y-1.5 animate-in fade-in-50 duration-200">
                  <Textarea
                    id="sensor-meta"
                    placeholder='{ "intervalSeconds": 5, "protocol": "MQTT 5.0" }'
                    className="font-mono text-xs h-20 bg-muted/20"
                    disabled={isLoading}
                    {...register('metadataJson')}
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Propiedades adicionales personalizadas que se adjuntarán al sensor.
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="text-xs"
              >
                {common('cancel')}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Registrar Sensor</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {createdData && (
        <ApiKeyDisplayDialog
          open={showKeyDialog}
          onOpenChange={setShowKeyDialog}
          rawApiKey={createdData.rawApiKey}
          sensorName={createdData.name}
          mqttTopic={createdData.mqttTopic}
        />
      )}
    </>
  );
}
