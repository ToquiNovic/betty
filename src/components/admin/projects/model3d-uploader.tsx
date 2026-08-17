'use client';

import React, { useState } from 'react';
import { Model3DFormat } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectModelViewer } from '@/components/projects/project-model-viewer';
import { Box, Upload, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { upload3DModel, delete3DModel } from '@/lib/api/projects';
import { toast } from '@/lib/toast';

interface Model3DUploaderProps {
  projectId: string;
  modelUrl?: string | null;
  modelFormat?: Model3DFormat | null;
  onRefresh: () => void;
}

export function Model3DUploader({
  projectId,
  modelUrl,
  modelFormat,
  onRefresh,
}: Model3DUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await upload3DModel(projectId, selectedFile);
      toast.success('Modelo 3D cargado exitosamente en el servidor');
      setSelectedFile(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar el modelo 3D');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar el modelo 3D de este proyecto?')) return;
    try {
      await delete3DModel(projectId);
      toast.success('Modelo 3D eliminado');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el modelo');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Box className="h-4 w-4 text-primary" />
          Modelo 3D del Proyecto
        </h4>
        <p className="text-xs text-muted-foreground">
          Sube un archivo 3D (<strong>.glb</strong>, <strong>.gltf</strong> o <strong>.stl</strong>) para que los usuarios puedan inspeccionar el diseño de la carcasa, ensamblaje o circuito.
        </p>
      </div>

      {modelUrl ? (
        <div className="space-y-3">
          <Card className="border shadow-xs overflow-hidden bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs uppercase">
                    {modelFormat || '3D'}
                  </Badge>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Modelo cargado activo
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Eliminar Modelo
                </Button>
              </div>

              {/* Interactive 3D preview */}
              <div className="rounded-xl overflow-hidden border">
                <ProjectModelViewer modelUrl={modelUrl} format={modelFormat} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border shadow-xs bg-card">
          <CardContent className="p-5">
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-muted/20 text-center space-y-2">
                <Box className="h-10 w-10 text-muted-foreground/50" />
                <div className="text-xs">
                  <label className="font-semibold text-primary hover:underline cursor-pointer">
                    <span>Selecciona un archivo 3D</span>
                    <input
                      type="file"
                      accept=".glb,.gltf,.stl"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="sr-only"
                    />
                  </label>
                  <span className="text-muted-foreground"> o arrástralo aquí</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Formatos soportados: <strong>.GLB</strong> (Recomendado con texturas), <strong>.GLTF</strong>, <strong>.STL</strong>
                </span>

                {selectedFile && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background border text-xs font-mono text-foreground mt-2">
                    <Box className="h-3.5 w-3.5 text-primary" />
                    <span>{selectedFile.name}</span>
                    <span className="text-muted-foreground">
                      ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={isUploading} className="gap-1.5 text-xs font-semibold">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploading ? 'Cargando archivo...' : 'Cargar Modelo 3D'}</span>
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
