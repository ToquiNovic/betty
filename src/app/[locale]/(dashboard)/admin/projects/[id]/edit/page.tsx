'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/lib/api/projects';
import { ProjectForm } from '@/components/admin/projects/project-form';
import { StepEditor } from '@/components/admin/projects/step-editor';
import { MaterialEditor } from '@/components/admin/projects/material-editor';
import { Model3DUploader } from '@/components/admin/projects/model3d-uploader';
import { FirmwareUploader } from '@/components/admin/projects/firmware-uploader';
import { PageHeader } from '@/components/common/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import {
  ArrowLeft,
  Sparkles,
  Layers,
  Wrench,
  Box,
  Zap,
  Eye,
} from 'lucide-react';

export default function EditProjectPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const { project, isLoading, mutate } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-16 text-center space-y-4 max-w-4xl mx-auto border rounded-xl bg-card">
        <p className="text-muted-foreground text-sm">Proyecto no encontrado</p>
        <Button render={<Link href="/admin/projects" />} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Volver al listado</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/admin/projects" />}
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {project.title}
              </h1>
              <Badge variant={project.isPublished ? 'default' : 'secondary'} className="text-[10px]">
                {project.isPublished ? 'Publicado' : 'Borrador'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Edita los detalles, pasos, lista de materiales, modelo 3D y binarios de firmware.
            </p>
          </div>
        </div>

        <Button
          render={<Link href={`/projects/${project.id}`} />}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 self-start sm:self-auto font-semibold"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Ver como Usuario</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Información</span>
          </TabsTrigger>

          <TabsTrigger value="steps" className="gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" />
            <span>Pasos ({project.steps?.length || 0})</span>
          </TabsTrigger>

          <TabsTrigger value="materials" className="gap-1.5 text-xs">
            <Wrench className="h-3.5 w-3.5" />
            <span>Materiales ({project.materials?.length || 0})</span>
          </TabsTrigger>

          <TabsTrigger value="model3d" className="gap-1.5 text-xs">
            <Box className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Modelo 3D</span>
          </TabsTrigger>

          <TabsTrigger value="firmware" className="gap-1.5 text-xs">
            <Zap className="h-3.5 w-3.5" />
            <span>Firmware ({project.firmware?.length || 0})</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. General Info */}
        <TabsContent value="info" className="space-y-4">
          <ProjectForm initialData={project} onSuccess={mutate} />
        </TabsContent>

        {/* 2. Steps Editor */}
        <TabsContent value="steps" className="space-y-4">
          <StepEditor
            projectId={project.id}
            steps={project.steps || []}
            onRefresh={mutate}
          />
        </TabsContent>

        {/* 3. Materials Editor */}
        <TabsContent value="materials" className="space-y-4">
          <MaterialEditor
            projectId={project.id}
            materials={project.materials || []}
            onRefresh={mutate}
          />
        </TabsContent>

        {/* 4. 3D Model Uploader */}
        <TabsContent value="model3d" className="space-y-4">
          <Model3DUploader
            projectId={project.id}
            modelUrl={project.model3dUrl}
            modelFormat={project.model3dFormat}
            onRefresh={mutate}
          />
        </TabsContent>

        {/* 5. Firmware Uploader */}
        <TabsContent value="firmware" className="space-y-4">
          <FirmwareUploader
            projectId={project.id}
            firmwares={project.firmware || []}
            onRefresh={mutate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
