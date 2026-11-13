'use client';

import React from 'react';
import { AdminTeamItem } from '@/types';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Cpu, KeyRound, Copy, Check, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/lib/toast';
import { Link } from '@/i18n/routing';

interface AdminTeamsTableProps {
  teams: AdminTeamItem[];
}

export function AdminTeamsTable({ teams }: AdminTeamsTableProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Código de invitación copiado');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (teams.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-xs text-muted-foreground bg-card">
        No se encontraron equipos o grupos registrados.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 text-xs">
            <TableHead>Equipo / Grupo</TableHead>
            <TableHead>Propietario</TableHead>
            <TableHead>Código Rápido</TableHead>
            <TableHead className="text-center">Miembros</TableHead>
            <TableHead className="text-center">Sensores</TableHead>
            <TableHead>Fecha Creación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const ownerInitials = team.owner?.name
              ? team.owner.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'O';

            return (
              <TableRow key={team.id} className="text-xs">
                <TableCell>
                  <div>
                    <p className="font-semibold text-foreground">{team.name}</p>
                    {team.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {team.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                        {ownerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{team.owner?.name || 'Desconocido'}</p>
                      <p className="text-[10px] text-muted-foreground">{team.owner?.email || ''}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 font-mono text-[11px] border border-border/40">
                    <KeyRound className="h-3 w-3 text-amber-500" />
                    <span>{team.inviteCode}</span>
                    <button
                      onClick={() => handleCopyCode(team.inviteCode)}
                      className="ml-1 hover:text-foreground text-muted-foreground transition-colors"
                      title="Copiar código"
                    >
                      {copiedCode === team.inviteCode ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="gap-1 text-[10px] font-semibold">
                    <Users className="h-3 w-3 text-sky-500" />
                    <span>{team.membersCount}</span>
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="gap-1 text-[10px] font-semibold">
                    <Cpu className="h-3 w-3 text-primary" />
                    <span>{team.sensorsCount}</span>
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-[11px]">
                  {format(new Date(team.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    render={<Link href={`/teams/${team.id}`} />}
                  >
                    <span>Ver</span>
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
