'use client';

import React from 'react';
import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/fetcher';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
        errorRetryCount: 2,
        dedupingInterval: 2000,
        onError: (error) => {
          // Suppress noisy auth redirects from showing toasts
          if (error?.status === 401) return;
          console.error('SWR Global Error:', error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
