'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePublicLoraNetwork } from '@/lib/api/sensors';
import { useSocket } from '@/components/providers/socket-provider';
import { LandingHeader } from '@/components/landing/landing-header';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LoraNetworkMap } from '@/components/map/lora-network-map';
import type { MapFocusTarget } from '@/components/map/lora-map-inner';
import { LoraGatewayInfo, LoraNetworkNode } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Activity,
  ChevronRight,
  Crosshair,
  Layers,
  Radio,
  RefreshCw,
  Search,
  Terminal,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LivePacketEntry {
  id: string;
  sensorId: string;
  sensorName: string;
  rssi?: number;
  snr?: number;
  payload: Record<string, unknown>;
  receivedAt: Date;
}

const DEFAULT_GATEWAY: LoraGatewayInfo = {
  id: '8e779657-48bf-4e9c-8e7d-1a586756392e',
  name: 'LoRa-Gateway',
  model: 'ESP32 DevKit + SX1278 (Ra-02)',
  frequency: '433 MHz',
  lat: 1.6144,
  lng: -75.6062,
  coverageRadiusMeters: 3500,
  status: 'online',
  connectedNodesCount: 0,
  rssi: -80,
  snr: 8.5,
};

function getRssiSignalClass(status: string, rssi: number): string {
  if (status !== 'active') return 'text-muted-foreground';
  if (rssi > -85) return 'text-emerald-600 dark:text-emerald-400';
  if (rssi > -105) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function getRssiDotClass(status: string, rssi: number): string {
  if (status !== 'active') return 'bg-muted-foreground';
  if (rssi > -85) return 'bg-emerald-500';
  if (rssi > -105) return 'bg-amber-500';
  return 'bg-rose-500';
}

function formatTelemetryValue(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value ?? '—');
}

export default function PublicLoraMapPage() {
  const { network, isLoading, mutate } = usePublicLoraNetwork();
  const { socket, isConnected } = useSocket();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('inspector');
  const [nodeSearch, setNodeSearch] = useState('');
  const [showCoverage, setShowCoverage] = useState(true);
  const [livePackets, setLivePackets] = useState<LivePacketEntry[]>([]);
  const [liveGatewayPatch, setLiveGatewayPatch] = useState<Partial<LoraGatewayInfo> | null>(null);
  const [liveNodePatches, setLiveNodePatches] = useState<
    Record<string, Partial<LoraNetworkNode>>
  >({});
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null);

  const gateway = useMemo<LoraGatewayInfo>(
    () => ({
      ...(network?.gateway ?? DEFAULT_GATEWAY),
      ...liveGatewayPatch,
    }),
    [network?.gateway, liveGatewayPatch]
  );

  const nodes = useMemo<LoraNetworkNode[]>(
    () =>
      (network?.nodes ?? []).map((node) => {
        const patch = liveNodePatches[node.id];
        return patch ? { ...node, ...patch } : node;
      }),
    [network?.nodes, liveNodePatches]
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId]
  );

  const nodesRef = useRef<LoraNetworkNode[]>(nodes);
  const gatewayRef = useRef<LoraGatewayInfo>(gateway);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    gatewayRef.current = gateway;
  }, [gateway]);

  // Subscribe once per socket instance to public LoRa network events
  useEffect(() => {
    if (!socket) return;

    const joinPublicRoom = () => {
      socket.emit('subscribe:public-network', {});
    };

    if (socket.connected) {
      joinPublicRoom();
    }
    socket.on('connect', joinPublicRoom);

    const onSensorData = (data: {
      sensorId?: string;
      payload?: Record<string, unknown>;
    }) => {
      if (!data?.sensorId) return;

      const sensorId = data.sensorId;
      const now = new Date();
      const packetPayload = data.payload || {};
      const rssi = typeof packetPayload.rssi === 'number' ? packetPayload.rssi : undefined;
      const snr = typeof packetPayload.snr === 'number' ? packetPayload.snr : undefined;
      const rawMetrics = packetPayload.metrics;
      const metrics: Record<string, unknown> =
        rawMetrics !== null && typeof rawMetrics === 'object' && !Array.isArray(rawMetrics)
          ? (rawMetrics as Record<string, unknown>)
          : packetPayload;

      const currentGateway = gatewayRef.current;

      if (sensorId === currentGateway.id) {
        setLiveGatewayPatch((prev) => ({
          status: 'online',
          latestTelemetry: {
            ...(prev?.latestTelemetry ?? currentGateway.latestTelemetry),
            ...metrics,
          },
          rssi: rssi ?? prev?.rssi ?? currentGateway.rssi,
          snr: snr ?? prev?.snr ?? currentGateway.snr,
          lastSeen: now.toISOString(),
        }));
      }

      setLiveNodePatches((prev) => {
        const baseNode = nodesRef.current.find((n) => n.id === sensorId);
        if (!baseNode) return prev;
        const prevPatch = prev[sensorId];
        return {
          ...prev,
          [sensorId]: {
            status: 'active',
            rssi: rssi ?? prevPatch?.rssi ?? baseNode.rssi,
            snr: snr ?? prevPatch?.snr ?? baseNode.snr,
            lastSeen: now.toISOString(),
            latestTelemetry: {
              ...(prevPatch?.latestTelemetry ?? baseNode.latestTelemetry),
              ...metrics,
            },
          },
        };
      });

      const foundNode = nodesRef.current.find((n) => n.id === sensorId);
      const isGw = sensorId === currentGateway.id;
      const newEntry: LivePacketEntry = {
        id: `${sensorId}-${now.getTime()}`,
        sensorId,
        sensorName: isGw ? `[Base] ${currentGateway.name}` : foundNode?.name || 'Nodo LoRa',
        rssi,
        snr,
        payload: metrics,
        receivedAt: now,
      };
      setLivePackets((prev) => [newEntry, ...prev.slice(0, 19)]);
    };

    socket.on('sensor:data', onSensorData);

    return () => {
      socket.off('connect', joinPublicRoom);
      socket.off('sensor:data', onSensorData);
      socket.emit('unsubscribe:public-network');
    };
  }, [socket]);

  const activeNodesCount = useMemo(
    () => nodes.filter((n) => n.status === 'active').length,
    [nodes]
  );

  const avgRssi = useMemo(() => {
    const valid = nodes.filter((n) => typeof n.rssi === 'number' && Number.isFinite(n.rssi));
    if (valid.length === 0) return -75;
    return Math.round(valid.reduce((acc, curr) => acc + curr.rssi, 0) / valid.length);
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    const query = nodeSearch.trim().toLowerCase();
    if (!query) return nodes;
    return nodes.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query) ||
        node.hardware?.toLowerCase().includes(query)
    );
  }, [nodes, nodeSearch]);

  const focusOnCoords = useCallback((lat: number, lng: number) => {
    setFocusTarget({ lat, lng, nonce: Date.now() });
  }, []);

  const handleSelectFromMap = useCallback((node: LoraNetworkNode | null) => {
    setSelectedNodeId(node?.id ?? null);
    setActiveTab('inspector');
  }, []);

  const handleSelectNodeFromList = useCallback(
    (node: LoraNetworkNode, openInspector = false) => {
      setSelectedNodeId(node.id);
      focusOnCoords(node.lat, node.lng);
      if (openInspector) {
        setActiveTab('inspector');
      }
    },
    [focusOnCoords]
  );

  const handleFocusGateway = useCallback(() => {
    setSelectedNodeId(null);
    focusOnCoords(gateway.lat, gateway.lng);
  }, [focusOnCoords, gateway.lat, gateway.lng]);

  const inspectedTelemetryEntries = useMemo(() => {
    const source = selectedNode ? selectedNode.latestTelemetry : gateway.latestTelemetry;
    if (!source) return [];
    return Object.entries(source);
  }, [selectedNode, gateway.latestTelemetry]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex flex-1 flex-col">
        {/* Top Header & KPI Strip */}
        <div className="border-b bg-card/60 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="container mx-auto flex max-w-7xl flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1.5 font-mono text-xs">
                  <Radio className="size-3 text-primary" />
                  Red LoRa {gateway.frequency || '433 MHz'}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1.5 text-xs',
                    isConnected
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  )}
                >
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    )}
                  />
                  {isConnected ? 'Telemetría en Vivo' : 'Reconectando WS...'}
                </Badge>
              </div>

              <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Topología de Red LoRa & Telemetría en Tiempo Real
              </h1>
              <p className="text-xs text-muted-foreground">
                Monitoreo geográfico de paquetes de radiofrecuencia recibidos por el Gateway central.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="min-w-22 rounded-lg border bg-card px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Nodos</p>
                <p className="font-mono text-lg font-bold text-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400">{activeNodesCount}</span>
                  <span className="text-xs font-normal text-muted-foreground"> / {nodes.length}</span>
                </p>
              </div>

              <div className="min-w-24 rounded-lg border bg-card px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  RSSI Prom.
                </p>
                <p className="font-mono text-lg font-bold text-primary">
                  {avgRssi} <span className="text-[10px] font-normal text-muted-foreground">dBm</span>
                </p>
              </div>

              <div className="min-w-24 rounded-lg border bg-card px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Frecuencia
                </p>
                <p className="font-mono text-lg font-bold text-foreground">
                  {gateway.frequency || '433 MHz'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => mutate()}
                className="h-10 px-3 text-xs"
                title="Actualizar datos del mapa"
              >
                <RefreshCw
                  data-icon="inline-start"
                  className={isLoading ? 'animate-spin' : undefined}
                />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Interactive Map & Tabbed Inspector */}
        <div className="container mx-auto flex-1 max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:h-[calc(100vh-14rem)] lg:min-h-[600px] lg:grid-cols-12">
            {/* Map Area */}
            <div className="relative flex min-h-[480px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm lg:col-span-8 lg:h-full">
              <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCoverage(!showCoverage)}
                  className="h-8 border bg-card/90 text-xs shadow-md backdrop-blur-md"
                >
                  <Layers data-icon="inline-start" className="text-primary" />
                  {showCoverage ? 'Ocultar Cobertura' : 'Ver Cobertura RF'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFocusGateway}
                  className="h-8 border bg-card/90 text-xs shadow-md backdrop-blur-md"
                >
                  <Crosshair data-icon="inline-start" className="text-primary" />
                  Centrar Gateway
                </Button>
              </div>

              <div className="flex-1 w-full">
                <LoraNetworkMap
                  gateway={gateway}
                  nodes={nodes}
                  selectedNodeId={selectedNode?.id}
                  onSelectNode={handleSelectFromMap}
                  showCoverageAura={showCoverage}
                  focusTarget={focusTarget}
                />
              </div>

              {/* Map Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-card/95 px-4 py-2.5 text-[11px] text-muted-foreground">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-cyan-500" />
                    Gateway Base
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    Señal Fuerte (&gt; -85 dBm)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-amber-500" />
                    Señal Media (-85 a -105 dBm)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-rose-500" />
                    Señal Débil (&lt; -105 dBm)
                  </span>
                </div>
                <span className="hidden sm:inline">
                  Seleccioná un marcador o usá la pestaña Nodos
                </span>
              </div>
            </div>

            {/* Right Tabbed Telemetry Panel */}
            <Card className="flex min-h-[520px] flex-col overflow-hidden border shadow-sm lg:col-span-4 lg:h-full">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex h-full flex-col gap-0"
              >
                <div className="border-b bg-muted/25 px-3 py-2.5">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="inspector" className="text-xs">
                      <Radio data-icon="inline-start" />
                      Inspector
                    </TabsTrigger>
                    <TabsTrigger value="nodes" className="text-xs">
                      <Activity data-icon="inline-start" />
                      Nodos ({nodes.length})
                    </TabsTrigger>
                    <TabsTrigger value="frames" className="text-xs">
                      <Terminal data-icon="inline-start" />
                      Tramas ({livePackets.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab 1: Node / Gateway Inspector */}
                <TabsContent
                  value="inspector"
                  className="flex flex-1 flex-col overflow-y-auto p-4 data-[hidden]:hidden"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2 border-b pb-3">
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <h2 className="flex items-center gap-1.5 truncate text-sm font-bold text-foreground">
                          <Radio className="size-4 shrink-0 text-primary" />
                          <span className="truncate">
                            {selectedNode ? selectedNode.name : gateway.name}
                          </span>
                        </h2>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          {selectedNode ? selectedNode.id : `Base: ${gateway.id}`}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {!selectedNode && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            GATEWAY BASE
                          </Badge>
                        )}
                        <Badge
                          variant={
                            selectedNode?.status === 'active' || !selectedNode
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-[10px] uppercase"
                        >
                          {selectedNode ? selectedNode.status : gateway.status}
                        </Badge>
                      </div>
                    </div>

                    {/* RF Metrics */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/35 p-3">
                        <span className="text-[11px] text-muted-foreground">Potencia RSSI</span>
                        <span
                          className={cn(
                            'font-mono text-base font-extrabold',
                            selectedNode
                              ? getRssiSignalClass(selectedNode.status, selectedNode.rssi)
                              : 'text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          {selectedNode ? selectedNode.rssi : gateway.rssi ?? -80}{' '}
                          <span className="text-xs font-normal text-muted-foreground">dBm</span>
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/35 p-3">
                        <span className="text-[11px] text-muted-foreground">Relación SNR</span>
                        <span className="font-mono text-base font-extrabold text-primary">
                          {selectedNode ? selectedNode.snr : gateway.snr ?? 8.5}{' '}
                          <span className="text-xs font-normal text-muted-foreground">dB</span>
                        </span>
                      </div>
                    </div>

                    {/* Technical Specs */}
                    {selectedNode ? (
                      <div className="flex flex-col gap-2 border-t pt-3 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between gap-2">
                          <span>Spreading Factor</span>
                          <strong className="font-mono text-foreground">
                            SF{selectedNode.loraConfig?.spreading_factor || 7}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Ancho de Banda</span>
                          <strong className="font-mono text-foreground">
                            {selectedNode.loraConfig?.bandwidth || '125 kHz'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Radio Cobertura</span>
                          <strong className="font-mono text-foreground">
                            {selectedNode.loraConfig?.coverage_radius_meters || 2000} m
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Última Comunicación</span>
                          <strong className="font-mono text-foreground">
                            {selectedNode.lastSeen
                              ? format(new Date(selectedNode.lastSeen), 'HH:mm:ss', { locale: es })
                              : '—'}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 border-t pt-3 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between gap-2">
                          <span>Hardware Base</span>
                          <strong className="truncate text-foreground">{gateway.model}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Frecuencia Central</span>
                          <strong className="font-mono text-foreground">{gateway.frequency}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Radio Cobertura Máx.</span>
                          <strong className="font-mono text-foreground">
                            {gateway.coverageRadiusMeters} m
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Nodos Vinculados</span>
                          <strong className="font-mono text-foreground">{nodes.length} nodos</strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Ubicación GPS</span>
                          <strong className="font-mono text-foreground">
                            {gateway.lat.toFixed(4)}, {gateway.lng.toFixed(4)}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Decoded Telemetry */}
                    {inspectedTelemetryEntries.length > 0 && (
                      <div className="flex flex-col gap-2 border-t pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Telemetría Decodificada
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {inspectedTelemetryEntries.map(([key, val]) => (
                            <div
                              key={key}
                              className="flex min-w-0 flex-col gap-0.5 rounded-lg border bg-muted/25 p-2.5 font-mono"
                            >
                              <span
                                className="truncate text-[10px] text-muted-foreground"
                                title={key}
                              >
                                {key}
                              </span>
                              <span className="truncate text-xs font-bold text-foreground">
                                {formatTelemetryValue(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedNode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFocusGateway}
                        className="w-full text-xs"
                      >
                        <Crosshair data-icon="inline-start" />
                        Volver al Gateway Base
                      </Button>
                    )}
                  </div>
                </TabsContent>

                {/* Tab 2: Searchable Nodes List */}
                <TabsContent
                  value="nodes"
                  className="flex flex-1 flex-col gap-3 overflow-hidden p-4 data-[hidden]:hidden"
                >
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      value={nodeSearch}
                      onChange={(e) => setNodeSearch(e.target.value)}
                      placeholder="Buscar nodo por nombre o ID..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                    {filteredNodes.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground">
                        {nodes.length === 0
                          ? 'No hay nodos LoRa compartidos en el mapa todavía.'
                          : 'Ningún nodo coincide con la búsqueda.'}
                      </div>
                    ) : (
                      filteredNodes.map((node) => {
                        const isSelected = selectedNode?.id === node.id;
                        return (
                          <div
                            key={node.id}
                            className={cn(
                              'flex items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors',
                              isSelected
                                ? 'border-primary bg-primary/10'
                                : 'bg-card hover:bg-muted/40'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectNodeFromList(node, false)}
                              className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'size-2 shrink-0 rounded-full',
                                    getRssiDotClass(node.status, node.rssi)
                                  )}
                                />
                                <span className="truncate text-xs font-semibold text-foreground">
                                  {node.name}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                                <span className={getRssiSignalClass(node.status, node.rssi)}>
                                  {node.rssi} dBm
                                </span>
                                <span>SNR {node.snr} dB</span>
                                <span>SF{node.loraConfig?.spreading_factor || 7}</span>
                              </div>
                            </button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Inspeccionar ${node.name}`}
                              title="Ver en Inspector"
                              onClick={() => handleSelectNodeFromList(node, true)}
                            >
                              <ChevronRight />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>

                {/* Tab 3: Live Incoming Packet Stream */}
                <TabsContent
                  value="frames"
                  className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 data-[hidden]:hidden"
                >
                  {livePackets.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-xs text-muted-foreground">
                      <Activity className="size-5 text-muted-foreground/50 animate-pulse" />
                      <span>Esperando tramas LoRa entrantes en tiempo real...</span>
                    </div>
                  ) : (
                    livePackets.map((pkt) => (
                      <div
                        key={pkt.id}
                        className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-2.5 font-mono text-[11px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-bold text-foreground">
                            {pkt.sensorName}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {format(pkt.receivedAt, 'HH:mm:ss')}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          {pkt.rssi !== undefined && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              RSSI {pkt.rssi} dBm
                            </Badge>
                          )}
                          {pkt.snr !== undefined && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              SNR {pkt.snr} dB
                            </Badge>
                          )}
                        </div>
                        <code className="block truncate rounded bg-background/80 px-2 py-1 text-[10px] text-muted-foreground">
                          {JSON.stringify(pkt.payload)}
                        </code>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
