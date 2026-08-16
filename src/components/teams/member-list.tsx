'use client';

import React, { useState } from 'react';
import { TeamMember } from '@/types';
import { teamApi } from '@/lib/api/teams';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TeamRoleBadge } from './role-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MemberListProps {
  teamId: string;
  members: TeamMember[];
  isOwnerOrAdmin: boolean;
  currentUserId?: string;
  onMemberRemoved: () => void;
}

export function MemberList({
  teamId,
  members,
  isOwnerOrAdmin,
  currentUserId,
  onMemberRemoved,
}: MemberListProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRemove = async () => {
    if (!selectedMember) return;
    try {
      await teamApi.removeMember(teamId, selectedMember.id);
      toast.success('Miembro removido del equipo');
      onMemberRemoved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al remover miembro';
      toast.error(msg);
    }
  };

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead>Usuario</TableHead>
              <TableHead>Rol en el Equipo</TableHead>
              <TableHead>Fecha de Ingreso</TableHead>
              {isOwnerOrAdmin && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const userName = member.name || member.user?.name || 'Usuario';
              const userEmail = member.email || member.user?.email || '';
              const userAvatar = member.avatarUrl || member.user?.avatarUrl || '';

              const initials = userName
                ? userName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'U';

              return (
                <TableRow key={member.id} className="text-xs">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{userName}</p>
                        <p className="text-[11px] text-muted-foreground">{userEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TeamRoleBadge role={member.role} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.joinedAt
                      ? format(new Date(member.joinedAt), 'dd MMM yyyy', { locale: es })
                      : '—'}
                  </TableCell>
                  {isOwnerOrAdmin && (
                    <TableCell className="text-right">
                      {member.role !== 'owner' && member.userId !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowConfirm(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Remover Miembro"
        description={`¿Estás seguro de remover a ${selectedMember?.name || selectedMember?.user?.name || 'este miembro'} del equipo?`}
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={handleRemove}
      />
    </>
  );
}
