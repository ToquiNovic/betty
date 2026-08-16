import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, User, Eye } from 'lucide-react';

export function TeamRoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'owner':
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 py-0.5 text-xs">
          <Crown className="h-3 w-3" />
          <span>Propietario</span>
        </Badge>
      );
    case 'team_admin':
      return (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 py-0.5 text-xs">
          <Shield className="h-3 w-3" />
          <span>Administrador</span>
        </Badge>
      );
    case 'member':
      return (
        <Badge variant="outline" className="border-muted-foreground/30 bg-muted text-foreground gap-1 py-0.5 text-xs">
          <User className="h-3 w-3" />
          <span>Miembro</span>
        </Badge>
      );
    case 'viewer':
      return (
        <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground gap-1 py-0.5 text-xs">
          <Eye className="h-3 w-3" />
          <span>Lector</span>
        </Badge>
      );
    default:
      return <Badge variant="secondary">{role}</Badge>;
  }
}
