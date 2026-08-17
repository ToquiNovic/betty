'use client';

import React, { useState } from 'react';
import { ProjectStep } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Video,
  Layers,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  addProjectStep,
  updateProjectStep,
  deleteProjectStep,
  reorderProjectSteps,
} from '@/lib/api/projects';
import { toast } from '@/lib/toast';

interface StepEditorProps {
  projectId: string;
  steps: ProjectStep[];
  onRefresh: () => void;
}

export function StepEditor({ projectId, steps, onRefresh }: StepEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProjectStep | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setEditingStep(null);
    setTitle('');
    setContent('');
    setVideoUrl('');
    setImageFile(null);
    setIsOpen(true);
  };

  const openEdit = (step: ProjectStep) => {
    setEditingStep(step);
    setTitle(step.title);
    setContent(step.content);
    setVideoUrl(step.videoUrl || '');
    setImageFile(null);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('El título y contenido del paso son requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      if (videoUrl.trim()) formData.append('videoUrl', videoUrl.trim());
      if (imageFile) formData.append('image', imageFile);

      if (editingStep) {
        await updateProjectStep(projectId, editingStep.id, formData);
        toast.success('Paso actualizado con éxito');
      } else {
        await addProjectStep(projectId, formData);
        toast.success('Paso añadido con éxito');
      }

      setIsOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar el paso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (stepId: string) => {
    if (!confirm('¿Eliminar este paso del proyecto?')) return;
    try {
      await deleteProjectStep(projectId, stepId);
      toast.success('Paso eliminado');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el paso');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newSteps = [...sortedSteps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSteps.length) return;

    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIdx];
    newSteps[targetIdx] = temp;

    try {
      await reorderProjectSteps(
        projectId,
        newSteps.map((s) => s.id),
      );
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al reordenar');
    }
  };

  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Pasos Guiados ({steps.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Instrucciones ordenadas con imágenes y explicaciones para replicar el proyecto
          </p>
        </div>

        <Button onClick={openCreate} size="sm" className="gap-1.5 text-xs font-semibold">
          <Plus className="h-4 w-4" />
          <span>Añadir Paso</span>
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-muted/20 text-muted-foreground">
          <Layers className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-xs font-medium">Aún no hay pasos en este proyecto.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSteps.map((step, idx) => (
            <Card key={step.id} className="border shadow-xs bg-card">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  {step.imageUrl && (
                    <img
                      src={step.imageUrl}
                      alt={step.title}
                      className="h-14 w-20 object-cover rounded border shrink-0 bg-muted"
                    />
                  )}

                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-sm text-foreground">{step.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">
                      {step.content}
                    </div>
                  </div>
                </div>

                {/* Reorder and action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="h-7 w-7 text-muted-foreground"
                    title="Mover arriba"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === sortedSteps.length - 1}
                    className="h-7 w-7 text-muted-foreground"
                    title="Mover abajo"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(step)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Editar"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(step.id)}
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingStep ? 'Editar Paso del Proyecto' : 'Nuevo Paso del Proyecto'}
              </DialogTitle>
              <DialogDescription>
                Describe detalladamente la acción que debe realizar el usuario.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Título del Paso *</label>
                <Input
                  placeholder="Ej: Conectar el sensor DHT22 a los pines GPIO"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Instrucciones / Contenido *</label>
                <Textarea
                  placeholder="Instrucciones paso a paso. Puedes incluir saltos de línea y explicaciones..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  Imagen del Paso (Opcional)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="h-9 text-xs file:mr-2 file:text-xs"
                />
                {editingStep?.imageUrl && !imageFile && (
                  <span className="text-[11px] text-muted-foreground block">
                    Imagen actual asignada. Selecciona una nueva si deseas reemplazarla.
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-primary" />
                  Enlace a Video (Opcional)
                </label>
                <Input
                  placeholder="https://youtube.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : editingStep ? 'Actualizar Paso' : 'Añadir Paso'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
