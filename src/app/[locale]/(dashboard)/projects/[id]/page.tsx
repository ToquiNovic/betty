'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/lib/api/projects';
import { useAuthStore } from '@/stores/auth-store';
import { DifficultyBadge } from '@/components/projects/difficulty-badge';
import { ProjectStepsList } from '@/components/projects/project-steps';
import { ProjectMaterialsTable } from '@/components/projects/project-materials';
import { ProjectModelViewer } from '@/components/projects/project-model-viewer';
import { FirmwareFlasher } from '@/components/projects/firmware-flasher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import { PlanoInclinadoVisualizer } from '@/components/projects/plano-inclinado/plano-inclinado-visualizer';
import {
  ArrowLeft,
  Cpu,
  Clock,
  Layers,
  Wrench,
  Box,
  Zap,
  Edit,
  Sparkles,
  Share2,
  Calendar,
  Activity,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const { project, isLoading } = useProject(projectId);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('¡Enlace del proyecto copiado al portapapeles!');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-16 text-center space-y-4 border rounded-2xl bg-card">
        <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <h3 className="text-base font-bold text-foreground">Proyecto no encontrado</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          El proyecto que buscas no existe o ha sido despublicado.
        </p>
        <Button render={<Link href="/projects" />} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Volver a la galería</span>
        </Button>
      </div>
    );
  }

  const timeFormatted = project.estimatedTime
    ? `${project.estimatedTime.value} ${project.estimatedTime.unit === 'hours' ? 'horas' : 'minutos'}`
    : null;

  const dateFormatted = project.createdAt
    ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: es })
    : '';

  return (
    <div className="space-y-6">
      {/* Top Bar with Back and Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button
          render={<Link href="/projects" />}
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Galería de Proyectos</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-xs h-8"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Compartir</span>
          </Button>

          {isAdmin && (
            <Button
              render={<Link href={`/admin/projects/${project.id}/edit`} />}
              size="sm"
              className="gap-1.5 text-xs h-8 font-semibold"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Editar Proyecto</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <div className="flex flex-col md:flex-row">
          {/* Cover / Image */}
          <div className="relative md:w-2/5 aspect-video md:aspect-auto overflow-hidden bg-muted/60 min-h-[220px]">
            {project.coverImageUrl ? (
              <img
                src={project.coverImageUrl}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted to-muted text-primary/40">
                <Cpu className="h-16 w-16 stroke-1" />
              </div>
            )}
          </div>

          {/* Details & Specs */}
          <div className="p-5 sm:p-6 md:w-3/5 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              {/* Badges strip */}
              <div className="flex flex-wrap items-center gap-2">
                <DifficultyBadge difficulty={project.difficulty} />
                <Badge variant="secondary" className="font-mono text-xs gap-1">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  <span>{project.boardType}</span>
                </Badge>
                {timeFormatted && (
                  <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>~{timeFormatted}</span>
                  </Badge>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {project.title}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.description}
              </p>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Author info footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
              <span>{project.creatorName ? `Creado por ${project.creatorName}` : 'Oficial Betty PaaS'}</span>
              {dateFormatted && (
                <span className="flex items-center gap-1 text-[11px]" suppressHydrationWarning>
                  <Calendar className="h-3 w-3" />
                  <span suppressHydrationWarning>Publicado {dateFormatted}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Tabs Container */}
      {(() => {
        const hasDigitalTwin =
          project.hasDigitalTwin ||
          project.id === 'plano-inclinado' ||
          project.slug === 'plano-inclinado-esp32';

        return (
          <Tabs defaultValue={hasDigitalTwin ? 'digital-twin' : 'steps'} className="space-y-6">
            <TabsList className={`grid w-full ${hasDigitalTwin ? 'grid-cols-5 max-w-2xl' : 'grid-cols-4 max-w-xl'}`}>
              {hasDigitalTwin && (
                <TabsTrigger value="digital-twin" className="gap-1.5 text-xs font-semibold text-sky-500 data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-400">
                  <Activity className="h-3.5 w-3.5 animate-pulse text-sky-500" />
                  <span>Gemelo Digital</span>
                </TabsTrigger>
              )}

              <TabsTrigger value="steps" className="gap-1.5 text-xs">
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pasos</span> ({project.steps?.length || 0})
              </TabsTrigger>

              <TabsTrigger value="materials" className="gap-1.5 text-xs">
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Materiales</span> ({project.materials?.length || 0})
              </TabsTrigger>

              <TabsTrigger value="model3d" className="gap-1.5 text-xs">
                <Box className="h-3.5 w-3.5" />
                <span>Modelo 3D</span>
              </TabsTrigger>

              <TabsTrigger value="firmware" className="gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold text-foreground">Firmware</span>
              </TabsTrigger>
            </TabsList>

            {/* 0. Digital Twin Tab (If Available) */}
            {hasDigitalTwin && (
              <TabsContent value="digital-twin" className="space-y-4">
                <PlanoInclinadoVisualizer />
              </TabsContent>
            )}

            {/* 1. Steps Tab */}
            <TabsContent value="steps" className="space-y-4">
              <ProjectStepsList steps={project.steps || []} />
            </TabsContent>

            {/* 2. Materials Tab */}
            <TabsContent value="materials" className="space-y-4">
              <ProjectMaterialsTable materials={project.materials || []} />
            </TabsContent>

            {/* 3. 3D Model Tab */}
            <TabsContent value="model3d" className="space-y-4">
              <ProjectModelViewer
                modelUrl={project.model3dUrl}
                format={project.model3dFormat}
              />
            </TabsContent>

            {/* 4. Firmware Flashing Tab */}
            <TabsContent value="firmware" className="space-y-4">
              <FirmwareFlasher
                firmwares={project.firmware || []}
                boardType={project.boardType}
              />
            </TabsContent>
          </Tabs>
        );
      })()}
    </div>
  );
}
