'use client';

import React from 'react';
import { TeamMembership } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamRoleBadge } from './role-badge';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Users, ArrowRight, KeyRound } from 'lucide-react';

export function TeamCard({ membership }: { membership: TeamMembership }) {
  const common = useTranslations('common');
  const teamId = membership.teamId || membership.team?.id;
  const name = membership.teamName || membership.team?.name || 'Equipo';
  const description = membership.teamDescription || membership.team?.description;
  const inviteCode = membership.inviteCode || membership.team?.inviteCode;
  const role = membership.role;

  return (
    <Card className="flex flex-col justify-between border shadow-sm hover:shadow-md hover:border-primary/40 transition-all group">
      <CardHeader className="p-5 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-transform">
              <Users className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold tracking-tight line-clamp-1">
              {name}
            </CardTitle>
          </div>
          <TeamRoleBadge role={role} />
        </div>
        <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
          {description || 'Equipo de trabajo y colaboración en IoT'}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-2 text-xs text-muted-foreground">
        {inviteCode && (
          <div className="flex items-center justify-between font-mono bg-muted/40 p-2 rounded text-[11px]">
            <div className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Código: {inviteCode}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0 border-t bg-muted/10 flex justify-end items-center py-3">
        <Button
          render={<Link href={`/teams/${teamId}`} />}
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs h-8 px-2 font-semibold"
        >
          <span>{common('viewDetails')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
