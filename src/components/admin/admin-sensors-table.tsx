'use client';

import React from 'react';
import { AdminSensorItem } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Cpu, Users, ExternalLink, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from '@/i18n/routing';

interface AdminSensorsTableProps {
  sensors: AdminSensorItem[];
}

export function AdminSensorsTable({ sensors }: AdminSensorsTableProps) {
  if (sensors.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-xs text-muted-foreground bg-card">
        No se encontraron sensores en la plataforma.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 text-xs">
            <TableHead>Sensor</TableHead>
            <TableHead>Propietario</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead>Hardware / Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prefijo API Key</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sensors.map((sensor) => {
            const meta = sensor.metadata || {};
            const hardware = (meta.hardware as string) || (meta.origin_type === 'metaverso' ? 'Metaverso' : 'IoT');
            const isLora = hardware === 'LoRaWAN' || meta.lora_config !== undefined;

            return (
              <TableRow key={sensor.id} className="text-xs">
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      {isLora ? (
                        <Radio className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                      ) : (
                        <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span>{sensor.name}</span>
                    </div>
                    {sensor.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {sensor.description}
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-muted-foreground/80">
                      ID: {sensor.id}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{sensor.ownerName || 'Desconocido'}</p>
                    <p className="text-[10px] text-muted-foreground">{sensor.ownerEmail || ''}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {sensor.teamName ? (
                    <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
                      <Users className="h-2.5 w-2.5 text-primary" />
                      <span>{sensor.teamName}</span>
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Personal</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        isLora
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                          : 'bg-muted/40'
                      }`}
                    >
                      {hardware}
                    </Badge>
                    {isLora && meta.lora_config && (
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {(meta.lora_config as any).frequency || '433 MHz'}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {sensor.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activo
                    </span>
                  ) : sensor.status === 'revoked' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Revocado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Inactivo
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                    {sensor.apiKeyPrefix}...
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-[11px]">
                  {format(new Date(sensor.createdAt), 'dd MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    render={<Link href={`/sensors/${sensor.id}`} />}
                  >
                    <Activity className="h-3 w-3 text-primary" />
                    <span>Telemetría</span>
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
