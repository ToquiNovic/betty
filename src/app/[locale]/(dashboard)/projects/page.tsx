'use client';

import React, { useState, useMemo } from 'react';
import { useProjects } from '@/lib/api/projects';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectFiltersBar } from '@/components/projects/project-filters';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';
import { ProjectFilters } from '@/types/project';
import { Sparkles, Plus, Settings } from 'lucide-react';

export default function ProjectsGalleryPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [filters, setFilters] = useState<ProjectFilters>({
    difficulty: 'all',
    search: '',
  });

  const { projects, isLoading } = useProjects(filters);

  // Extract all unique tags across projects for the filter pills
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      p.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [projects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proyectos Replicables"
        subtitle="Explora proyectos IoT y Gemelos Digitales de código abierto con guías paso a paso, materiales, modelos 3D y firmware instalable."
      >
        {isAdmin && (
          <Button
            render={<Link href="/admin/projects" />}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold"
          >
            <Settings className="h-4 w-4" />
            <span>Gestionar Proyectos</span>
          </Button>
        )}
      </PageHeader>

      {/* Filters Bar */}
      <ProjectFiltersBar
        filters={filters}
        onChange={setFilters}
        availableTags={availableTags}
      />

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[340px] rounded-xl border bg-muted/20 animate-pulse"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border rounded-2xl bg-card space-y-3">
          <Sparkles className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-base font-bold text-foreground">No se encontraron proyectos</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {filters.search || filters.tag || (filters.difficulty && filters.difficulty !== 'all')
              ? 'Prueba modificando o limpiando los filtros de búsqueda.'
              : 'Pronto se publicarán nuevos proyectos IoT guiados para la comunidad.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
