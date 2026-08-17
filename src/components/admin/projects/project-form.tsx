'use client';

import React, { useState } from 'react';
import { Project, ProjectDifficulty } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Image as ImageIcon, Sparkles, Cpu, Clock, Tag } from 'lucide-react';
import { createProject, updateProject } from '@/lib/api/projects';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';

interface ProjectFormProps {
  initialData?: Project | null;
  onSuccess?: (project: Project) => void;
}

export function ProjectForm({ initialData, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>(
    initialData?.difficulty || 'beginner',
  );
  const [boardType, setBoardType] = useState(initialData?.boardType || 'ESP32');
  const [timeValue, setTimeValue] = useState(initialData?.estimatedTime?.value || 60);
  const [timeUnit, setTimeUnit] = useState(initialData?.estimatedTime?.unit || 'minutes');
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.coverImageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Título y descripción son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('difficulty', difficulty);
      formData.append('boardType', boardType.trim());
      formData.append(
        'estimatedTime',
        JSON.stringify({ value: Number(timeValue), unit: timeUnit }),
      );
      formData.append('isPublished', String(isPublished));

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      formData.append('tags', JSON.stringify(tags));

      if (coverFile) {
        formData.append('cover', coverFile);
      }

      let saved: Project;
      if (initialData) {
        saved = await updateProject(initialData.id, formData);
        toast.success('Proyecto actualizado exitosamente');
      } else {
        saved = await createProject(formData);
        toast.success('¡Proyecto creado! Ahora puedes añadir pasos, materiales y firmware');
        router.push(`/admin/projects/${saved.id}/edit`);
      }

      if (onSuccess) {
        onSuccess(saved);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border shadow-sm bg-card">
        <CardHeader className="p-5 pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Información General del Proyecto
          </CardTitle>
          <CardDescription className="text-xs">
            Datos principales que se mostrarán en la tarjeta y encabezado del proyecto
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Título del Proyecto *</label>
            <Input
              placeholder="Ej: Estación Meteorológica IoT con Pantalla OLED"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Descripción Completa *</label>
            <Textarea
              placeholder="Explica de qué trata el proyecto, qué aprenderá el usuario y qué funcionalidades tiene..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="text-xs leading-relaxed"
              required
            />
          </div>

          {/* Grid options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Difficulty */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nivel de Dificultad</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ProjectDifficulty)}
                className="h-9 w-full rounded-lg border bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="beginner">Principiante (Iniciación)</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>

            {/* Board Type */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-primary" /> Placa / Microcontrolador
              </label>
              <Input
                placeholder="ESP32 / ESP8266 / ESP32-S3"
                value={boardType}
                onChange={(e) => setBoardType(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Estimated Time */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> Tiempo Estimado
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={timeValue}
                  onChange={(e) => setTimeValue(parseInt(e.target.value, 10) || 1)}
                  className="h-9 text-xs font-mono w-20"
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value)}
                  className="h-9 flex-1 rounded-lg border bg-background px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-primary" /> Etiquetas / Categorías (Separadas por comas)
            </label>
            <Input
              placeholder="monitoreo, domotica, oled, esp32, dht22"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5 text-primary" /> Foto de Portada
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Vista previa portada"
                  className="h-24 w-36 object-cover rounded-lg border bg-muted shrink-0"
                />
              )}
              <div className="flex-1 space-y-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="h-9 text-xs file:mr-2 file:text-xs"
                />
                <span className="text-[11px] text-muted-foreground block">
                  Recomendado: Formato 16:9 (1280x720 o similar). PNG, JPG o WebP.
                </span>
              </div>
            </div>
          </div>

          {/* Publish Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border bg-muted/30 pt-3">
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-foreground">Estado de Publicación</div>
              <div className="text-[11px] text-muted-foreground">
                Si está marcado, el proyecto aparecerá en la galería pública de proyectos.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <span className={`text-xs font-semibold ${isPublished ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {isPublished ? 'Público' : 'Borrador'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          size="default"
          className="font-semibold text-xs px-5"
        >
          {isSubmitting ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Crear Proyecto y Continuar'}
        </Button>
      </div>
    </form>
  );
}
