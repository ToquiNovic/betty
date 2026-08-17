'use client';

import React, { useState } from 'react';
import { ProjectFirmware, ChipFamily } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, Zap, FileCode, Download, Info } from 'lucide-react';
import { addProjectFirmware, deleteProjectFirmware } from '@/lib/api/projects';
import { toast } from '@/lib/toast';

interface FirmwareUploaderProps {
  projectId: string;
  firmwares: ProjectFirmware[];
  onRefresh: () => void;
}

export function FirmwareUploader({ projectId, firmwares, onRefresh }: FirmwareUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [chipFamily, setChipFamily] = useState<ChipFamily>('ESP32');
  const [version, setVersion] = useState('1.0.0');
  const [flashOffset, setFlashOffset] = useState('0x10000');
  const [flashInstructions, setFlashInstructions] = useState('');
  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setName('');
    setChipFamily('ESP32');
    setVersion('1.0.0');
    setFlashOffset('0x10000');
    setFlashInstructions('');
    setFirmwareFile(null);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !firmwareFile) {
      toast.error('Nombre y archivo binario (.bin) son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('chipFamily', chipFamily);
      formData.append('version', version.trim());
      formData.append('flashOffset', flashOffset.trim());
      if (flashInstructions.trim()) {
        formData.append('flashInstructions', flashInstructions.trim());
      }
      formData.append('firmware', firmwareFile);

      await addProjectFirmware(projectId, formData);
      toast.success('Firmware cargado exitosamente en el servidor');
      setIsOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar el firmware');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (firmwareId: string) => {
    if (!confirm('¿Eliminar este archivo de firmware del servidor?')) return;
    try {
      await deleteProjectFirmware(projectId, firmwareId);
      toast.success('Firmware eliminado');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el firmware');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Binarios de Firmware ({firmwares.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Sube los archivos .bin compilados para que los usuarios puedan flashearlos por USB
          </p>
        </div>

        <Button onClick={openCreate} size="sm" className="gap-1.5 text-xs font-semibold">
          <Plus className="h-4 w-4" />
          <span>Subir Firmware</span>
        </Button>
      </div>

      {firmwares.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-muted/20 text-muted-foreground">
          <Zap className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-xs font-medium">Aún no hay archivos de firmware cargados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {firmwares.map((fw) => (
            <Card key={fw.id} className="border shadow-xs bg-card">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileCode className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{fw.name}</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        v{fw.version}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {fw.chipFamily}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span>Offset: {fw.flashOffset || '0x10000'}</span>
                      {fw.fileSizeBytes && (
                        <span>Tamaño: {(fw.fileSizeBytes / 1024).toFixed(1)} KB</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    render={
                      <a
                        href={fw.firmwareUrl}
                        download={`${fw.name}_v${fw.version}.bin`}
                      />
                    }
                    title="Descargar binario"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(fw.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar firmware"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Firmware Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Subir Archivo de Firmware</DialogTitle>
              <DialogDescription>
                Carga el archivo compilado .bin que se transmitirá al microcontrolador.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Nombre del Firmware *</label>
                <Input
                  placeholder="Ej: Betty Sensor Telemetría ESP32"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Familia de Chip *</label>
                  <select
                    value={chipFamily}
                    onChange={(e) => setChipFamily(e.target.value as ChipFamily)}
                    className="h-8 w-full rounded-lg border bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ESP32">ESP32</option>
                    <option value="ESP8266">ESP8266</option>
                    <option value="ESP32-S2">ESP32-S2</option>
                    <option value="ESP32-S3">ESP32-S3</option>
                    <option value="ESP32-C3">ESP32-C3</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Versión Semver *</label>
                  <Input
                    placeholder="1.0.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Offset de Memoria Flash</label>
                <Input
                  placeholder="0x10000 (app default para ESP32) o 0x0 para binario fusionado"
                  value={flashOffset}
                  onChange={(e) => setFlashOffset(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Archivo Binario (.BIN) *</label>
                <Input
                  type="file"
                  accept=".bin"
                  onChange={(e) => setFirmwareFile(e.target.files?.[0] || null)}
                  className="h-8 text-xs file:mr-2 file:text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Instrucciones Especiales de Flasheo (Opcional)</label>
                <Textarea
                  placeholder="Ej: Mantener presionado BOOT durante la conexión, conectar sensor a GPIO 4..."
                  value={flashInstructions}
                  onChange={(e) => setFlashInstructions(e.target.value)}
                  rows={3}
                  className="text-xs"
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
                {isSubmitting ? 'Cargando binario...' : 'Subir Firmware'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
