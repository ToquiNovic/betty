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
import { Radio } from 'lucide-react';

export interface MapFocusTarget {
  lat: number;
  lng: number;
  nonce: number;
}

function FocusMapController({
  target,
  gatewayLat,
  gatewayLng,
}: {
  target?: MapFocusTarget | null;
  gatewayLat: number;
  gatewayLng: number;
}) {
  const map = useMap();
  const prevInitialCoordsRef = React.useRef<string>(`${gatewayLat},${gatewayLng}`);

  useEffect(() => {
    const nextKey = `${gatewayLat},${gatewayLng}`;
    if (nextKey !== prevInitialCoordsRef.current && !target) {
      prevInitialCoordsRef.current = nextKey;
      map.setView([gatewayLat, gatewayLng], map.getZoom());
    }
  }, [gatewayLat, gatewayLng, target, map]);

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 14), {
      duration: 0.5,
    });
  }, [target, map]);

  return null;
}

const createGatewayIcon = () =>
  L.divIcon({
    className: 'custom-gateway-icon',
    html: `
      <div style="position:relative; width:56px; height:56px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <span style="position:absolute; width:52px; height:52px; border-radius:50%; background:rgba(6,182,212,0.22); animation:ping 2.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <span style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(6,182,212,0.36); animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></span>
        <div style="width:36px; height:36px; border-radius:50%; background:#0891b2; border:3px solid #ffffff; box-shadow:0 0 16px rgba(6,182,212,0.85); display:flex; align-items:center; justify-content:center; color:#ffffff; z-index:2;">
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
  const scale = isSelected ? 'transform: scale(1.22);' : '';

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
  focusTarget?: MapFocusTarget | null;
}

export default function LoraMapInner({
  gateway,
  nodes,
  selectedNodeId,
  onSelectNode,
  showCoverageAura = true,
  focusTarget,
}: LoraMapInnerProps) {
  const gatewayIcon = useMemo(() => createGatewayIcon(), []);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative z-0 h-full w-full">
      <MapContainer
        center={[gateway.lat, gateway.lng]}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full min-h-[460px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Gateway Coverage Radius */}
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

        {/* Selected Node Coverage Radius */}
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

        {/* RF Polylines linking Gateway to Nodes */}
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

        {/* Central Gateway Marker */}
        <Marker
          position={[gateway.lat, gateway.lng]}
          icon={gatewayIcon}
          eventHandlers={{
            click: () => onSelectNode(null),
          }}
        >
          <Popup className="lora-gateway-popup">
            <div className="min-w-[200px] space-y-2 p-1 text-slate-900">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                <span className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-900">
                  <Radio className="size-3.5 shrink-0 text-cyan-700" />
                  <span className="truncate">{gateway.name}</span>
                </span>
                <span className="shrink-0 rounded-full bg-cyan-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-800">
                  BASE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-700">
                <span className="text-slate-500">Frecuencia</span>
                <strong className="text-right font-mono text-slate-900">{gateway.frequency}</strong>
                <span className="text-slate-500">Cobertura</span>
                <strong className="text-right font-mono text-slate-900">
                  {gateway.coverageRadiusMeters} m
                </strong>
                <span className="text-slate-500">Nodos</span>
                <strong className="text-right font-mono text-slate-900">{nodes.length}</strong>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* LoRa Node Markers */}
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
                <div className="min-w-[180px] space-y-2 p-1 text-slate-900">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                    <span className="truncate text-xs font-bold text-slate-900">{node.name}</span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        node.status === 'active'
                          ? 'border border-emerald-300 bg-emerald-100 text-emerald-800'
                          : 'border border-slate-300 bg-slate-100 text-slate-600'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-700">
                    <span className="text-slate-500">RSSI</span>
                    <strong className="text-right font-mono font-bold text-emerald-700">
                      {node.rssi} dBm
                    </strong>
                    <span className="text-slate-500">SNR</span>
                    <strong className="text-right font-mono font-bold text-cyan-700">
                      {node.snr} dB
                    </strong>
                    <span className="text-slate-500">Factor</span>
                    <strong className="text-right font-mono font-bold text-slate-900">
                      SF{node.loraConfig?.spreading_factor || 7}
                    </strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <FocusMapController
          target={focusTarget}
          gatewayLat={gateway.lat}
          gatewayLng={gateway.lng}
        />
      </MapContainer>
    </div>
  );
}
