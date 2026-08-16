import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SensorStatus, OriginType } from '@/types';
import { Radio, Box, AlertTriangle, CheckCircle2, Ban } from 'lucide-react';

export function SensorStatusBadge({ status }: { status: SensorStatus }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <CheckCircle2 className="h-3 w-3" />
          <span>Activo</span>
        </Badge>
      );
    case 'inactive':
      return (
        <Badge variant="outline" className="border-muted-foreground/30 bg-muted text-muted-foreground gap-1.5 py-0.5">
          <AlertTriangle className="h-3 w-3" />
          <span>Inactivo</span>
        </Badge>
      );
    case 'revoked':
      return (
        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1.5 py-0.5">
          <Ban className="h-3 w-3" />
          <span>Revocado</span>
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function OriginBadge({ origin }: { origin: OriginType }) {
  if (origin === 'metaverso') {
    return (
      <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 gap-1 py-0.5 text-[11px]">
        <Box className="h-3 w-3" />
        <span>Metaverso</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 py-0.5 text-[11px]">
      <Radio className="h-3 w-3" />
      <span>Sensor Físico</span>
    </Badge>
  );
}
