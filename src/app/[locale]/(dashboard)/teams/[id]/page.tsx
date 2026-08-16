'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { useTeam, teamApi } from '@/lib/api/teams';
import { useSensors } from '@/lib/api/sensors';
import { useAuthStore } from '@/stores/auth-store';
import { MemberList } from '@/components/teams/member-list';
import { InviteDialog } from '@/components/teams/invite-dialog';
import { SensorCard } from '@/components/sensors/sensor-card';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Radio, Settings, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TeamSettingsFormProps {
  team: NonNullable<ReturnType<typeof useTeam>['team']>;
  isOwnerOrAdmin: boolean;
  onUpdated: () => void;
  saveLabel: string;
  errorLabel: string;
}

function TeamSettingsForm({
  team,
  isOwnerOrAdmin,
  onUpdated,
  saveLabel,
  errorLabel,
}: TeamSettingsFormProps) {
  const [teamName, setTeamName] = useState(team.name);
  const [teamDesc, setTeamDesc] = useState(team.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await teamApi.update(team.id, {
        name: teamName,
        description: teamDesc || undefined,
      });
      onUpdated();
      toast.success('Equipo actualizado');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : errorLabel;
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base font-bold">Ajustes del Equipo</CardTitle>
        <CardDescription className="text-xs">
          Actualiza el nombre y descripción visible para todos los miembros.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleUpdateTeam}>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-name">Nombre del Equipo</Label>
            <Input
              id="t-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!isOwnerOrAdmin || isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-desc">Descripción</Label>
            <Input
              id="t-desc"
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              disabled={!isOwnerOrAdmin || isSaving}
            />
          </div>
        </CardContent>
        {isOwnerOrAdmin && (
          <CardFooter className="p-5 pt-0 border-t bg-muted/10 py-3 flex justify-end">
            <Button type="submit" size="sm" disabled={isSaving}>
              {saveLabel}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}

export default function TeamDetailPage() {
  const t = useTranslations('teams');
  const common = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const teamId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { user } = useAuthStore();

  const { team, isLoading, mutate } = useTeam(teamId);
  const { sensors } = useSensors();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteTeam = async () => {
    try {
      await teamApi.delete(teamId);
      toast.success('Equipo eliminado');
      router.push('/teams');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-muted-foreground">Equipo no encontrado</p>
        <Button render={<Link href="/teams" />} variant="outline">
          <span>{common('back')}</span>
        </Button>
      </div>
    );
  }

  const isOwner = team.ownerId === user?.id;
  const currentMember = team.members?.find((m) => m.userId === user?.id);
  const isOwnerOrAdmin = isOwner || currentMember?.role === 'team_admin';

  const teamSensors = sensors.filter((s) => s.teamId === teamId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              render={<Link href="/teams" />}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
          </div>
          <p className="text-xs text-muted-foreground pl-11">
            {team.description || 'Equipo de trabajo compartido'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwnerOrAdmin && (
            <InviteDialog teamId={teamId} inviteCode={team.inviteCode} />
          )}
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-8 text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{common('delete')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="members" className="gap-2 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>Miembros ({team.members?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="sensors" className="gap-2 text-xs">
            <Radio className="h-3.5 w-3.5" />
            <span>Sensores ({teamSensors.length})</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 text-xs">
            <Settings className="h-3.5 w-3.5" />
            <span>Configuración</span>
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <MemberList
            teamId={teamId}
            members={team.members || []}
            isOwnerOrAdmin={isOwnerOrAdmin}
            currentUserId={user?.id}
            onMemberRemoved={() => mutate()}
          />
        </TabsContent>

        {/* Sensors Tab */}
        <TabsContent value="sensors" className="space-y-4">
          {teamSensors.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              No hay sensores asignados a este equipo. Asigna sensores editándolos o al crearlos.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamSensors.map((sensor) => (
                <SensorCard key={sensor.id} sensor={sensor} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 max-w-xl">
          <TeamSettingsForm
            key={`${team.id}-${team.name}-${team.updatedAt || ''}`}
            team={team}
            isOwnerOrAdmin={isOwnerOrAdmin}
            onUpdated={mutate}
            saveLabel={common('save')}
            errorLabel={common('error')}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Modal */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar Equipo"
        description={t('deleteTeamConfirm')}
        confirmLabel={common('delete')}
        variant="destructive"
        onConfirm={handleDeleteTeam}
      />
    </div>
  );
}
