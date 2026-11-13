'use client';

import React, { useState } from 'react';
import { Sensor } from '@/types';
import { sensorApi } from '@/lib/api/sensors';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationPickerMap } from './location-picker-map';
import { LocationPickerDialog } from './location-picker-dialog';
import {
  HARDWARE_PRESETS,
  LORA_BANDS,
  LORA_SF_OPTIONS,
  DEFAULT_LAT,
  DEFAULT_LNG,
} from './create-sensor-dialog';
import {
  Radio,
  Globe,
  Cpu,
  MapPin,
  LocateFixed,
  Map as MapIcon,
  Maximize2,
  Wifi,
  Share2,
  Loader2,
  Save,
  Settings,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface SensorSettingsFormProps {
  sensor: Sensor;
  onUpdated: () => void;
  nameLabel: string;
  descLabel: string;
  saveLabel: string;
  errorLabel: string;
}

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

  const [name, setName] = useState(sensor.name);
  const [description, setDescription] = useState(sensor.description || '');
  const [originType, setOriginType] = useState<'sensor' | 'metaverso'>(
    meta.origin_type === 'metaverso' ? 'metaverso' : 'sensor'
  );
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

      await sensorApi.update(sensor.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        metadata: updatedMetadata,
      });

      onUpdated();
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
      <Card className="border border-border/80 shadow-sm rounded-2xl bg-card overflow-hidden">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 bg-muted/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                Configuración del Dispositivo
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Personaliza los parámetros de hardware, origen de datos, geolocalización y conectividad de red.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleUpdate}>
          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Section 1: Origen y Datos Básicos */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Tipo de Origen</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOriginType('sensor')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      originType === 'sensor'
                        ? 'border-emerald-500/70 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/50 shadow-xs'
                        : 'border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Radio
                        className={`h-4 w-4 ${
                          originType === 'sensor' ? 'text-emerald-500' : 'text-muted-foreground'
                        }`}
                      />
                      <span className="text-xs font-bold text-foreground">Hardware Físico</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      Placas y nodos reales (ESP32, LoRaWAN, Arduino, Raspberry Pi).
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOriginType('metaverso')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      originType === 'metaverso'
                        ? 'border-purple-500/70 bg-purple-500/10 text-foreground ring-1 ring-purple-500/50 shadow-xs'
                        : 'border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe
                        className={`h-4 w-4 ${
                          originType === 'metaverso' ? 'text-purple-500' : 'text-muted-foreground'
                        }`}
                      />
                      <span className="text-xs font-bold text-foreground">Gemelo Digital 3D</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      Simulación virtual y mundos inmersivos (OpenSim 3D, Three.js, Unity).
                    </span>
                  </button>
                </div>
              </div>

              {/* Sensor Name & Description Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-semibold">
                    {nameLabel} <span className="text-emerald-500">*</span>
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

                <div className="space-y-1.5">
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
            </div>

            {/* Section 2: Tecnología / Protocolo */}
            <div className="space-y-3 pt-1 border-t border-border/60">
              <div className="flex items-center justify-between pt-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Tecnología / Protocolo</span>
                </Label>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  {hardware}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {HARDWARE_PRESETS.map((hw) => {
                  const isSelected = hardware === hw.id;
                  return (
                    <button
                      key={hw.id}
                      type="button"
                      onClick={() => setHardware(hw.id)}
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

              {/* LoRaWAN Specific Parameters */}
              {hardware === 'LoRaWAN' && (
                <div className="space-y-3 p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 shadow-xs mt-3 animate-in fade-in-50 duration-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-500">
                      <Wifi className="h-4 w-4" />
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
                    <Label htmlFor="edit-gateway-id" className="text-[11px] font-semibold text-muted-foreground">
                      Gateway LoRa Receptor (Bridge ID)
                    </Label>
                    <Input
                      id="edit-gateway-id"
                      value={loraGatewayId}
                      onChange={(e) => setLoraGatewayId(e.target.value)}
                      placeholder="gateway-esp32-01"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  {/* Community Network Coverage Share Toggle */}
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
            </div>

            {/* Section 3: Ubicación y Coordenadas Geográficas */}
            <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-muted/20">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label htmlFor="edit-loc" className="text-xs font-semibold flex items-center gap-1.5">
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
                    title="Abrir mapa en pantalla completa para seleccionar ubicación con precisión"
                  >
                    <Maximize2 className="h-3 w-3" />
                    <span>Abrir en Grande</span>
                  </button>
                </div>
              </div>

              <Input
                id="edit-loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ej: Florencia, Caquetá - Campus Porvenir"
                disabled={isUpdating}
                className="h-9 text-xs"
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
              {showMap && (
                <div className="pt-1.5 space-y-1.5">
                  <div
                    className="relative w-full rounded-xl overflow-hidden border border-border group"
                    style={{ height: '220px' }}
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
                    <button
                      type="button"
                      onClick={() => setIsBigMapOpen(true)}
                      className="absolute top-2 right-2 z-[400] flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-background/90 hover:bg-background text-foreground shadow-md border border-border/80 backdrop-blur-xs transition-all cursor-pointer"
                      title="Abrir mapa en pantalla completa"
                    >
                      <Maximize2 className="h-3 w-3 text-emerald-500" />
                      <span>Ampliar Mapa</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                    <span>💡 Haz clic o arrastra el pin. Presiona <strong className="font-semibold text-emerald-500">Ctrl + Scroll</strong> para zoom.</span>
                    {hardware === 'LoRaWAN' && shareOnMap && (
                      <span className="font-mono text-emerald-500 font-semibold">
                        Radio LoRa: {(selectedSfOption.radiusMeters / 1000).toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-5 sm:p-6 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Dispositivo listo para guardar cambios</span>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isUpdating}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer w-full sm:w-auto"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{saveLabel}</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

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
