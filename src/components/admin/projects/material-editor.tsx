'use client';

import React, { useState } from 'react';
import { ProjectMaterial } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Wrench, ExternalLink, Image as ImageIcon } from 'lucide-react';
import {
  addProjectMaterial,
  updateProjectMaterial,
  deleteProjectMaterial,
} from '@/lib/api/projects';
import { toast } from '@/lib/toast';

interface MaterialEditorProps {
  projectId: string;
  materials: ProjectMaterial[];
  onRefresh: () => void;
}

export function MaterialEditor({ projectId, materials, onRefresh }: MaterialEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ProjectMaterial | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');
  const [purchaseUrl, setPurchaseUrl] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setEditingMaterial(null);
    setName('');
    setDescription('');
    setQuantity(1);
    setUnit('pcs');
    setPurchaseUrl('');
    setEstimatedCost('');
    setCurrency('USD');
    setImageFile(null);
    setIsOpen(true);
  };

  const openEdit = (mat: ProjectMaterial) => {
    setEditingMaterial(mat);
    setName(mat.name);
    setDescription(mat.description || '');
    setQuantity(mat.quantity || 1);
    setUnit(mat.unit || 'pcs');
    setPurchaseUrl(mat.purchaseUrl || '');
    setEstimatedCost(mat.estimatedCost ? String(mat.estimatedCost) : '');
    setCurrency(mat.currency || 'USD');
    setImageFile(null);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del material es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('quantity', String(quantity));
      formData.append('unit', unit.trim());
      if (purchaseUrl.trim()) formData.append('purchaseUrl', purchaseUrl.trim());
      if (estimatedCost.trim()) formData.append('estimatedCost', estimatedCost.trim());
      formData.append('currency', currency);
      if (imageFile) formData.append('image', imageFile);

      if (editingMaterial) {
        await updateProjectMaterial(projectId, editingMaterial.id, formData);
        toast.success('Material actualizado con éxito');
      } else {
        await addProjectMaterial(projectId, formData);
        toast.success('Material añadido con éxito');
      }

      setIsOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar el material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('¿Eliminar este material del proyecto?')) return;
    try {
      await deleteProjectMaterial(projectId, materialId);
      toast.success('Material eliminado');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el material');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Materiales y Componentes ({materials.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Lista de sensores, módulos, cables, resistencias y herramientas necesarias
          </p>
        </div>

        <Button onClick={openCreate} size="sm" className="gap-1.5 text-xs font-semibold">
          <Plus className="h-4 w-4" />
          <span>Añadir Material</span>
        </Button>
      </div>

      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-muted/20 text-muted-foreground">
          <Wrench className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-xs font-medium">Aún no hay materiales en este proyecto.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-semibold">Componente</TableHead>
                <TableHead className="text-xs font-semibold text-center">Cantidad</TableHead>
                <TableHead className="text-xs font-semibold text-right">Costo Est.</TableHead>
                <TableHead className="text-xs font-semibold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((mat) => (
                <TableRow key={mat.id} className="hover:bg-muted/30">
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      {mat.imageUrl && (
                        <img
                          src={mat.imageUrl}
                          alt={mat.name}
                          className="h-8 w-8 object-cover rounded border shrink-0 bg-muted"
                        />
                      )}
                      <div>
                        <div className="font-semibold text-xs text-foreground">{mat.name}</div>
                        {mat.description && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {mat.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center py-2.5 font-mono text-xs">
                    <span className="font-bold">{mat.quantity}</span> {mat.unit}
                  </TableCell>

                  <TableCell className="text-right py-2.5 font-mono text-xs">
                    {mat.estimatedCost ? `${mat.estimatedCost} ${mat.currency}` : '-'}
                  </TableCell>

                  <TableCell className="text-right py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {mat.purchaseUrl && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="h-7 w-7 text-primary"
                          render={
                            <a
                              href={mat.purchaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                          title="Enlace de compra"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEdit(mat)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(mat.id)}
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Material Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Editar Material / Componente' : 'Nuevo Material / Componente'}
              </DialogTitle>
              <DialogDescription>
                Ingresa los datos del componente necesario para replicar el proyecto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Nombre del Componente *</label>
                <Input
                  placeholder="Ej: Sensor de Temperatura DHT22"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Descripción / Especificación</label>
                <Input
                  placeholder="Ej: Módulo de 3 pines con resistencia pull-up integrada"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Cantidad *</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Unidad</label>
                  <Input
                    placeholder="pcs / metros / etc"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Costo Unitario Est.</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 3.50"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Moneda</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-8 w-full rounded-lg border bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="COP">COP ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="MXN">MXN ($)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Enlace de Compra (Opcional)</label>
                <Input
                  placeholder="https://amazon.com/... o https://aliexpress.com/..."
                  value={purchaseUrl}
                  onChange={(e) => setPurchaseUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  Foto del Componente (Opcional)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="h-8 text-xs file:mr-2 file:text-xs"
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
                {isSubmitting ? 'Guardando...' : editingMaterial ? 'Actualizar' : 'Añadir Material'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
