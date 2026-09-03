'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuthStore();
  const [asyncError, setAsyncError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const refreshToken = searchParams.get('refreshToken');
  const error = !token || !refreshToken ? 'Missing authentication tokens.' : asyncError;

  useEffect(() => {
    if (!token || !refreshToken) return;

    let isMounted = true;

    const processOAuth = async () => {
      try {
        // Temporarily set tokens in store so getMe() request is authenticated
        useAuthStore.getState().setTokens({
          accessToken: token,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: '1d',
        });

        // Fetch user profile
        const user = await authApi.getMe();

        if (isMounted) {
          // Complete full login
          login({
            user,
            accessToken: token,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: '1d',
          });

          toast.success('¡Sesión iniciada con éxito!');
          router.replace('/overview');
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Error al autenticar';
          setAsyncError(msg);
          toast.error(msg);
        }
      }
    };

    processOAuth();

    return () => {
      isMounted = false;
    };
  }, [token, refreshToken, login, router]);

  return (
    <Card className="shadow-lg border">
      <CardContent className="pt-8 pb-8 text-center space-y-4">
        {error ? (
          <div className="space-y-2 text-destructive">
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => router.replace('/login')}
              className="text-xs text-primary underline"
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Completando autenticación y preparando tu sesión...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
