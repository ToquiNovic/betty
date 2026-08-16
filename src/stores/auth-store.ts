'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthResponse, TokenPair } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
  setTokens: (tokens: TokenPair) => void;
  setUser: (user: User) => void;
  setHydrated: (val: boolean) => void;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,

      login: (response: AuthResponse) => {
        setCookie('betty_token', response.accessToken, 1);
        setCookie('betty_refresh_token', response.refreshToken, 7);
        setCookie('betty_user_role', response.user.role, 7);
        set({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isHydrated: true,
        });
      },

      logout: () => {
        deleteCookie('betty_token');
        deleteCookie('betty_refresh_token');
        deleteCookie('betty_user_role');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setTokens: (tokens: TokenPair) => {
        setCookie('betty_token', tokens.accessToken, 1);
        setCookie('betty_refresh_token', tokens.refreshToken, 7);
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user: User) => {
        setCookie('betty_user_role', user.role, 7);
        set({ user });
      },

      setHydrated: (val: boolean) => {
        set({ isHydrated: val });
      },
    }),
    {
      name: 'betty_auth_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
