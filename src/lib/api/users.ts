import useSWR from 'swr';
import { fetcher, apiPatch } from '@/lib/fetcher';
import { User, UpdateUserRoleDto, Role } from '@/types';

export function useUsers(limit = 50, offset = 0) {
  const { data, error, isLoading, mutate } = useSWR<User[]>(
    `/users?limit=${limit}&offset=${offset}`,
    fetcher
  );
  return {
    users: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useRoles(scope?: 'system' | 'team') {
  const query = scope ? `?scope=${scope}` : '';
  const { data, error, isLoading } = useSWR<Role[]>(`/roles${query}`, fetcher);
  return {
    roles: data || [],
    isLoading,
    isError: !!error,
    error,
  };
}

export const userAdminApi = {
  updateRole: (userId: string, data: UpdateUserRoleDto) =>
    apiPatch<User>(`/users/${userId}/role`, data),
};
