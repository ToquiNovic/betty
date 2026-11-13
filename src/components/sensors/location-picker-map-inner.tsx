'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
}

export default function LocationPickerMapInner({
  lat,
  lng,
  onChange,
  showCoverageCircle = false,
  coverageRadiusMeters = 2000,
  sensorName = 'Nodo Sensor',
}: LocationPickerMapInnerProps) {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-border/80 shadow-inner relative z-0">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full min-h-[180px]"
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

        <Marker position={[lat, lng]}>
          <Popup>
            <div className="text-xs font-semibold">{sensorName}</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {lat.toFixed(5)}, {lng.toFixed(5)}
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
      </MapContainer>
    </div>
  );
}
