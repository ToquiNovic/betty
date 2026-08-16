'use client';

import React from 'react';
import { SensorData } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OriginBadge } from './sensor-status-badge';
import { Database, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function SensorDataTable({ data }: { data: SensorData[] }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-bold">
            Registro Histórico de Telemetría (TimescaleDB)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No hay registros históricos para este sensor todavía.
          </div>
        ) : (
          <div className="relative w-full overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[80px] font-mono text-xs">ID</TableHead>
                  <TableHead className="w-[140px] text-xs">Origen</TableHead>
                  <TableHead className="text-xs">Payload (JSON)</TableHead>
                  <TableHead className="w-[180px] text-xs text-right">Marca Temporal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id} className="text-xs font-mono">
                    <TableCell className="text-muted-foreground">{row.id}</TableCell>
                    <TableCell>
                      <OriginBadge origin={row.originType} />
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      <code className="text-xs text-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {JSON.stringify(row.payload)}
                      </code>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(row.recordedAt), 'yyyy-MM-dd HH:mm:ss')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
