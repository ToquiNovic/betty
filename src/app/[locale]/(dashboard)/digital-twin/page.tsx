'use client';

import React from 'react';
import { PageHeader } from '@/components/common/page-header';
import { PlanoInclinadoVisualizer } from '@/components/projects/plano-inclinado/plano-inclinado-visualizer';
import { Sparkles, Layers, Box } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export default function DigitalTwinPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gemelo Digital del Plano Inclinado"
        subtitle="Monitoreo de telemetría física en tiempo real, cinemática de servomotores y experimentación de fricción"
      >
        <div className="flex items-center gap-2">
          <Button render={<Link href="/projects" />} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Box className="h-3.5 w-3.5" />
            <span>Ver Proyectos IoT</span>
          </Button>
        </div>
      </PageHeader>

      {/* Visualizador interactivo completo */}
      <PlanoInclinadoVisualizer />
    </div>
  );
}
