import useSWR from 'swr';
import { fetcher, apiPost, apiPatch, apiDelete } from '@/lib/fetcher';
import {
  Team,
  TeamMembership,
  CreateTeamDto,
  UpdateTeamDto,
  JoinByCodeDto,
  InviteMemberDto,
  InviteLinkResponse,
} from '@/types';

export function useTeams() {
  const { data, error, isLoading, mutate } = useSWR<TeamMembership[]>('/teams', fetcher);
  return {
    teams: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useTeam(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Team>(
    id ? `/teams/${id}` : null,
    fetcher
  );
  return {
    team: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export const teamApi = {
  create: (data: CreateTeamDto) => apiPost<Team>('/teams', data),
  update: (id: string, data: UpdateTeamDto) => apiPatch<Team>(`/teams/${id}`, data),
  delete: (id: string) => apiDelete<{ message: string }>(`/teams/${id}`),
  joinByCode: (data: JoinByCodeDto) =>
    apiPost<{ message: string; team: Team; membership: TeamMembership }>('/teams/join/code', data),
  joinByToken: (token: string) =>
    apiPost<{ message: string; team: Team; membership: TeamMembership }>(
      `/teams/join/token?token=${token}`
    ),
  createInviteLink: (teamId: string) =>
    apiPost<InviteLinkResponse>(`/teams/${teamId}/invitations/link`),
  inviteByEmail: (teamId: string, data: InviteMemberDto) =>
    apiPost<{ message: string; email: string }>(`/teams/${teamId}/invitations/email`, data),
  removeMember: (teamId: string, memberId: string) =>
    apiDelete<{ message: string }>(`/teams/${teamId}/members/${memberId}`),
};
