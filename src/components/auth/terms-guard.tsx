'use client';

import React, { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';

export function TermsGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && isAuthenticated && user && !user.termsAccepted) {
      router.replace('/terms');
    }
  }, [isHydrated, isAuthenticated, user, router]);

  if (isHydrated && isAuthenticated && user && !user.termsAccepted) {
    return null;
  }

  return <>{children}</>;
}
