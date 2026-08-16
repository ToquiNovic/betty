'use client';

import React from 'react';
import { User } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserRoleSelect } from './user-role-select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UsersTableProps {
  users: User[];
  onUserUpdated: () => void;
}

export function UsersTable({ users, onUserUpdated }: UsersTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 text-xs">
            <TableHead>Usuario</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Rol del Sistema</TableHead>
            <TableHead>Fecha de Registro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const initials = user.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'U';

            return (
              <TableRow key={user.id} className="text-xs">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || ''} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-[10px] font-mono">
                    {user.authProvider}
                  </Badge>
                </TableCell>
                <TableCell>
                  <UserRoleSelect targetUser={user} onRoleChanged={onUserUpdated} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.createdAt
                    ? format(new Date(user.createdAt), 'dd MMM yyyy HH:mm', { locale: es })
                    : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
