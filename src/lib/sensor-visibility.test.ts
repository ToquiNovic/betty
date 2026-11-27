import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type * as VisibilityModule from './sensor-visibility';
import type { TeamMembership } from '@/types';

let visibility: typeof VisibilityModule;

before(async () => {
  const modulePath = './sensor-visibility.ts';
  visibility = (await import(modulePath)) as typeof VisibilityModule;
});

const memberships: TeamMembership[] = [
  {
    teamId: 'team-1',
    role: 'owner',
    joinedAt: '2026-01-01T00:00:00Z',
    teamName: 'Laboratorio IoT',
  },
  {
    teamId: 'team-2',
    role: 'member',
    joinedAt: '2026-01-02T00:00:00Z',
    team: {
      id: 'team-2',
      name: 'Red LoRa Campus',
      description: null,
      inviteCode: 'ABC12345',
      ownerId: 'other-user',
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    },
  },
];

describe('resolveTeamOptions', () => {
  it('normalizes team names and deduplicates repeated memberships', () => {
    const duplicate = [memberships[0], memberships[0], memberships[1]];
    const options = visibility.resolveTeamOptions(duplicate);

    assert.deepEqual(options, [
      { id: 'team-1', name: 'Laboratorio IoT', role: 'owner' },
      { id: 'team-2', name: 'Red LoRa Campus', role: 'member' },
    ]);
  });
});

describe('getSensorTeamChangeState', () => {
  it('blocks sharing with a team when user does not belong to any team', () => {
    const state = visibility.getSensorTeamChangeState({
      sensorOwnerId: 'user-1',
      currentUserId: 'user-1',
      currentTeamId: null,
      selectedTeamId: null,
      memberships: [],
    });

    assert.equal(state.isOwner, true);
    assert.equal(state.hasTeams, false);
    assert.equal(state.canSelectTeam, false);
    assert.equal(state.canSwitchToPersonal, true);
    assert.equal(state.canPersistTeamChange, true);
  });

  it('allows the owner to switch a personal sensor to a team they belong to', () => {
    const state = visibility.getSensorTeamChangeState({
      sensorOwnerId: 'user-1',
      currentUserId: 'user-1',
      currentTeamId: null,
      selectedTeamId: 'team-1',
      memberships,
    });

    assert.equal(state.isOwner, true);
    assert.equal(state.canSelectTeam, true);
    assert.equal(state.teamIdChanged, true);
    assert.equal(state.canPersistTeamChange, true);
  });

  it('allows the owner to switch a team sensor back to personal (null)', () => {
    const state = visibility.getSensorTeamChangeState({
      sensorOwnerId: 'user-1',
      currentUserId: 'user-1',
      currentTeamId: 'team-1',
      selectedTeamId: null,
      memberships,
    });

    assert.equal(state.isOwner, true);
    assert.equal(state.canSwitchToPersonal, true);
    assert.equal(state.teamIdChanged, true);
    assert.equal(state.canPersistTeamChange, true);
  });

  it('blocks a non-owner team admin from changing a team sensor to personal', () => {
    const state = visibility.getSensorTeamChangeState({
      sensorOwnerId: 'owner-1',
      currentUserId: 'admin-2',
      currentTeamId: 'team-1',
      selectedTeamId: null,
      memberships,
    });

    assert.equal(state.isOwner, false);
    assert.equal(state.canSwitchToPersonal, false);
    assert.equal(state.canSelectTeam, false);
    assert.equal(state.teamIdChanged, true);
    assert.equal(state.canPersistTeamChange, false);
  });

  it('allows a non-owner team admin to save other settings when teamId stays unchanged', () => {
    const state = visibility.getSensorTeamChangeState({
      sensorOwnerId: 'owner-1',
      currentUserId: 'admin-2',
      currentTeamId: 'team-1',
      selectedTeamId: 'team-1',
      memberships,
    });

    assert.equal(state.isOwner, false);
    assert.equal(state.teamIdChanged, false);
    assert.equal(state.canPersistTeamChange, true);
  });
});
