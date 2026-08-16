import { fetcher, apiPost, apiPatch } from '@/lib/fetcher';
import { AuthResponse, User, TokenPair } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  name?: string;
  avatarUrl?: string;
}

export const authApi = {
  login: (data: LoginPayload) => apiPost<AuthResponse>('/auth/login', data),
  register: (data: RegisterPayload) => apiPost<AuthResponse>('/auth/register', data),
  refreshToken: (refreshToken: string) =>
    apiPost<TokenPair>('/auth/refresh-token', { refreshToken }),
  forgotPassword: (data: ForgotPasswordPayload) =>
    apiPost<{ message: string }>('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordPayload) =>
    apiPost<{ message: string }>('/auth/reset-password', data),
  getMe: () => fetcher<User>('/users/me'),
  updateProfile: (data: UpdateProfilePayload) => apiPatch<User>('/users/me', data),
};
