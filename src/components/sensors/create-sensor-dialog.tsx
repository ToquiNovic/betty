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
import { sensorApi } from '@/lib/api/sensors';
import { useTeams } from '@/lib/api/teams';
import { ApiKeyDisplayDialog } from './api-key-display';
import { LocationPickerMap } from './location-picker-map';
import { LocationPickerDialog } from './location-picker-dialog';
import {
  Plus,
  Loader2,
  Radio,
  Globe,
  Cpu,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  LocateFixed,
  Map as MapIcon,
  Maximize2,
  Wifi,
  Share2,
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
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  metadataJson: z.string().optional(),
});

type CreateSensorFormValues = z.infer<typeof createSensorSchema>;

interface CreateSensorDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const HARDWARE_PRESETS = [
  { id: 'ESP32', label: 'ESP32' },
  { id: 'LoRaWAN', label: 'LoRaWAN / LoRa' },
  { id: 'Arduino', label: 'Arduino / ESP8266' },
  { id: 'RaspberryPi', label: 'Raspberry Pi' },
  { id: 'OpenSimLSL', label: 'OpenSim 3D (LSL)' },
  { id: 'ThreeJS', label: 'Three.js / Web 3D' },
  { id: 'Otro', label: 'Otro' },
];

export const LORA_BANDS = [
  { id: '433 MHz', label: '433 MHz (Ra-02 / SX1278)', bandHz: 433000000 },
  { id: '915 MHz', label: '915 MHz (US915 / Colombia)', bandHz: 915000000 },
  { id: '868 MHz', label: '868 MHz (EU868)', bandHz: 868000000 },
];

export const LORA_SF_OPTIONS = [
  { sf: 7, label: 'SF7', rangeKm: '1.5 km (Rápido)', radiusMeters: 1500 },
  { sf: 8, label: 'SF8', rangeKm: '2.5 km', radiusMeters: 2500 },
  { sf: 9, label: 'SF9', rangeKm: '3.5 km', radiusMeters: 3500 },
  { sf: 10, label: 'SF10', rangeKm: '5.0 km', radiusMeters: 5000 },
  { sf: 12, label: 'SF12', rangeKm: '7.0 km (Máx. Alcance)', radiusMeters: 7000 },
];

// Default coordinates: Florencia, Caquetá (Campus Central Universidad de la Amazonia)
export const DEFAULT_LAT = 1.6144;
export const DEFAULT_LNG = -75.6062;

export function CreateSensorDialog({ onSuccess, trigger }: CreateSensorDialogProps) {
  const t = useTranslations('sensors');
  const common = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [createdData, setCreatedData] = useState<CreateSensorResponse | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  // Geographic coordinates state
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [lng, setLng] = useState<number>(DEFAULT_LNG);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [isBigMapOpen, setIsBigMapOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // LoRaWAN specific parameters (aligned with betty-gateway)
  const [loraBand, setLoraBand] = useState<string>('433 MHz');
  const [loraSf, setLoraSf] = useState<number>(7);
  const [loraGatewayId, setLoraGatewayId] = useState<string>('gateway-esp32-01');
  const [shareOnMap, setShareOnMap] = useState<boolean>(true);

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
      location: 'Florencia, Caquetá - Campus Porvenir',
      description: '',
      metadataJson: '',
    },
  });

  const selectedOriginType = watch('originType');
  const selectedHardware = watch('hardware');
  const selectedTeamId = watch('teamId');
  const sensorName = watch('name');

  const selectedSfOption = LORA_SF_OPTIONS.find((opt) => opt.sf === loraSf) || LORA_SF_OPTIONS[0];

  // Detect GPS coordinates using browser Geolocation API
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no está soportada en este navegador');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        setLat(userLat);
        setLng(userLng);
        setShowMap(true);
        setIsLocating(false);
        toast.success(`Coordenadas GPS obtenidas: ${userLat}, ${userLng}`);
      },
      (err) => {
        setIsLocating(false);
        toast.error(`No se pudo obtener el GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapCoordinateChange = (newLat: number, newLng: number) => {
    setLat(Number(newLat.toFixed(6)));
    setLng(Number(newLng.toFixed(6)));
  };

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
        latitude: lat,
        longitude: lng,
        ...(data.hardware === 'LoRaWAN' && {
          lora_config: {
            frequency: loraBand,
            band_hz: LORA_BANDS.find((b) => b.id === loraBand)?.bandHz || 433000000,
            spreading_factor: loraSf,
            bandwidth: '125 kHz',
            coding_rate: '4/5',
            gateway_id: loraGatewayId.trim() || 'gateway-esp32-01',
            shared_on_network_map: shareOnMap,
            coverage_radius_meters: selectedSfOption.radiusMeters,
          },
        }),
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
              <Button size="sm" className="gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>{t('newSensor')}</span>
              </Button>
            )
          }
        />
        <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
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
            {/* Origin Type Cards */}
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

            {/* Hardware / Technology Chips (No dropdowns!) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Tecnología / Protocolo</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {selectedHardware}
                </span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {HARDWARE_PRESETS.map((hw) => {
                  const isSelected = selectedHardware === hw.id;
                  return (
                    <button
                      key={hw.id}
                      type="button"
                      onClick={() => setValue('hardware', hw.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40 shadow-xs font-bold'
                          : 'bg-muted/30 border-border/70 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      }`}
                    >
                      {hw.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location & Geographical Coordinates */}
            <div className="space-y-2 p-3 rounded-xl border border-border/80 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label htmlFor="sensor-loc" className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Ubicación y Coordenadas Geográficas</span>
                </Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isLocating}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                  >
                    <LocateFixed className={`h-3 w-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Obteniendo GPS...' : 'Mi GPS'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-muted/70 hover:bg-muted text-foreground border border-border transition-all cursor-pointer"
                  >
                    <MapIcon className="h-3 w-3" />
                    <span>{showMap ? 'Ocultar Mapa' : 'Ver Mapa'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBigMapOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 transition-all cursor-pointer shadow-2xs"
                    title="Abrir mapa en pantalla grande para seleccionar ubicación con precisión"
                  >
                    <Maximize2 className="h-3 w-3" />
                    <span>Abrir en Grande</span>
                  </button>
                </div>
              </div>

              <Input
                id="sensor-loc"
                placeholder="ej: Florencia, Caquetá - Campus Porvenir"
                disabled={isLoading}
                className="h-9 text-xs"
                {...register('location')}
              />

              {/* Coordinates Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground">Latitud (GPS)</span>
                  <Input
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                    placeholder="1.6144"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground">Longitud (GPS)</span>
                  <Input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                    placeholder="-75.6062"
                  />
                </div>
              </div>

              {/* Interactive Location Picker Map */}
              {(showMap || selectedHardware === 'LoRaWAN') && (
                <div className="pt-1.5 space-y-1.5 animate-in fade-in-50 duration-200">
                  <div className="relative h-48 w-full rounded-xl overflow-hidden border border-border group">
                    <LocationPickerMap
                      lat={lat}
                      lng={lng}
                      onChange={handleMapCoordinateChange}
                      showCoverageCircle={selectedHardware === 'LoRaWAN' && shareOnMap}
                      coverageRadiusMeters={selectedSfOption.radiusMeters}
                      sensorName={sensorName || 'Nodo Sensor'}
                    />
                    <button
                      type="button"
                      onClick={() => setIsBigMapOpen(true)}
                      className="absolute top-2 right-2 z-400 flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-background/90 hover:bg-background text-foreground shadow-md border border-border/80 backdrop-blur-xs transition-all cursor-pointer"
                      title="Abrir mapa en pantalla completa"
                    >
                      <Maximize2 className="h-3 w-3 text-emerald-500" />
                      <span>Ampliar Mapa</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                    <span>💡 Haz clic sobre el mapa para fijar la ubicación del dispositivo.</span>
                    {selectedHardware === 'LoRaWAN' && shareOnMap && (
                      <span className="font-mono text-emerald-500 font-semibold">
                        Radio LoRa: {(selectedSfOption.radiusMeters / 1000).toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Specialized LoRaWAN & Gateway Parameters (When LoRa is selected) */}
            {selectedHardware === 'LoRaWAN' && (
              <div className="space-y-3 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/5 shadow-xs animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-500">
                    <Wifi className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Parámetros LoRaWAN & Integración con Betty Gateway
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Alineado con el firmware ESP32 + SX1278 Ra-02 (betty-gateway).
                    </p>
                  </div>
                </div>

                {/* LoRa Frequency Band Chips */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Frecuencia de Operación (Banda)
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {LORA_BANDS.map((b) => {
                      const isSel = loraBand === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setLoraBand(b.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                              : 'bg-background/80 border-border/80 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Spreading Factor (SF) Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Factor de Dispersión (Spreading Factor)
                    </Label>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      Alcance: {selectedSfOption.rangeKm}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LORA_SF_OPTIONS.map((opt) => {
                      const isSel = loraSf === opt.sf;
                      return (
                        <button
                          key={opt.sf}
                          type="button"
                          onClick={() => setLoraSf(opt.sf)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                              : 'bg-background/80 border-border/80 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Gateway ESP32 ID */}
                <div className="space-y-1">
                  <Label htmlFor="gateway-id" className="text-[11px] font-semibold text-muted-foreground">
                    Gateway LoRa Receptor (Bridge ID)
                  </Label>
                  <Input
                    id="gateway-id"
                    value={loraGatewayId}
                    onChange={(e) => setLoraGatewayId(e.target.value)}
                    placeholder="gateway-esp32-01"
                    className="h-8 text-xs font-mono"
                  />
                </div>

                {/* Optional Community Network Coverage Share Toggle */}
                <div
                  onClick={() => setShareOnMap(!shareOnMap)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    shareOnMap
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : 'border-border/70 bg-background/60 hover:bg-muted/40'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={shareOnMap}
                      onChange={(e) => setShareOnMap(e.target.checked)}
                      className="rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5 text-emerald-500" />
                      Compartir en el Mapa Comunitario de Red LoRa (Opcional)
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Permite a la red de investigación y metaversos de la Universidad de la Amazonia proyectar la cobertura y nodo en el mapa colectivo de sensores.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Team / Scope Selection Chips (No dropdowns!) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Ámbito del Sensor</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setValue('teamId', 'personal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    selectedTeamId === 'personal' || !selectedTeamId
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40 shadow-xs font-bold'
                      : 'bg-muted/30 border-border/70 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  Personal (Solo tu cuenta)
                </button>
                {(teams || []).map((membership) => {
                  const teamId = membership.teamId || membership.team?.id;
                  const teamName = membership.teamName || membership.team?.name || 'Equipo';
                  if (!teamId) return null;
                  const isSelected = selectedTeamId === teamId;
                  return (
                    <button
                      key={teamId}
                      type="button"
                      onClick={() => setValue('teamId', teamId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40 shadow-xs font-bold'
                          : 'bg-muted/30 border-border/70 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      }`}
                    >
                      {teamName}
                    </button>
                  );
                })}
              </div>
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
                className="text-xs cursor-pointer"
              >
                {common('cancel')}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
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

      {/* Modal de Mapa en Pantalla Grande */}
      <LocationPickerDialog
        open={isBigMapOpen}
        onOpenChange={setIsBigMapOpen}
        lat={lat}
        lng={lng}
        initialLocationName={watch('location')}
        onConfirm={(newLat, newLng, newLocation) => {
          setLat(newLat);
          setLng(newLng);
          if (newLocation && !watch('location')) {
            setValue('location', newLocation);
          }
          setShowMap(true);
          toast.success(`Ubicación actualizada: ${newLat}, ${newLng}`);
        }}
        showCoverageCircle={selectedHardware === 'LoRaWAN' && shareOnMap}
        coverageRadiusMeters={selectedSfOption.radiusMeters}
        sensorName={sensorName || 'Nodo Sensor'}
      />
    </>
  );
}
