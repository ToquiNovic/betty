'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box } from 'lucide-react';
import { Model3DFormat } from '@/types/project';

const ModelViewerDynamic = dynamic(
  () => import('./model-viewer-inner').then((mod) => mod.ModelViewerInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[480px] w-full rounded-xl border bg-muted/20 text-muted-foreground gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs font-semibold">Inicializando visor 3D...</span>
      </div>
    ),
  },
);

interface ProjectModelViewerProps {
  modelUrl?: string | null;
  format?: Model3DFormat | null;
}

export function ProjectModelViewer({ modelUrl, format }: ProjectModelViewerProps) {
  if (!modelUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-muted/20 text-muted-foreground">
        <Box className="h-12 w-12 mb-3 opacity-40 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Sin modelo 3D</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Este proyecto no tiene un modelo 3D adjunto actualmente.
        </p>
      </div>
    );
  }

  return <ModelViewerDynamic modelUrl={modelUrl} format={format} />;
}
