export type RoleScope = 'system' | 'team';

export interface Role {
  id: string;
  slug: string;
  name: string;
  scope: RoleScope;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRoleDto {
  role: 'admin' | 'user';
}
