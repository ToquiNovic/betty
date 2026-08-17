'use client';

import React from 'react';
import { Project } from '@/types/project';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DifficultyBadge } from './difficulty-badge';
import { Link } from '@/i18n/routing';
import {
  ArrowRight,
  Cpu,
  Clock,
  Box,
  Layers,
  Sparkles,
  Wrench,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const timeFormatted = project.estimatedTime
    ? `${project.estimatedTime.value} ${project.estimatedTime.unit === 'hours' ? 'horas' : 'min'}`
    : null;

  return (
    <Card className="flex flex-col justify-between overflow-hidden border shadow-sm hover:shadow-md hover:border-primary/40 transition-all group bg-card">
      {/* Cover Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
        {project.coverImageUrl ? (
          <img
            src={project.coverImageUrl}
            alt={project.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-muted text-muted-foreground/60">
            <Cpu className="h-12 w-12 stroke-1 group-hover:scale-110 transition-transform text-primary/40" />
          </div>
        )}

        {/* Badges on Cover */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <DifficultyBadge difficulty={project.difficulty} />
          <Badge variant="secondary" className="backdrop-blur-md bg-background/80 font-mono text-[11px] gap-1">
            <Cpu className="h-3 w-3 text-primary" />
            <span>{project.boardType}</span>
          </Badge>
        </div>

        {/* 3D Model / Firmware badges */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {project.has3DModel && (
            <Badge
              variant="outline"
              className="backdrop-blur-md bg-background/90 text-[10px] font-semibold gap-1 text-primary border-primary/30"
              title="Incluye modelo 3D"
            >
              <Box className="h-3 w-3" />
              <span>3D</span>
            </Badge>
          )}
          {project.hasFirmware && (
            <Badge
              variant="outline"
              className="backdrop-blur-md bg-background/90 text-[10px] font-semibold gap-1 text-emerald-500 border-emerald-500/30"
              title="Firmware instalable"
            >
              <Sparkles className="h-3 w-3" />
              <span>Firmware</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Card Header & Content */}
      <div className="flex flex-col flex-1">
        <CardHeader className="p-4 pb-2 space-y-1.5">
          <CardTitle className="text-base font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {project.title}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-2 min-h-[32px] text-muted-foreground">
            {project.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-end">
          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                >
                  #{tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Metadata counts */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-muted/50">
            <div className="flex items-center gap-3">
              {project.stepsCount !== undefined && (
                <div className="flex items-center gap-1" title="Pasos guiados">
                  <Layers className="h-3 w-3" />
                  <span>{project.stepsCount} pasos</span>
                </div>
              )}
              {project.materialsCount !== undefined && (
                <div className="flex items-center gap-1" title="Materiales requeridos">
                  <Wrench className="h-3 w-3" />
                  <span>{project.materialsCount} mat.</span>
                </div>
              )}
            </div>

            {timeFormatted && (
              <div className="flex items-center gap-1" title="Tiempo estimado">
                <Clock className="h-3 w-3" />
                <span>~{timeFormatted}</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Card Footer */}
      <CardFooter className="p-4 pt-0 border-t bg-muted/10 flex justify-between items-center py-2.5">
        <span className="text-[11px] text-muted-foreground">
          {project.creatorName ? `Por ${project.creatorName}` : 'Oficial Betty'}
        </span>

        <Button
          render={<Link href={`/projects/${project.id}`} />}
          size="sm"
          className="gap-1.5 text-xs font-semibold"
        >
          <span>Ver Proyecto</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
