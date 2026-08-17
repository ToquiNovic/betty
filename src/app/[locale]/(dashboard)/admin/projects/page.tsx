'use client';

import React from 'react';
import { useAdminProjects } from '@/lib/api/projects';
import { ProjectAdminTable } from '@/components/admin/projects/project-admin-table';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Plus, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProjectsPage() {
  const { projects, isLoading, mutate } = useAdminProjects();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Proyectos Replicables"
        subtitle="Administra el catálogo de proyectos guiados, pasos de ensamblaje, materiales, modelos 3D y binarios de firmware."
      >
        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/projects" />}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Ver Galería</span>
          </Button>

          <Button
            render={<Link href="/admin/projects/new" />}
            size="sm"
            className="gap-1.5 text-xs h-8 font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Proyecto</span>
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <ProjectAdminTable projects={projects} onRefresh={mutate} />
      )}
    </div>
  );
}
