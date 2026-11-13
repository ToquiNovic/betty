import { fetcher, apiPost, apiPatch } from '@/lib/fetcher';
import { AuthResponse, User, TokenPair, ConsentEvidence } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  termsAccepted: boolean;
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

export interface AcceptConsentPayload {
  termsAccepted?: boolean;
  dataConsentAccepted?: boolean;
  allowPhotos?: boolean;
  allowAudio?: boolean;
  allowVideo?: boolean;
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
  acceptTerms: (data?: AcceptConsentPayload) => apiPost<User>('/users/me/accept-terms', data ?? {}),
  getConsentEvidence: () => fetcher<ConsentEvidence>('/users/me/consent-evidence'),
};
