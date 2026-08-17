'use client';

import React from 'react';
import { ProjectMaterial } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wrench, ExternalLink, ShoppingCart, DollarSign } from 'lucide-react';

interface ProjectMaterialsProps {
  materials: ProjectMaterial[];
}

export function ProjectMaterialsTable({ materials }: ProjectMaterialsProps) {
  if (!materials || materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20 text-muted-foreground">
        <Wrench className="h-10 w-10 mb-2 opacity-40" />
        <p className="text-sm font-medium">No se han listado materiales para este proyecto.</p>
      </div>
    );
  }

  // Calculate total cost if available
  const totalCost = materials.reduce((acc, m) => {
    if (m.estimatedCost) {
      const num = typeof m.estimatedCost === 'string' ? parseFloat(m.estimatedCost) : m.estimatedCost;
      return acc + (isNaN(num) ? 0 : num * (m.quantity || 1));
    }
    return acc;
  }, 0);

  const currency = materials[0]?.currency || 'USD';

  return (
    <div className="space-y-4">
      <Card className="border shadow-sm overflow-hidden bg-card">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Lista de Componentes y Materiales
            </CardTitle>
            <CardDescription className="text-xs">
              {materials.length} componente{materials.length !== 1 ? 's' : ''} requerido{materials.length !== 1 ? 's' : ''} para ensamblar el proyecto
            </CardDescription>
          </div>

          {totalCost > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-xs border border-primary/20 self-start sm:self-auto">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Costo estimado total: ~{totalCost.toFixed(2)} {currency}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[45%] text-xs font-semibold">Material / Componente</TableHead>
                <TableHead className="text-xs font-semibold text-center">Cantidad</TableHead>
                <TableHead className="text-xs font-semibold text-right">Costo Est.</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold text-right">Comprar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((mat) => {
                const costNum = mat.estimatedCost
                  ? typeof mat.estimatedCost === 'string'
                    ? parseFloat(mat.estimatedCost)
                    : mat.estimatedCost
                  : null;

                return (
                  <TableRow key={mat.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-xs sm:text-sm py-3">
                      <div className="flex items-center gap-2.5">
                        {mat.imageUrl && (
                          <img
                            src={mat.imageUrl}
                            alt={mat.name}
                            className="h-8 w-8 object-cover rounded border shrink-0 bg-muted"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-foreground">{mat.name}</div>
                          {mat.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {mat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                      <span className="font-bold text-foreground">{mat.quantity}</span> {mat.unit}
                    </TableCell>

                    <TableCell className="text-right text-xs font-mono">
                      {costNum !== null && !isNaN(costNum) ? (
                        <span className="text-foreground font-medium">
                          {(costNum * (mat.quantity || 1)).toFixed(2)} {mat.currency || currency}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right py-2">
                      {mat.purchaseUrl ? (
                        <Button
                          variant="outline"
                          size="xs"
                          className="gap-1 text-[11px] h-7 text-primary hover:text-primary font-medium"
                          render={
                            <a
                              href={mat.purchaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          <span>Ver</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
