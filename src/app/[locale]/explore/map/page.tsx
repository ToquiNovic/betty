'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePublicLoraNetwork } from '@/lib/api/sensors';
import { useSocket } from '@/components/providers/socket-provider';
import { LandingHeader } from '@/components/landing/landing-header';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LoraNetworkMap } from '@/components/map/lora-network-map';
import { LoraNetworkNode } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radio,
  Wifi,
  Activity,
  Layers,
  Thermometer,
  Droplets,
  BatteryCharging,
  Clock,
  Signal,
  Cpu,
  RefreshCw,
  Info,
  ChevronRight,
  Maximize2,
  Terminal,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LivePacketEntry {
  id: string;
  sensorId: string;
  sensorName?: string;
  rssi?: number;
  snr?: number;
  payload: Record<string, any>;
  receivedAt: Date;
}

export default function PublicLoraMapPage() {
  const { network, isLoading, mutate } = usePublicLoraNetwork();
  const { socket, isConnected } = useSocket();

  const [nodes, setNodes] = useState<LoraNetworkNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<LoraNetworkNode | null>(null);
  const [showCoverage, setShowCoverage] = useState(true);
  const [livePackets, setLivePackets] = useState<LivePacketEntry[]>([]);
  const [lastPacketTime, setLastPacketTime] = useState<Date | null>(null);

  // Sync initial network nodes from REST API
  useEffect(() => {
    if (network?.nodes) {
      setNodes(network.nodes);
    }
  }, [network]);

  // Subscribe to live public LoRa network events via WebSockets
  useEffect(() => {
    if (!socket) return;

    const joinPublicRoom = () => {
      socket.emit('subscribe:public-network', {}, (res: any) => {
        console.log('[LoRa Map] Joined public-network room:', res);
      });
    };

    if (socket.connected) {
      joinPublicRoom();
    }
    socket.on('connect', joinPublicRoom);

    // Listen to real-time sensor packets
    const onSensorData = (data: any) => {
      if (!data || !data.sensorId) return;

      const now = new Date();
      setLastPacketTime(now);

      const packetPayload = data.payload || {};
      const rssi = packetPayload.rssi;
      const snr = packetPayload.snr;
      const metrics = packetPayload.metrics || packetPayload;

      // Update node in state
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.id === data.sensorId) {
            const updated = {
              ...n,
              status: 'active' as const,
              rssi: typeof rssi === 'number' ? rssi : n.rssi,
              snr: typeof snr === 'number' ? snr : n.snr,
              lastSeen: now.toISOString(),
              latestTelemetry: { ...n.latestTelemetry, ...metrics },
            };
            // Also update selectedNode if it's the one receiving data
            setSelectedNode((curr) => (curr?.id === n.id ? updated : curr));
            return updated;
          }
          return n;
        })
      );

      // Append to live rolling packet log (keep last 12)
      setLivePackets((prev) => {
        const foundNode = nodes.find((n) => n.id === data.sensorId);
        const newEntry: LivePacketEntry = {
          id: `${data.sensorId}-${now.getTime()}`,
          sensorId: data.sensorId,
          sensorName: foundNode?.name || 'Nodo LoRa',
          rssi,
          snr,
          payload: metrics,
          receivedAt: now,
        };
        return [newEntry, ...prev.slice(0, 11)];
      });
    };

    socket.on('sensor:data', onSensorData);

    return () => {
      socket.off('connect', joinPublicRoom);
      socket.off('sensor:data', onSensorData);
      socket.emit('unsubscribe:public-network');
    };
  }, [socket, nodes]);

  const gateway = network?.gateway || {
    id: 'gateway-esp32-01',
    name: 'Gateway LoRa Base (ESP32 DevKit + Ra-02)',
    model: 'ESP32-WROOM-32 + SX1278',
    frequency: '433 MHz (Ra-02)',
    lat: 1.6144,
    lng: -75.6062,
    coverageRadiusMeters: 3500,
    status: 'online' as const,
    connectedNodesCount: nodes.length,
  };

  const activeNodesCount = nodes.filter((n) => n.status === 'active').length;
  const avgRssi =
    nodes.length > 0
      ? Math.round(nodes.reduce((acc, curr) => acc + curr.rssi, 0) / nodes.length)
      : -75;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1 flex flex-col">
        {/* Top Header & Metrics Bar */}
        <div className="border-b bg-card/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4">
          <div className="container mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-semibold border border-cyan-500/20">
                  <Radio className="h-3.5 w-3.5" />
                  <span>Red LoRa Local 433 MHz</span>
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span>{isConnected ? 'Telemetría en Vivo' : 'Reconectando WS...'}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                Topología de Red LoRa & Telemetría en Tiempo Real
              </h1>
              <p className="text-xs text-muted-foreground">
                Monitoreo geográfico de paquetes de radiofrecuencia (Ra-02 / SX1278) recibidos por el Gateway ESP32.
              </p>
            </div>

            {/* Quick KPI Indicators */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 rounded-lg bg-card border text-center min-w-[90px]">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Nodos</p>
                <p className="text-lg font-bold font-mono text-foreground">
                  <span className="text-emerald-500">{activeNodesCount}</span>
                  <span className="text-muted-foreground text-xs font-normal"> / {nodes.length}</span>
                </p>
              </div>

              <div className="px-3 py-2 rounded-lg bg-card border text-center min-w-[90px]">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">RSSI Prom.</p>
                <p className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400">
                  {avgRssi} <span className="text-[10px] font-normal">dBm</span>
                </p>
              </div>

              <div className="px-3 py-2 rounded-lg bg-card border text-center min-w-[90px]">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Frecuencia</p>
                <p className="text-lg font-bold font-mono text-foreground">
                  433 <span className="text-[10px] font-normal">MHz</span>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => mutate()}
                className="h-10 px-3 gap-1.5 text-xs"
                title="Actualizar datos del mapa"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Interactive Map & Side Inspector Grid */}
        <div className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
            {/* Map Area (8 Columns on desktop) */}
            <div className="lg:col-span-8 flex flex-col rounded-xl border overflow-hidden shadow-sm relative bg-card">
              {/* Map Floating Controls Header */}
              <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCoverage(!showCoverage)}
                  className="h-8 text-xs gap-1.5 shadow-md bg-card/90 backdrop-blur-md border"
                >
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>{showCoverage ? 'Ocultar Cobertura' : 'Ver Cobertura RF'}</span>
                </Button>
              </div>

              <div className="flex-1 w-full h-full">
                <LoraNetworkMap
                  gateway={gateway}
                  nodes={nodes}
                  selectedNodeId={selectedNode?.id}
                  onSelectNode={(node) => setSelectedNode(node)}
                  showCoverageAura={showCoverage}
                />
              </div>

              {/* Map Footnote Legend */}
              <div className="p-2.5 px-4 bg-card/90 border-t backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    Gateway Base (Ra-02)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Señal Fuerte (&gt; -85 dBm)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Señal Media (-85 a -105 dBm)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    Señal Débil (&lt; -105 dBm)
                  </span>
                </div>
                <span>Haz clic en cualquier nodo para ver telemetría</span>
              </div>
            </div>

            {/* Side Telemetry & Live Frame Inspector (4 Columns on desktop) */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
              {/* Node Inspector Card */}
              <Card className="border shadow-sm flex flex-col shrink-0">
                <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                      {selectedNode ? (
                        <>
                          <Radio className="h-4 w-4 text-cyan-500" />
                          <span>{selectedNode.name}</span>
                        </>
                      ) : (
                        <>
                          <Signal className="h-4 w-4 text-primary" />
                          <span>{gateway.name}</span>
                        </>
                      )}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {selectedNode ? `ID: ${selectedNode.id}` : `ID: ${gateway.id}`}
                    </p>
                  </div>

                  <Badge
                    variant={selectedNode?.status === 'active' || !selectedNode ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {selectedNode ? selectedNode.status : 'ONLINE'}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {selectedNode ? (
                    <>
                      {/* RF Signal Metrics */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-muted/40 border space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">Potencia RSSI</p>
                          <p className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                            {selectedNode.rssi} <span className="text-xs font-normal">dBm</span>
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-muted/40 border space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">Relación SNR</p>
                          <p className="text-base font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
                            {selectedNode.snr} <span className="text-xs font-normal">dB</span>
                          </p>
                        </div>
                      </div>

                      {/* LoRa Config Details */}
                      <div className="text-xs space-y-1.5 text-muted-foreground border-t pt-3">
                        <div className="flex justify-between">
                          <span>Spreading Factor:</span>
                          <strong className="font-mono text-foreground">
                            SF{selectedNode.loraConfig?.spreading_factor || 7}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Ancho de Banda:</span>
                          <strong className="font-mono text-foreground">
                            {selectedNode.loraConfig?.bandwidth || '125 kHz'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Radio Cobertura Teórico:</span>
                          <strong className="font-mono text-foreground">
                            {selectedNode.loraConfig?.coverage_radius_meters || 2000} m
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Última Comunicación:</span>
                          <strong className="text-foreground">
                            {format(new Date(selectedNode.lastSeen), 'HH:mm:ss', { locale: es })}
                          </strong>
                        </div>
                      </div>

                      {/* Latest Readings / Telemetry Payload */}
                      {selectedNode.latestTelemetry && Object.keys(selectedNode.latestTelemetry).length > 0 && (
                        <div className="border-t pt-3 space-y-2">
                          <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                            Telemetría Decodificada
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedNode.latestTelemetry).map(([key, val]) => (
                              <div
                                key={key}
                                className="p-2 rounded bg-card border text-[11px] font-mono flex flex-col justify-between"
                              >
                                <span className="text-muted-foreground text-[10px] capitalize">{key}:</span>
                                <span className="font-bold text-foreground">
                                  {typeof val === 'number' ? val.toFixed(2) : String(val)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedNode(null)}
                        className="w-full text-xs h-8"
                      >
                        Ver Información del Gateway
                      </Button>
                    </>
                  ) : (
                    /* Gateway Overview Details */
                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 space-y-1">
                        <p className="font-semibold text-xs flex items-center gap-1.5">
                          <Radio className="h-3.5 w-3.5" />
                          <span>Módulo SX1278 (Ra-02 433 MHz)</span>
                        </p>
                        <p className="text-[11px]">
                          El Gateway de borde recibe tramas LoRa inalámbricas, valida las credenciales y las retransmite por WebSocket y MQTT a la nube.
                        </p>
                      </div>

                      <div className="space-y-2 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Placa Base:</span>
                          <strong className="text-foreground">ESP32 DevKit V1</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Frecuencia Central:</span>
                          <strong className="font-mono text-foreground">433.000 MHz</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Radio Cobertura Máx:</span>
                          <strong className="font-mono text-foreground">{gateway.coverageRadiusMeters} m</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Ubicación GPS:</span>
                          <strong className="font-mono text-foreground">
                            {gateway.lat.toFixed(4)}, {gateway.lng.toFixed(4)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live Incoming Packet Stream Card */}
              <Card className="border shadow-sm flex-1 flex flex-col overflow-hidden">
                <CardHeader className="p-3 px-4 border-b flex flex-row items-center justify-between shrink-0">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Registro de Paquetes en Vivo</span>
                  </CardTitle>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {livePackets.length} tramas
                  </span>
                </CardHeader>

                <CardContent className="p-2 flex-1 overflow-y-auto space-y-1.5">
                  {livePackets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[11px] text-muted-foreground">
                      <Activity className="h-5 w-5 mb-1 text-muted-foreground/50 animate-pulse" />
                      <span>Esperando tramas LoRa entrantes...</span>
                    </div>
                  ) : (
                    livePackets.map((pkt) => (
                      <div
                        key={pkt.id}
                        className="p-2 rounded bg-muted/40 border text-[10px] font-mono space-y-1 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground truncate max-w-[140px]">
                            {pkt.sensorName}
                          </span>
                          <span className="text-muted-foreground text-[9px]">
                            {format(pkt.receivedAt, 'HH:mm:ss')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          {pkt.rssi && <span>RSSI: {pkt.rssi} dBm</span>}
                          {pkt.snr && <span>SNR: {pkt.snr} dB</span>}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
