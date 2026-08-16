'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTeams } from '@/lib/api/teams';
import { PageHeader } from '@/components/common/page-header';
import { TeamCard } from '@/components/teams/team-card';
import { CreateTeamDialog } from '@/components/teams/create-team-dialog';
import { JoinTeamDialog } from '@/components/teams/join-team-dialog';
import { CardGridSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';

export default function TeamsPage() {
  const t = useTranslations('teams');
  const common = useTranslations('common');
  const { teams, isLoading, mutate } = useTeams();
  const [search, setSearch] = useState('');

  const filteredTeams = (teams || []).filter((m) => {
    const name = m?.teamName || m?.team?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')}>
        <div className="flex items-center gap-2">
          <JoinTeamDialog onSuccess={() => mutate()} />
          <CreateTeamDialog onSuccess={() => mutate()} />
        </div>
      </PageHeader>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={common('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No perteneces a ningún equipo"
          description="Crea un nuevo equipo de trabajo o únete mediante un código de invitación."
        >
          <div className="flex items-center gap-2 mt-2">
            <JoinTeamDialog onSuccess={() => mutate()} />
            <CreateTeamDialog onSuccess={() => mutate()} />
          </div>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((membership, idx) => (
            <TeamCard
              key={membership.teamId || membership.team?.id || `team-idx-${idx}`}
              membership={membership}
            />
          ))}
        </div>
      )}
    </div>
  );
}
