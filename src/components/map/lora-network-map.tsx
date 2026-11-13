'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { LoraMapInnerProps } from './lora-map-inner';
import { Loader2, Radio } from 'lucide-react';

const DynamicLoraMapInner = dynamic(() => import('./lora-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[500px] w-full rounded-xl border bg-muted/20 flex flex-col items-center justify-center gap-3">
      <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-500 animate-pulse">
        <Radio className="h-7 w-7 animate-spin" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">
        Inicializando visor de mapa geográfico y telemetría LoRa...
      </p>
    </div>
  ),
});

export function LoraNetworkMap(props: LoraMapInnerProps) {
  return <DynamicLoraMapInner {...props} />;
}
