'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ThumbnailDynamic = dynamic(
  () =>
    import('./project-model-thumbnail-inner').then(
      (mod) => mod.ProjectModelThumbnailInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent opacity-60" />
      </div>
    ),
  },
);

interface ProjectModelThumbnailProps {
  modelUrl?: string | null;
  interactive?: boolean;
  className?: string;
  cameraPosition?: [number, number, number];
}

export function ProjectModelThumbnail({
  modelUrl,
  interactive = false,
  className = '',
  cameraPosition,
}: ProjectModelThumbnailProps) {
  if (!modelUrl) return null;

  return (
    <div className={`h-full w-full ${className}`}>
      <ThumbnailDynamic
        modelUrl={modelUrl}
        interactive={interactive}
        cameraPosition={cameraPosition}
      />
    </div>
  );
}
