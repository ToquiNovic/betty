'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Fix default leaflet marker icon assets in Next.js
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function InvalidateMapSize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    map.invalidateSize();

    // ResizeObserver detects anytime the dialog animation finishes or window resizes
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);

    const timers = [50, 150, 300, 600, 1000].map((ms) =>
      setTimeout(() => map.invalidateSize(), ms)
    );

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      ro.disconnect();
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

function CtrlScrollZoomHandler() {
  const map = useMap();
  const [showCtrlTip, setShowCtrlTip] = useState(false);
  const tipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Disable default scrollWheelZoom on Leaflet map
    map.scrollWheelZoom.disable();

    const container = map.getContainer();
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl or Cmd key is pressed: allow smooth zooming!
        e.preventDefault();
        if (e.deltaY < 0) {
          map.zoomIn(1);
        } else if (e.deltaY > 0) {
          map.zoomOut(1);
        }
      } else {
        // Ctrl is not held: show the overlay notification
        setShowCtrlTip(true);
        if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
        tipTimeoutRef.current = setTimeout(() => {
          setShowCtrlTip(false);
        }, 1800);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
    };
  }, [map]);

  if (!showCtrlTip) return null;

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/45 backdrop-blur-[1px] transition-all pointer-events-none animate-in fade-in-0 duration-150">
      <div className="px-4 py-2.5 rounded-xl bg-popover/95 border border-border shadow-2xl text-xs font-semibold text-foreground flex items-center gap-2">
        <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono font-bold text-emerald-500 shadow-2xs">
          Ctrl
        </kbd>
        <span>+ desplazamiento para acercar o alejar el mapa</span>
      </div>
    </div>
  );
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface LocationPickerMapInnerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  showCoverageCircle?: boolean;
  coverageRadiusMeters?: number;
  sensorName?: string;
  scrollWheelZoom?: boolean;
  zoom?: number;
  className?: string;
  draggableMarker?: boolean;
  style?: React.CSSProperties;
}

export default function LocationPickerMapInner({
  lat,
  lng,
  onChange,
  showCoverageCircle = false,
  coverageRadiusMeters = 2000,
  sensorName = 'Nodo Sensor',
  zoom = 14,
  className,
  draggableMarker = true,
  style,
}: LocationPickerMapInnerProps) {
  return (
    <div
      className={cn("h-full w-full rounded-xl overflow-hidden border border-border/80 shadow-inner relative z-0", className)}
      style={{ height: '100%', width: '100%', minHeight: '100%', ...style }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ height: '100%', width: '100%', minHeight: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showCoverageCircle && (
          <Circle
            center={[lat, lng]}
            radius={coverageRadiusMeters}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        )}

        <Marker
          position={[lat, lng]}
          draggable={draggableMarker}
          eventHandlers={{
            dragend(e) {
              const marker = e.target;
              if (marker != null) {
                const pos = marker.getLatLng();
                onChange(pos.lat, pos.lng);
              }
            },
          }}
        >
          <Popup>
            <div className="text-xs font-semibold">{sensorName}</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
            {showCoverageCircle && (
              <div className="text-[10px] text-emerald-600 font-medium mt-1">
                Radio de Cobertura LoRa: {(coverageRadiusMeters / 1000).toFixed(1)} km
              </div>
            )}
          </Popup>
        </Marker>

        <MapClickHandler onSelect={onChange} />
        <RecenterMap lat={lat} lng={lng} />
        <InvalidateMapSize />
        <CtrlScrollZoomHandler />
      </MapContainer>
    </div>
  );
}
