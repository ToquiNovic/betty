'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePublicDashboards } from '@/lib/api/dashboards';
import { useProjects } from '@/lib/api/projects';
import { LandingHeader } from '@/components/landing/landing-header';
import { LandingFooter } from '@/components/landing/landing-footer';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { ProjectCard } from '@/components/projects/project-card';
import { CardGridSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Globe, Search, Box, LineChart, Activity, Sparkles, Radio, ArrowRight, MapPin, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

export default function ExploreGalleryPage() {
  const common = useTranslations('common');
  const [activeTab, setActiveTab] = useState<'dashboards' | 'projects' | 'lora'>('projects');
  const [search, setSearch] = useState('');

  const { dashboards, isLoading: isDashboardsLoading } = usePublicDashboards();
  const { projects, isLoading: isProjectsLoading } = useProjects({ search });

  const filteredDashboards = dashboards.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Globe className="h-3.5 w-3.5" />
            <span>Galería Pública & Open Source</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Explora Gemelos Digitales & Proyectos
          </h1>
          <p className="text-sm text-muted-foreground">
            Descubre tableros de telemetría en tiempo real y proyectos IoT guiados con gemelos
            digitales interactivos y firmware instalable.
          </p>
        </div>

        {/* Search Bar & Tabs Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`${common('search')}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs bg-card"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'dashboards' | 'projects' | 'lora')}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 w-full sm:w-[420px]">
              <TabsTrigger value="projects" className="gap-1.5 text-xs font-semibold">
                <Box className="h-3.5 w-3.5 text-sky-500" />
                <span>Proyectos IoT</span>
              </TabsTrigger>
              <TabsTrigger value="dashboards" className="gap-1.5 text-xs font-semibold">
                <LineChart className="h-3.5 w-3.5 text-primary" />
                <span>Dashboards</span>
              </TabsTrigger>
              <TabsTrigger value="lora" className="gap-1.5 text-xs font-semibold">
                <Radio className="h-3.5 w-3.5 text-cyan-500" />
                <span>Red LoRa</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          {/* 1. Replicable Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            {isProjectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-[340px] rounded-xl border bg-muted/20 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={Box}
                title="No se encontraron proyectos"
                description="Intenta buscar con otros términos o limpia el filtro de búsqueda."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* 2. Public Dashboards Tab */}
          <TabsContent value="dashboards" className="space-y-6">
            {isDashboardsLoading ? (
              <CardGridSkeleton count={6} />
            ) : filteredDashboards.length === 0 ? (
              <EmptyState
                icon={Globe}
                title="No hay tableros públicos disponibles"
                description="Cuando los usuarios publiquen dashboards, aparecerán listados aquí."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDashboards.map((dash) => (
                  <DashboardCard key={dash.id} dashboard={dash} isPublicView />
                ))}
              </div>
            )}
          </TabsContent>

          {/* 3. LoRa Network Map Tab */}
          <TabsContent value="lora" className="space-y-6">
            <div className="rounded-2xl border bg-gradient-to-br from-card via-card to-cyan-500/5 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold border border-cyan-500/20">
                    <Radio className="h-3.5 w-3.5" />
                    <span>Red Inalámbrica LoRa 433 MHz / Ra-02</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Mapa de Cobertura y Topología en Tiempo Real
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Visualiza la ubicación geográfica del Gateway ESP32, los nodos de campo Heltec/SX1278, la intensidad de señal (RSSI/SNR), radios de cobertura por Spreading Factor y recepción de telemetría en vivo vía WebSockets.
                  </p>
                </div>

                <Button
                  render={<Link href="/explore/map" />}
                  size="lg"
                  className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md shrink-0"
                >
                  <Signal className="h-4 w-4" />
                  <span>Abrir Mapa en Pantalla Completa</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border bg-background/60 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Banda de Frecuencia</p>
                  <p className="text-xl font-bold font-mono text-foreground">433.000 MHz</p>
                  <p className="text-[11px] text-muted-foreground">Módulos Semtech SX1278 / Ra-02</p>
                </div>

                <div className="p-4 rounded-xl border bg-background/60 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Spreading Factor</p>
                  <p className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">SF7 a SF12</p>
                  <p className="text-[11px] text-muted-foreground">Alcance desde 1.5 km hasta 7.0 km</p>
                </div>

                <div className="p-4 rounded-xl border bg-background/60 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Ingesta y Puente</p>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">HTTPS + WS</p>
                  <p className="text-[11px] text-muted-foreground">FreeRTOS Async Bridge hacia TimescaleDB</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <LandingFooter />
    </div>
  );
}
