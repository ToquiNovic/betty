'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { PlanoInclinadoVisualizer } from '@/components/projects/plano-inclinado/plano-inclinado-visualizer';
import { RielNewtonVisualizer } from '@/components/projects/riel-newton/riel-newton-visualizer';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box, Activity, Gauge } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export default function DigitalTwinPage() {
  const [selectedProject, setSelectedProject] = useState<'plano' | 'riel'>('plano');

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          selectedProject === 'plano'
            ? 'Gemelo Digital del Plano Inclinado'
            : 'Gemelo Digital del Riel de Newton'
        }
        subtitle={
          selectedProject === 'plano'
            ? 'Monitoreo de telemetría física en tiempo real, cinemática de servomotores y experimentación de fricción'
            : 'Telemetría de alta velocidad por fotocompuertas, control de eyección y cálculo de la Segunda Ley de Newton'
        }
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Gemelo Digital */}
          <Tabs
            value={selectedProject}
            onValueChange={(val) => setSelectedProject(val as 'plano' | 'riel')}
          >
            <TabsList className="bg-muted/70 p-1 border">
              <TabsTrigger value="plano" className="text-xs font-semibold gap-1.5 h-8">
                <Activity className="h-3.5 w-3.5 text-sky-400" />
                <span>Plano Inclinado</span>
              </TabsTrigger>
              <TabsTrigger value="riel" className="text-xs font-semibold gap-1.5 h-8">
                <Gauge className="h-3.5 w-3.5 text-emerald-400" />
                <span>Riel de Newton</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button render={<Link href="/projects" />} variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Box className="h-3.5 w-3.5" />
            <span>Ver Proyectos IoT</span>
          </Button>
        </div>
      </PageHeader>

      {/* Visualizador interactivo según proyecto seleccionado */}
      {selectedProject === 'plano' ? (
        <PlanoInclinadoVisualizer />
      ) : (
        <RielNewtonVisualizer />
      )}
    </div>
  );
}
