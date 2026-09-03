'use client';

import React from 'react';
import { DashboardWidget, SensorData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Cpu, Activity, Clock, Layers, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface MetaverseRegionWidgetProps {
  widget: DashboardWidget;
  latestReading?: SensorData;
}

export function MetaverseRegionWidget({ widget, latestReading }: MetaverseRegionWidgetProps) {
  const reading = latestReading || widget.latestReading;
  const payload = (reading?.payload as Record<string, unknown>) || {};

  // Extract Metaverse Region Metrics
  const regionName = (payload.region_name as string) || widget.title || 'Isla OpenSim';
  const fps = typeof payload.fps === 'number' ? payload.fps : typeof payload.sim_fps === 'number' ? payload.sim_fps : null;
  const physicsFps = typeof payload.physics_fps === 'number' ? payload.physics_fps : null;
  const avatars = typeof payload.active_avatars === 'number' ? payload.active_avatars : typeof payload.avatars === 'number' ? payload.avatars : 0;
  const prims = typeof payload.total_prims === 'number' ? payload.total_prims : typeof payload.prims === 'number' ? payload.prims : null;
  const memoryMb = typeof payload.memory_mb === 'number' ? payload.memory_mb : null;
  const eventType = (payload.type as string) || (payload.event as string) || 'telemetría';
  const avatarName = (payload.avatar_name as string) || null;

  // Status color based on FPS
  const getFpsColor = (val: number | null) => {
    if (val === null) return 'text-muted-foreground';
    if (val >= 45) return 'text-emerald-400';
    if (val >= 30) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <Card className="h-full flex flex-col justify-between border border-border/70 shadow-sm bg-card/90 backdrop-blur-sm overflow-hidden group hover:border-purple-500/40 transition-colors">
      {/* Header */}
      <CardHeader className="p-3 pb-2 border-b border-border/40 bg-purple-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="p-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-xs font-bold tracking-tight truncate text-foreground">
              {regionName}
            </CardTitle>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            OpenSim 3D
          </span>
        </div>
      </CardHeader>

      {/* Main Content */}
      <CardContent className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Sim FPS */}
          <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Sim FPS</span>
              <Activity className="h-3 w-3 opacity-60" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-xl font-extrabold font-mono ${getFpsColor(fps)}`}>
                {fps !== null ? fps.toFixed(1) : '55.0'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">/ 55</span>
            </div>
          </div>

          {/* Active Avatars */}
          <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Avatares Online</span>
              <Users className="h-3 w-3 opacity-60 text-teal-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold font-mono text-teal-400">
                {avatars}
              </span>
              <span className="text-[10px] text-muted-foreground">en mundo</span>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          {physicsFps !== null && (
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-background/50 border border-border/30">
              <span className="text-muted-foreground text-[10px]">Physics FPS:</span>
              <span className="font-semibold text-foreground">{physicsFps.toFixed(1)}</span>
            </div>
          )}
          {prims !== null && (
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-background/50 border border-border/30">
              <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                <Layers className="h-2.5 w-2.5" /> Prims:
              </span>
              <span className="font-semibold text-foreground">{prims}</span>
            </div>
          )}
          {memoryMb !== null && (
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-background/50 border border-border/30">
              <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                <Cpu className="h-2.5 w-2.5" /> RAM:
              </span>
              <span className="font-semibold text-foreground">{memoryMb} MB</span>
            </div>
          )}
          {avatarName && (
            <div className="col-span-2 flex items-center justify-between p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px]">
              <span className="text-purple-300 font-semibold truncate">Avatar: {avatarName}</span>
              <span className="text-[9px] uppercase text-purple-400">{eventType}</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        {reading && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/30">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(reading.recordedAt), 'HH:mm:ss')}</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-purple-500/10 text-purple-400">
              Metaverso UDLA
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
