import type { TeamMembership } from '@/types';

export interface SensorTeamOption {
  id: string;
  name: string;
  role: string;
}

export interface SensorVisibilityInput {
  sensorOwnerId: string;
  currentUserId?: string | null;
  currentTeamId: string | null;
  selectedTeamId: string | null;
  memberships: readonly TeamMembership[];
}

export interface SensorVisibilityState {
  isOwner: boolean;
  teamOptions: SensorTeamOption[];
  hasTeams: boolean;
  canSwitchToPersonal: boolean;
  canSelectTeam: boolean;
  teamIdChanged: boolean;
  canPersistTeamChange: boolean;
}

/** Normalize user team memberships into unique selectable team options. */
export function resolveTeamOptions(
  memberships: readonly TeamMembership[]
): SensorTeamOption[] {
  const seen = new Set<string>();
  const options: SensorTeamOption[] = [];

  for (const membership of memberships) {
    const id = membership.teamId || membership.team?.id;
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    options.push({
      id,
      name: membership.teamName || membership.team?.name || 'Equipo',
      role: membership.role,
    });
  }

  return options;
}

/** Compute ownership and team-membership permissions for sensor visibility changes. */
export function getSensorTeamChangeState({
  sensorOwnerId,
  currentUserId,
  currentTeamId,
  selectedTeamId,
  memberships,
}: SensorVisibilityInput): SensorVisibilityState {
  const isOwner = Boolean(currentUserId && currentUserId === sensorOwnerId);
  const teamOptions = resolveTeamOptions(memberships);
  const hasTeams = teamOptions.length > 0;
  const canSwitchToPersonal = isOwner;
  const canSelectTeam = isOwner && hasTeams;
  const normalizedCurrent = currentTeamId ?? null;
  const normalizedSelected = selectedTeamId ?? null;
  const teamIdChanged = normalizedSelected !== normalizedCurrent;

  const isTargetTeamValid =
    normalizedSelected === null ||
    teamOptions.some((team) => team.id === normalizedSelected);

  const canPersistTeamChange = !teamIdChanged || (isOwner && isTargetTeamValid);

  return {
    isOwner,
    teamOptions,
    hasTeams,
    canSwitchToPersonal,
    canSelectTeam,
    teamIdChanged,
    canPersistTeamChange,
  };
}
