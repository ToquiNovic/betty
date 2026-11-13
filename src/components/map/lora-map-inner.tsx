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
      <div style="position:relative; width:56px; height:56px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <span style="position:absolute; width:52px; height:52px; border-radius:50%; background:rgba(6,182,212,0.25); animation:ping 2.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <span style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(6,182,212,0.4); animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></span>
        <div style="width:36px; height:36px; border-radius:50%; background:#0891b2; border:3px solid #ffffff; box-shadow:0 0 16px rgba(6,182,212,0.9); display:flex; align-items:center; justify-content:center; color:#ffffff; z-index:2;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>
        </div>
        <div style="position:absolute; bottom:-14px; background:#042f2e; color:#2dd4bf; font-family:ui-monospace, monospace; font-size:8.5px; font-weight:800; padding:1px 6px; border-radius:999px; border:1px solid #14b8a6; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.6); letter-spacing:0.04em; z-index:5;">
          GATEWAY BASE
        </div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });

const createNodeIcon = (status: string, rssi: number, isSelected: boolean) => {
  const isOnline = status === 'active';
  const color = !isOnline ? '#94a3b8' : rssi > -85 ? '#10b981' : rssi > -105 ? '#f59e0b' : '#ef4444';
  const glow = isSelected ? `0 0 18px ${color}` : `0 0 8px ${color}80`;
  const scale = isSelected ? 'transform: scale(1.2);' : '';

  return L.divIcon({
    className: 'custom-node-icon',
    html: `
      <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center; ${scale}">
        ${isOnline ? `<span style="position:absolute; width:32px; height:32px; border-radius:50%; background:${color}33; animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></span>` : ''}
        <div style="width:24px; height:24px; border-radius:50%; background:${color}; border:2px solid #ffffff; box-shadow:${glow}; display:flex; align-items:center; justify-content:center; color:#ffffff;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M5 12a7 7 0 0 1 14 0"/><path d="M2 12a10 10 0 0 1 20 0"/></svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export interface LoraMapInnerProps {
  gateway: LoraGatewayInfo;
  nodes: LoraNetworkNode[];
  selectedNodeId?: string | null;
  onSelectNode: (node: LoraNetworkNode | null) => void;
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
        <Marker
          position={[gateway.lat, gateway.lng]}
          icon={gatewayIcon}
          eventHandlers={{
            click: () => onSelectNode(null),
          }}
        >
          <Popup className="lora-gateway-popup">
            <div className="space-y-1.5 p-1 min-w-[210px] text-slate-900">
              <div className="flex items-center justify-between gap-1.5 font-bold text-cyan-800 text-xs border-b pb-1.5 border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-cyan-600" />
                  <span className="truncate">{gateway.name}</span>
                </div>
                <span className="text-[9px] bg-cyan-100 text-cyan-800 font-mono font-bold px-1.5 py-0.5 rounded-full">
                  GATEWAY BASE
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">{gateway.model}</p>
              <div className="pt-1 space-y-0.5 text-[10px] text-slate-700">
                <p>
                  <strong className="text-slate-900">ID Hardware:</strong>{' '}
                  <span className="font-mono text-[9px]">{gateway.id}</span>
                </p>
                <p>
                  <strong className="text-slate-900">Frecuencia:</strong> {gateway.frequency}
                </p>
                <p>
                  <strong className="text-slate-900">Radio Cobertura:</strong> {gateway.coverageRadiusMeters} m
                </p>
                <p>
                  <strong className="text-slate-900">Nodos Vinculados:</strong> {nodes.length}
                </p>
                <p>
                  <strong className="text-slate-900">Coordenadas:</strong> {gateway.lat.toFixed(4)}, {gateway.lng.toFixed(4)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectNode(null)}
                className="mt-2 w-full py-1 px-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] text-center transition-colors cursor-pointer border-none"
              >
                Ver Telemetría en el Panel
              </button>
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
              <Popup className="lora-node-popup">
                <div className="space-y-2 p-1 min-w-[190px] text-slate-900">
                  <div className="flex items-center justify-between gap-2 border-b pb-1.5 border-slate-200">
                    <span className="font-bold text-slate-900 text-xs truncate">{node.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        node.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-1 text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">RSSI (Señal):</span>
                      <strong className="font-mono text-emerald-700 font-bold">{node.rssi} dBm</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">SNR:</span>
                      <strong className="font-mono text-cyan-700 font-bold">{node.snr} dB</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Spreading Factor:</span>
                      <strong className="font-mono text-slate-900 font-bold">
                        SF{node.loraConfig?.spreading_factor || 7}
                      </strong>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectNode(node)}
                    className="w-full mt-1.5 py-1 px-2 text-[10px] font-bold rounded bg-cyan-700 hover:bg-cyan-800 text-white text-center transition-colors shadow-xs"
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
