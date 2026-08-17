'use client';

import React, { useState } from 'react';
import { Project } from '@/types/project';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DifficultyBadge } from '@/components/projects/difficulty-badge';
import { Link } from '@/i18n/routing';
import {
  Edit,
  Trash2,
  Eye,
  Plus,
  Box,
  Zap,
  Layers,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { deleteProject, toggleProjectPublish } from '@/lib/api/projects';
import { toast } from '@/lib/toast';

interface ProjectAdminTableProps {
  projects: Project[];
  onRefresh: () => void;
}

export function ProjectAdminTable({ projects, onRefresh }: ProjectAdminTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleTogglePublish = async (project: Project) => {
    try {
      setLoadingId(project.id);
      await toggleProjectPublish(project.id, !project.isPublished);
      toast.success(
        project.isPublished
          ? 'Proyecto despublicado (ahora es borrador)'
          : '¡Proyecto publicado exitosamente!',
      );
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al cambiar visibilidad');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`¿Estás seguro de eliminar el proyecto "${project.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setLoadingId(project.id);
      await deleteProject(project.id);
      toast.success('Proyecto eliminado exitosamente');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar proyecto');
    } finally {
      setLoadingId(null);
    }
  };

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card">
        <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-bold text-foreground">No hay proyectos creados</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Crea el primer proyecto guiado con pasos, materiales, firmware y modelo 3D para la comunidad.
        </p>
        <Button
          render={<Link href="/admin/projects/new" />}
          className="mt-4 gap-1.5 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Crear Primer Proyecto</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[300px] text-xs font-semibold">Proyecto</TableHead>
            <TableHead className="text-xs font-semibold">Dificultad</TableHead>
            <TableHead className="text-xs font-semibold">Placa</TableHead>
            <TableHead className="text-xs font-semibold">Recursos</TableHead>
            <TableHead className="text-xs font-semibold text-center">Publicado</TableHead>
            <TableHead className="text-xs font-semibold text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.id} className="hover:bg-muted/30">
              {/* Project Info */}
              <TableCell className="py-3">
                <div className="flex items-center gap-3">
                  {p.coverImageUrl ? (
                    <img
                      src={p.coverImageUrl}
                      alt={p.title}
                      className="h-10 w-14 object-cover rounded-md border shrink-0 bg-muted"
                    />
                  ) : (
                    <div className="h-10 w-14 rounded-md border bg-muted/60 flex items-center justify-center shrink-0 text-muted-foreground">
                      <Sparkles className="h-4 w-4 opacity-40" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-foreground line-clamp-1">{p.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                  </div>
                </div>
              </TableCell>

              {/* Difficulty */}
              <TableCell className="py-3">
                <DifficultyBadge difficulty={p.difficulty} />
              </TableCell>

              {/* Board */}
              <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono text-[11px]">
                  {p.boardType}
                </Badge>
              </TableCell>

              {/* Resources Badges */}
              <TableCell className="py-3">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] gap-1 font-normal" title="Pasos">
                    <Layers className="h-3 w-3 text-muted-foreground" />
                    <span>{p.stepsCount || 0}</span>
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] gap-1 font-normal" title="Materiales">
                    <Wrench className="h-3 w-3 text-muted-foreground" />
                    <span>{p.materialsCount || 0}</span>
                  </Badge>
                  {p.has3DModel && (
                    <Badge variant="secondary" className="text-[10px] gap-1 text-primary font-medium" title="Modelo 3D">
                      <Box className="h-3 w-3" />
                      <span>3D</span>
                    </Badge>
                  )}
                  {p.hasFirmware && (
                    <Badge variant="secondary" className="text-[10px] gap-1 text-emerald-500 font-medium" title="Firmware">
                      <Zap className="h-3 w-3" />
                      <span>FW</span>
                    </Badge>
                  )}
                </div>
              </TableCell>

              {/* Published Switch */}
              <TableCell className="text-center py-3">
                <div className="flex items-center justify-center gap-2">
                  <Switch
                    checked={p.isPublished}
                    onCheckedChange={() => handleTogglePublish(p)}
                    disabled={loadingId === p.id}
                  />
                  <span className={`text-[11px] font-semibold ${p.isPublished ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {p.isPublished ? 'Público' : 'Borrador'}
                  </span>
                </div>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    render={<Link href={`/projects/${p.id}`} />}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Vista previa"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    render={<Link href={`/admin/projects/${p.id}/edit`} />}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Editar proyecto"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(p)}
                    disabled={loadingId === p.id}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
