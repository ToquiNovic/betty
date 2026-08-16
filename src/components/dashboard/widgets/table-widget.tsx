'use client';

import React from 'react';
import { DashboardWidget, SensorData } from '@/types';
import { useSensorData } from '@/lib/api/sensors';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface TableWidgetProps {
  widget: DashboardWidget;
  latestReading?: SensorData;
}

export function TableWidget({ widget, latestReading }: TableWidgetProps) {
  const { data: historicalData } = useSensorData(widget.sensorId, { limit: 10 });

  const rows = React.useMemo(() => {
    const all = [...historicalData];
    if (latestReading && !all.some((d) => d.id === latestReading.id)) {
      all.unshift(latestReading);
    }
    return all.slice(0, 10);
  }, [historicalData, latestReading]);

  return (
    <Card className="h-full flex flex-col justify-between border shadow-sm overflow-hidden">
      <CardHeader className="p-3 pb-2 border-b bg-muted/20">
        <CardTitle className="text-xs font-semibold truncate">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-56">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Sin registros
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[10px]">
                <TableHead className="py-1 px-2">Hora</TableHead>
                <TableHead className="py-1 px-2">Origen</TableHead>
                <TableHead className="py-1 px-2">Datos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="text-[10px] font-mono">
                  <TableCell className="py-1 px-2 whitespace-nowrap text-muted-foreground">
                    {format(new Date(row.recordedAt), 'HH:mm:ss')}
                  </TableCell>
                  <TableCell className="py-1 px-2 whitespace-nowrap">
                    {row.originType}
                  </TableCell>
                  <TableCell className="py-1 px-2 truncate max-w-[120px]">
                    {JSON.stringify(row.payload)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
