export type SystemRole = 'admin' | 'user';
export type AuthProvider = 'email' | 'google';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  roleId?: string;
  role: SystemRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  authProvider: AuthProvider;
  role: SystemRole;
  tokenId: string;
  iat: number;
  exp: number;
}
