import { User } from './auth';

export type TeamRoleSlug = 'owner' | 'team_admin' | 'member' | 'viewer';

export interface TeamMember {
  id: string;
  teamId?: string;
  userId: string;
  roleId?: string;
  role: string;
  joinedAt: string;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
}

export interface TeamMembership {
  teamId: string;
  role: string;
  joinedAt: string;
  teamName?: string;
  teamDescription?: string | null;
  inviteCode?: string;
  ownerId?: string;
  createdAt?: string;
  team?: Team;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
}

export interface JoinByCodeDto {
  code: string;
}

export interface InviteMemberDto {
  email: string;
}

export interface InviteLinkResponse {
  inviteToken: string;
  expiresAt: string;
}
