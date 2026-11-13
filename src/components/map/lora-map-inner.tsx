'use client';

import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LoraGatewayInfo, LoraNetworkNode } from '@/types';
import { Radio, Wifi, Zap, Activity } from 'lucide-react';

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

const createGatewayIcon = () =>
  L.divIcon({
    className: 'custom-gateway-icon',
    html: `
      <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
        <span style="position:absolute; width:44px; height:44px; border-radius:50%; background:rgba(6,182,212,0.3); animation:ping 2.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <div style="width:34px; height:34px; border-radius:50%; background:#0891b2; border:2.5px solid #ffffff; box-shadow:0 0 14px rgba(6,182,212,0.7); display:flex; align-items:center; justify-content:center; color:#ffffff;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const createNodeIcon = (status: string, rssi: number, isSelected: boolean) => {
  const isOnline = status === 'active';
  const color = !isOnline ? '#94a3b8' : rssi > -85 ? '#10b981' : rssi > -105 ? '#f59e0b' : '#ef4444';
  const glow = isSelected ? `0 0 18px ${color}` : `0 0 8px ${color}80`;
  const scale = isSelected ? 'transform: scale(1.2);' : '';

  return L.divIcon({
    className: 'custom-node-icon',
    html: `
      <div style="position:relative; width:30px; height:30px; display:flex; align-items:center; justify-content:center; ${scale}">
        ${isOnline ? `<span style="position:absolute; width:30px; height:30px; border-radius:50%; background:${color}33; animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></span>` : ''}
        <div style="width:22px; height:22px; border-radius:50%; background:${color}; border:2px solid #ffffff; box-shadow:${glow}; display:flex; align-items:center; justify-content:center; color:#ffffff;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

export interface LoraMapInnerProps {
  gateway: LoraGatewayInfo;
  nodes: LoraNetworkNode[];
  selectedNodeId?: string | null;
  onSelectNode: (node: LoraNetworkNode) => void;
  showCoverageAura?: boolean;
}

export default function LoraMapInner({
  gateway,
  nodes,
  selectedNodeId,
  onSelectNode,
  showCoverageAura = true,
}: LoraMapInnerProps) {
  const gatewayIcon = useMemo(() => createGatewayIcon(), []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={[gateway.lat, gateway.lng]}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full min-h-[500px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Gateway Coverage Radius (Ra-02 433MHz) */}
        {showCoverageAura && (
          <Circle
            center={[gateway.lat, gateway.lng]}
            radius={gateway.coverageRadiusMeters}
            pathOptions={{
              color: '#0891b2',
              fillColor: '#06b6d4',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '6, 6',
            }}
          />
        )}

        {/* 2. Selected Node Specific Coverage (Spreading Factor radius) */}
        {selectedNode && selectedNode.loraConfig?.coverage_radius_meters && (
          <Circle
            center={[selectedNode.lat, selectedNode.lng]}
            radius={selectedNode.loraConfig.coverage_radius_meters}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.12,
              weight: 1.5,
            }}
          />
        )}

        {/* 3. RF Polylines linking Gateway to Nodes */}
        {nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const isOnline = node.status === 'active';
          const lineColor = !isOnline
            ? '#94a3b8'
            : node.rssi > -85
            ? '#10b981'
            : node.rssi > -105
            ? '#f59e0b'
            : '#ef4444';

          return (
            <Polyline
              key={`link-${node.id}`}
              positions={[
                [gateway.lat, gateway.lng],
                [node.lat, node.lng],
              ]}
              pathOptions={{
                color: lineColor,
                weight: isSelected ? 3.5 : 2,
                opacity: isSelected ? 0.95 : 0.65,
                dashArray: isOnline ? undefined : '5, 8',
              }}
              eventHandlers={{
                click: () => onSelectNode(node),
              }}
            />
          );
        })}

        {/* 4. Central Gateway Marker */}
        <Marker position={[gateway.lat, gateway.lng]} icon={gatewayIcon}>
          <Popup className="text-xs">
            <div className="space-y-1 p-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-600 dark:text-cyan-400">
                <Radio className="h-4 w-4" />
                <span>{gateway.name}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{gateway.model}</p>
              <div className="pt-1 border-t space-y-0.5 text-[10px]">
                <p>
                  <strong>Frecuencia:</strong> {gateway.frequency}
                </p>
                <p>
                  <strong>Radio Cobertura:</strong> {gateway.coverageRadiusMeters}m
                </p>
                <p>
                  <strong>Nodos Conectados:</strong> {nodes.length}
                </p>
                <p>
                  <strong>Coordenadas:</strong> {gateway.lat.toFixed(4)}, {gateway.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* 5. LoRa Node Markers */}
        {nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const icon = createNodeIcon(node.status, node.rssi, isSelected);

          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectNode(node),
              }}
            >
              <Popup className="text-xs">
                <div className="space-y-1.5 p-1 min-w-[180px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">{node.name}</span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        node.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-1 text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>RSSI (Señal):</span>
                      <strong className="font-mono text-foreground">{node.rssi} dBm</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SNR:</span>
                      <strong className="font-mono text-foreground">{node.snr} dB</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Spreading Factor:</span>
                      <strong className="font-mono text-foreground">
                        SF{node.loraConfig?.spreading_factor || 7}
                      </strong>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectNode(node)}
                    className="w-full mt-2 py-1 px-2 text-[10px] font-semibold rounded bg-primary text-primary-foreground text-center"
                  >
                    Ver Telemetría en Vivo
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <RecenterMap lat={gateway.lat} lng={gateway.lng} />
      </MapContainer>
    </div>
  );
}
