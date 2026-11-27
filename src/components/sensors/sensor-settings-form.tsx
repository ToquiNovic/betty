'use client';

import React, { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { Sensor, UpdateSensorDto } from '@/types';
import { sensorApi } from '@/lib/api/sensors';
import { useTeams } from '@/lib/api/teams';
import { useAuthStore } from '@/stores/auth-store';
import { Link } from '@/i18n/routing';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LocationPickerMap } from './location-picker-map';
import { LocationPickerDialog } from './location-picker-dialog';
import {
  HARDWARE_PRESETS,
  LORA_BANDS,
  LORA_SF_OPTIONS,
  DEFAULT_LAT,
  DEFAULT_LNG,
} from './create-sensor-dialog';
import { getSensorTeamChangeState } from '@/lib/sensor-visibility';
import {
  Cpu,
  Globe,
  Info,
  Layers,
  Loader2,
  LocateFixed,
  Lock,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Radio,
  Save,
  Share2,
  ShieldAlert,
  User,
  Users,
  Wifi,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface SensorSettingsFormProps {
  sensor: Sensor;
  onUpdated: () => void;
  nameLabel: string;
  descLabel: string;
  saveLabel: string;
  errorLabel: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  team_admin: 'Admin',
  admin: 'Admin',
  member: 'Miembro',
  viewer: 'Lector',
};

export function SensorSettingsForm({
  sensor,
  onUpdated,
  nameLabel,
  descLabel,
  saveLabel,
  errorLabel,
}: SensorSettingsFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (sensor.metadata || {}) as Record<string, any>;
  const loraMeta = meta.lora_config || {};

  const { user } = useAuthStore();
  const { teams, isLoading: isTeamsLoading } = useTeams();
  const { mutate: mutateGlobal } = useSWRConfig();

  const [name, setName] = useState(sensor.name);
  const [description, setDescription] = useState(sensor.description || '');
  const [originType, setOriginType] = useState<'sensor' | 'metaverso'>(
    meta.origin_type === 'metaverso' ? 'metaverso' : 'sensor'
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(sensor.teamId ?? null);
  const [hardware, setHardware] = useState<string>(meta.hardware || 'ESP32');
  const [location, setLocation] = useState<string>(meta.location || '');
  const [lat, setLat] = useState<number>(
    typeof meta.latitude === 'number' ? meta.latitude : DEFAULT_LAT
  );
  const [lng, setLng] = useState<number>(
    typeof meta.longitude === 'number' ? meta.longitude : DEFAULT_LNG
  );
  const [showMap, setShowMap] = useState<boolean>(true);
  const [isBigMapOpen, setIsBigMapOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // LoRaWAN parameters
  const [loraBand, setLoraBand] = useState<string>(loraMeta.frequency || '433 MHz');
  const [loraSf, setLoraSf] = useState<number>(loraMeta.spreading_factor || 7);
  const [loraGatewayId, setLoraGatewayId] = useState<string>(
    loraMeta.gateway_id || 'gateway-esp32-01'
  );
  const [shareOnMap, setShareOnMap] = useState<boolean>(
    loraMeta.shared_on_network_map !== false
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const visibility = useMemo(
    () =>
      getSensorTeamChangeState({
        sensorOwnerId: sensor.ownerId,
        currentUserId: user?.id,
        currentTeamId: sensor.teamId ?? null,
        selectedTeamId,
        memberships: teams,
      }),
    [sensor.ownerId, sensor.teamId, user?.id, selectedTeamId, teams]
  );

  const selectedTeam = visibility.teamOptions.find((team) => team.id === selectedTeamId);

  const selectedSfOption =
    LORA_SF_OPTIONS.find((opt) => opt.sf === loraSf) || LORA_SF_OPTIONS[0];

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no está soportada en tu navegador.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = parseFloat(pos.coords.latitude.toFixed(6));
        const newLng = parseFloat(pos.coords.longitude.toFixed(6));
        setLat(newLat);
        setLng(newLng);
        setShowMap(true);
        setIsLocating(false);
        toast.success(`GPS obtenido: ${newLat}, ${newLng}`);
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Error al obtener GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del sensor es requerido');
      return;
    }

    if (!visibility.canPersistTeamChange) {
      toast.error('Solo el propietario del sensor puede cambiar su visibilidad o equipo.');
      return;
    }

    setIsUpdating(true);
    try {
      const selectedBand =
        LORA_BANDS.find((b) => b.id === loraBand) || LORA_BANDS[0];

      const existingMeta = (sensor.metadata || {}) as Record<string, unknown>;
      const updatedMetadata: Record<string, unknown> = {
        ...existingMeta,
        origin_type: originType,
        hardware,
        location: location.trim() || undefined,
        latitude: lat,
        longitude: lng,
        ...(hardware === 'LoRaWAN' && {
          lora_config: {
            frequency: loraBand,
            band_hz: selectedBand.bandHz,
            spreading_factor: loraSf,
            bandwidth: '125 kHz',
            coding_rate: '4/5',
            gateway_id: loraGatewayId.trim() || 'gateway-esp32-01',
            shared_on_network_map: shareOnMap,
            coverage_radius_meters: selectedSfOption.radiusMeters,
          },
        }),
      };

      if (hardware !== 'LoRaWAN') {
        delete updatedMetadata.lora_config;
      }

      const payload: UpdateSensorDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        metadata: updatedMetadata,
      };

      if (visibility.isOwner && visibility.teamIdChanged) {
        payload.teamId = selectedTeamId;
      }

      await sensorApi.update(sensor.id, payload);

      onUpdated();
      await mutateGlobal('/sensors');
      toast.success('Dispositivo actualizado correctamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : errorLabel;
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <form onSubmit={handleUpdate} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        {/* Left column: Identity, Visibility/Team, Hardware */}
        <div className="flex flex-col gap-6 xl:col-span-7">
          {/* Card 1: Identidad y Origen */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base font-bold">
                    Identidad y Tipo de Origen
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define si la telemetría proviene de hardware físico o de un entorno virtual 3D.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-5 pt-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setOriginType('sensor')}
                  disabled={isUpdating}
                  className={cn(
                    'flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                    originType === 'sensor'
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-xs'
                      : 'border-border/70 text-muted-foreground hover:border-border hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Radio
                      className={cn(
                        'size-4',
                        originType === 'sensor' ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span className="text-xs font-bold text-foreground">Hardware Físico</span>
                  </div>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    Placas y nodos reales (ESP32, LoRaWAN, Arduino, Raspberry Pi).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOriginType('metaverso')}
                  disabled={isUpdating}
                  className={cn(
                    'flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                    originType === 'metaverso'
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-xs'
                      : 'border-border/70 text-muted-foreground hover:border-border hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Globe
                      className={cn(
                        'size-4',
                        originType === 'metaverso' ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span className="text-xs font-bold text-foreground">Gemelo Digital 3D</span>
                  </div>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    Simulación virtual y mundos inmersivos (OpenSim 3D, Three.js, Unity).
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-semibold">
                    {nameLabel} <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isUpdating}
                    className="h-9 text-xs"
                    placeholder="ej: Sensor Riel de Newton"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-desc" className="text-xs font-semibold">
                    {descLabel}
                  </Label>
                  <Input
                    id="edit-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUpdating}
                    placeholder="Descripción o función del sensor..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Visibilidad y Acceso Compartido */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base font-bold">
                    Visibilidad y Acceso Compartido
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Elegí si el sensor es privado para tu cuenta o compartido con uno de tus equipos.
                  </CardDescription>
                </div>
              </div>
              <CardAction>
                <Badge variant="outline" className="gap-1 font-mono text-[11px]">
                  {selectedTeamId ? <Users className="size-3" /> : <Lock className="size-3" />}
                  {selectedTeamId ? selectedTeam?.name || 'Equipo' : 'Personal'}
                </Badge>
              </CardAction>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 pt-5">
              {!visibility.isOwner && (
                <Alert>
                  <ShieldAlert />
                  <AlertTitle className="text-xs font-semibold">
                    Solo el propietario puede cambiar la visibilidad
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    Podés editar los parámetros técnicos del sensor, pero únicamente su propietario
                    original puede pasarlo a personal o reasignarlo a otro equipo.
                  </AlertDescription>
                </Alert>
              )}

              {visibility.isOwner && !isTeamsLoading && !visibility.hasTeams && (
                <Alert>
                  <Info />
                  <AlertTitle className="text-xs font-semibold">
                    No pertenecés a ningún equipo
                  </AlertTitle>
                  <AlertDescription className="flex flex-col items-start gap-2.5 text-xs">
                    <span>
                      Para compartir este sensor con un grupo de trabajo, primero creá un equipo o
                      unite mediante un código de invitación.
                    </span>
                    <Button variant="outline" size="xs" render={<Link href="/teams" />}>
                      Ir a Equipos
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={isUpdating || !visibility.canSwitchToPersonal}
                  onClick={() => setSelectedTeamId(null)}
                  className={cn(
                    'flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                    selectedTeamId === null
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-xs'
                      : 'border-border/70 text-muted-foreground hover:border-border hover:bg-muted/40',
                    !visibility.canSwitchToPersonal || isUpdating
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <User
                        className={cn(
                          'size-4',
                          selectedTeamId === null ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      Personal (Privado)
                    </span>
                    {selectedTeamId === null && (
                      <Badge variant="secondary" className="text-[10px]">
                        Activo
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    Solo tu cuenta puede ver y gestionar este dispositivo.
                  </span>
                </button>

                {isTeamsLoading ? (
                  <div className="flex items-center justify-center rounded-xl border border-dashed p-3.5 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Cargando tus equipos...
                  </div>
                ) : (
                  visibility.teamOptions.map((team) => {
                    const isSelected = selectedTeamId === team.id;
                    const isDisabled = isUpdating || !visibility.canSelectTeam;

                    return (
                      <button
                        key={team.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={cn(
                          'flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-xs'
                            : 'border-border/70 text-muted-foreground hover:border-border hover:bg-muted/40',
                          isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 truncate text-xs font-bold text-foreground">
                            <Users
                              className={cn(
                                'size-4 shrink-0',
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              )}
                            />
                            <span className="truncate">{team.name}</span>
                          </span>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {ROLE_LABELS[team.role] || team.role}
                          </Badge>
                        </div>
                        <span className="text-[11px] leading-snug text-muted-foreground">
                          Compartido con los miembros de este equipo.
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {visibility.isOwner &&
                sensor.teamId !== null &&
                selectedTeamId === null && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Al guardar este cambio, el sensor pasará a ser personal y los demás miembros del
                    equipo dejarán de tener acceso.
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Card 3: Tecnología / Protocolo */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Cpu className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base font-bold">Tecnología / Protocolo</CardTitle>
                  <CardDescription className="text-xs">
                    Selecciona el hardware o motor 3D para ajustar los parámetros de telemetría.
                  </CardDescription>
                </div>
              </div>
              <CardAction>
                <Badge variant="outline" className="font-mono text-[11px] text-primary">
                  {hardware}
                </Badge>
              </CardAction>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 pt-5">
              <div className="flex flex-wrap gap-2">
                {HARDWARE_PRESETS.map((hw) => {
                  const isSelected = hardware === hw.id;
                  return (
                    <button
                      key={hw.id}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => setHardware(hw.id)}
                      className={cn(
                        'cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                        isSelected
                          ? 'border-primary bg-primary/10 font-bold text-foreground ring-1 ring-primary/40 shadow-xs'
                          : 'border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      )}
                    >
                      {hw.label}
                    </button>
                  );
                })}
              </div>

              {hardware === 'LoRaWAN' && (
                <div className="flex flex-col gap-4 rounded-xl border border-primary/35 bg-primary/5 p-4 animate-in fade-in-50 duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Wifi className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-xs font-bold text-foreground">
                        Parámetros LoRaWAN & Integración con Betty Gateway
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Alineado con el firmware ESP32 + SX1278 Ra-02 (betty-gateway).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
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
                            className={cn(
                              'cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                              isSel
                                ? 'border-primary bg-primary/15 font-bold text-foreground shadow-xs'
                                : 'border-border/80 bg-background/80 text-muted-foreground hover:bg-muted'
                            )}
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Factor de Dispersión (Spreading Factor)
                      </Label>
                      <span className="font-mono text-[11px] font-semibold text-primary">
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
                            className={cn(
                              'cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                              isSel
                                ? 'border-primary bg-primary/15 font-bold text-foreground shadow-xs'
                                : 'border-border/80 bg-background/80 text-muted-foreground hover:bg-muted'
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="edit-gateway-id"
                      className="text-[11px] font-semibold text-muted-foreground"
                    >
                      Gateway LoRa Receptor (Bridge ID)
                    </Label>
                    <Input
                      id="edit-gateway-id"
                      value={loraGatewayId}
                      onChange={(e) => setLoraGatewayId(e.target.value)}
                      placeholder="gateway-esp32-01"
                      className="h-8 font-mono text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShareOnMap(!shareOnMap)}
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition-all',
                      shareOnMap
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border/70 bg-background/60 hover:bg-muted/40'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={shareOnMap}
                      onChange={(e) => setShareOnMap(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 cursor-pointer rounded border-primary text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Share2 className="size-3.5 text-primary" />
                        Compartir en el Mapa Comunitario de Red LoRa (Opcional)
                      </span>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        Permite a la red de investigación y metaversos de la Universidad de la
                        Amazonia proyectar la cobertura y nodo en el mapa colectivo de sensores.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Location/Map + Sticky Save Summary */}
        <div className="flex flex-col gap-6 xl:sticky xl:top-6 xl:col-span-5">
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base font-bold">
                    Ubicación y Coordenadas
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Posición geográfica y radio de cobertura en el mapa.
                  </CardDescription>
                </div>
              </div>
              <CardAction>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleDetectGps}
                    disabled={isLocating}
                  >
                    <LocateFixed
                      data-icon="inline-start"
                      className={isLocating ? 'animate-spin' : undefined}
                    />
                    {isLocating ? 'GPS...' : 'Mi GPS'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setShowMap(!showMap)}
                  >
                    <MapIcon data-icon="inline-start" />
                    {showMap ? 'Ocultar' : 'Ver mapa'}
                  </Button>
                </div>
              </CardAction>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 pt-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-loc" className="text-xs font-semibold">
                  Nombre de ubicación
                </Label>
                <Input
                  id="edit-loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ej: Florencia, Caquetá - Campus Porvenir"
                  disabled={isUpdating}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="edit-lat" className="font-mono text-[11px] text-muted-foreground">
                    Latitud (GPS)
                  </Label>
                  <Input
                    id="edit-lat"
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="h-8 font-mono text-xs"
                    placeholder="1.6144"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="edit-lng" className="font-mono text-[11px] text-muted-foreground">
                    Longitud (GPS)
                  </Label>
                  <Input
                    id="edit-lng"
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="h-8 font-mono text-xs"
                    placeholder="-75.6062"
                  />
                </div>
              </div>

              {showMap && (
                <div className="flex flex-col gap-2">
                  <div
                    className="group relative w-full overflow-hidden rounded-xl border border-border"
                    style={{ height: '250px' }}
                  >
                    <LocationPickerMap
                      lat={lat}
                      lng={lng}
                      onChange={(newLat, newLng) => {
                        setLat(newLat);
                        setLng(newLng);
                      }}
                      showCoverageCircle={hardware === 'LoRaWAN' && shareOnMap}
                      coverageRadiusMeters={selectedSfOption.radiusMeters}
                      sensorName={name || 'Nodo Sensor'}
                      style={{ height: '100%', width: '100%' }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => setIsBigMapOpen(true)}
                      className="absolute top-2 right-2 z-[400] shadow-md"
                      title="Abrir mapa en pantalla completa"
                    >
                      <Maximize2 data-icon="inline-start" />
                      Ampliar
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>
                      Hacé clic o arrastrá el pin (<strong className="text-foreground">Ctrl + Scroll</strong> para zoom).
                    </span>
                    {hardware === 'LoRaWAN' && shareOnMap && (
                      <span className="font-mono font-semibold text-primary">
                        Radio LoRa: {(selectedSfOption.radiusMeters / 1000).toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Summary Card */}
          <Card className="border bg-muted/20 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[11px]">
                  {originType === 'metaverso' ? 'Gemelo Digital 3D' : 'Hardware Físico'}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  {selectedTeamId ? `Equipo: ${selectedTeam?.name || 'Asignado'}` : 'Personal'}
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {hardware}
                </Badge>
              </div>

              <Separator />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Listo para guardar cambios
                </span>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdating || !visibility.canPersistTeamChange}
                  className="w-full sm:w-auto"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save data-icon="inline-start" />
                      {saveLabel}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Big Map Modal Dialog */}
      <LocationPickerDialog
        open={isBigMapOpen}
        onOpenChange={setIsBigMapOpen}
        lat={lat}
        lng={lng}
        initialLocationName={location}
        onConfirm={(newLat, newLng, newLocation) => {
          setLat(newLat);
          setLng(newLng);
          if (newLocation) {
            setLocation(newLocation);
          }
          setShowMap(true);
          toast.success(`Ubicación actualizada: ${newLat}, ${newLng}`);
        }}
        showCoverageCircle={hardware === 'LoRaWAN' && shareOnMap}
        coverageRadiusMeters={selectedSfOption.radiusMeters}
        sensorName={name || 'Nodo Sensor'}
      />
    </>
  );
}
