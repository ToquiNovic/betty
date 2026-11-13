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
import { LocationPickerMap } from './location-picker-map';
import {
  MapPin,
  Search,
  LocateFixed,
  Check,
  Loader2,
  Maximize2,
  Navigation,
  Building2,
  Info,
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lat: number;
  lng: number;
  onConfirm: (lat: number, lng: number, locationName?: string) => void;
  showCoverageCircle?: boolean;
  coverageRadiusMeters?: number;
  sensorName?: string;
  initialLocationName?: string;
}

export function LocationPickerDialog({
  open,
  onOpenChange,
  lat,
  lng,
  onConfirm,
  showCoverageCircle = false,
  coverageRadiusMeters = 2000,
  sensorName = 'Nodo Sensor',
  initialLocationName = '',
}: LocationPickerDialogProps) {
  const [selectedLat, setSelectedLat] = useState<number>(lat);
  const [selectedLng, setSelectedLng] = useState<number>(lng);
  const [locationName, setLocationName] = useState<string>(initialLocationName);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Sync state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedLat(lat);
      setSelectedLng(lng);
      setLocationName(initialLocationName || '');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, lat, lng, initialLocationName]);

  const handleMapChange = (newLat: number, newLng: number) => {
    setSelectedLat(Number(newLat.toFixed(6)));
    setSelectedLng(Number(newLng.toFixed(6)));
  };

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
        setSelectedLat(userLat);
        setSelectedLng(userLng);
        setIsLocating(false);
        toast.success(`GPS fijado: ${userLat}, ${userLng}`);
      },
      (err) => {
        setIsLocating(false);
        toast.error(`No se pudo obtener el GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Error al consultar Nominatim');
      const data: SearchResult[] = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        // Automatically jump to first result if only 1 match
        if (data.length === 1) {
          selectSearchResult(data[0]);
        }
      } else {
        toast.error('No se encontraron ubicaciones para esta búsqueda.');
      }
    } catch {
      toast.error('No se pudo conectar con el servicio de geocodificación.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: SearchResult) => {
    const newLat = Number(parseFloat(item.lat).toFixed(6));
    const newLng = Number(parseFloat(item.lon).toFixed(6));
    setSelectedLat(newLat);
    setSelectedLng(newLng);
    setLocationName(item.display_name.split(',').slice(0, 3).join(','));
    setSearchResults([]);
    toast.success('Ubicación fijada en el mapa');
  };

  const handleApply = () => {
    onConfirm(selectedLat, selectedLng, locationName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[60] bg-black/70 backdrop-blur-xs"
        className="z-[60] sm:max-w-5xl w-[95vw] max-h-[94vh] flex flex-col p-4 sm:p-5 overflow-hidden gap-3 rounded-2xl bg-card border border-border shadow-2xl"
      >
        <DialogHeader className="space-y-1 pb-1 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Maximize2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <span>Seleccionar Ubicación en Mapa Completo</span>
                {showCoverageCircle && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-medium border border-emerald-500/30 hidden sm:inline-block">
                    Radio LoRa: {(coverageRadiusMeters / 1000).toFixed(1)} km
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Haz clic sobre cualquier parte del mapa o arrastra el marcador para fijar la posición exacta de tu sensor.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar & Search Controls */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            {/* Search Input Form */}
            <form onSubmit={handleSearch} className="flex-1 relative flex gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ciudad, barrio o referencia (ej: Campus Porvenir Florencia)..."
                  className="h-8 text-xs pl-8 pr-3 font-medium bg-muted/30"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={isSearching || !searchQuery.trim()}
                className="h-8 text-xs px-2.5 gap-1 shrink-0 cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Search className="h-3 w-3" />
                )}
                <span>Buscar</span>
              </Button>
            </form>

            {/* Quick Actions: GPS & Campus Preset */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDetectGps}
                disabled={isLocating}
                className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
              >
                <LocateFixed className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detectando GPS...' : 'Mi GPS'}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedLat(1.6144);
                  setSelectedLng(-75.6062);
                  setLocationName('Florencia, Caquetá - Campus Porvenir');
                  toast.success('Centrado en Campus Porvenir');
                }}
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer hidden md:flex"
                title="Universidad de la Amazonia - Florencia"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Campus Porvenir</span>
              </Button>
            </div>
          </div>

          {/* Search Results Dropdown List */}
          {searchResults.length > 0 && (
            <div className="p-1.5 rounded-lg border border-border bg-popover/95 backdrop-blur-sm shadow-lg max-h-36 overflow-y-auto space-y-1 animate-in fade-in-50 duration-150">
              <div className="text-[10px] text-muted-foreground px-2 py-0.5 font-semibold uppercase tracking-wider">
                Resultados encontrados (haz clic para seleccionar):
              </div>
              {searchResults.map((res) => (
                <button
                  key={res.place_id}
                  type="button"
                  onClick={() => selectSearchResult(res)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="truncate text-foreground font-medium">{res.display_name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {Number(res.lat).toFixed(4)}, {Number(res.lon).toFixed(4)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Coordinates Quick Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-muted-foreground">Latitud (GPS)</span>
              <Input
                type="number"
                step="0.000001"
                value={selectedLat}
                onChange={(e) => setSelectedLat(parseFloat(e.target.value) || 0)}
                className="h-7 text-xs font-mono bg-muted/20"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-muted-foreground">Longitud (GPS)</span>
              <Input
                type="number"
                step="0.000001"
                value={selectedLng}
                onChange={(e) => setSelectedLng(parseFloat(e.target.value) || 0)}
                className="h-7 text-xs font-mono bg-muted/20"
              />
            </div>
            <div className="space-y-0.5 col-span-2">
              <span className="text-[10px] text-muted-foreground">Nombre de Referencia / Ubicación</span>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="ej: Florencia, Caquetá - Campus Porvenir"
                className="h-7 text-xs bg-muted/20"
              />
            </div>
          </div>
        </div>

        {/* Big Leaflet Map Canvas */}
        <div className="flex-1 w-full min-h-[380px] sm:min-h-[440px] max-h-[58vh] rounded-xl overflow-hidden border border-border relative">
          <LocationPickerMap
            lat={selectedLat}
            lng={selectedLng}
            onChange={handleMapChange}
            showCoverageCircle={showCoverageCircle}
            coverageRadiusMeters={coverageRadiusMeters}
            sensorName={sensorName}
            scrollWheelZoom={true}
            draggableMarker={true}
            zoom={15}
            className="h-full w-full"
          />

          {/* Map Overlay Floating Tip */}
          <div className="absolute bottom-2 left-2 z-[400] flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/85 border border-border/80 shadow-sm backdrop-blur-xs text-[11px] text-foreground pointer-events-none">
            <Info className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>Haz clic en el mapa o arrastra el pin para moverlo. Usa la rueda del ratón para zoom.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 self-start sm:self-center">
            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-foreground font-semibold">Ubicación fijada:</span>
            <span>
              {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Confirmar Ubicación</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
