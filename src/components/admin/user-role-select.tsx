'use client';

import React, { useState } from 'react';
import { User, SystemRole } from '@/types';
import { userAdminApi } from '@/lib/api/users';
import { useAuthStore } from '@/stores/auth-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function UserRoleSelect({
  targetUser,
  onRoleChanged,
}: {
  targetUser: User;
  onRoleChanged: () => void;
}) {
  const { user: currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<SystemRole>(targetUser.role);

  const isSelf = targetUser.id === currentUser?.id;

  const handleRoleChange = async (newRole: SystemRole) => {
    if (isSelf) {
      toast.error('No puedes cambiar tu propio rol de administrador.');
      return;
    }

    setIsLoading(true);
    try {
      await userAdminApi.updateRole(targetUser.id, { role: newRole });
      setCurrentRole(newRole);
      onRoleChanged();
      toast.success(`Rol de ${targetUser.name} actualizado a ${newRole}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar rol';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      <Select
        value={currentRole}
        onValueChange={(val) => handleRoleChange(val as SystemRole)}
        disabled={isLoading || isSelf}
      >
        <SelectTrigger className="h-8 w-28 text-xs font-mono">
          <SelectValue placeholder="Rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user" className="text-xs font-mono">
            user
          </SelectItem>
          <SelectItem value="admin" className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
            admin
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
