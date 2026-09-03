'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Loader2, Sparkles } from 'lucide-react';

export function Ua3dAuthButton() {
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = useState(false);

  const handleUa3dLogin = () => {
    setIsLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    // External redirect to backend Keycloak OIDC endpoint
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${apiUrl}/auth/ua3d`;
  };

  return (
    <Button
      type="button"
      className="w-full h-12 relative flex items-center justify-between px-4 font-semibold text-sm transition-all shadow-md bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg group"
      onClick={handleUa3dLogin}
      disabled={isLoading}
    >
      <div className="flex items-center gap-3">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        ) : (
          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
        )}
        <div className="flex flex-col text-left">
          <span className="text-sm font-bold leading-tight">
            {isLoading ? 'Conectando con Keycloak...' : t('ssoButton')}
          </span>
          <span className="text-[11px] text-emerald-100 font-normal">
            OpenSim • Admin • Avatares
          </span>
        </div>
      </div>
      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-bold border border-white/30 backdrop-blur-sm">
        SSO
      </span>
    </Button>
  );
}
