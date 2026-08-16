'use client';

import React from 'react';
import { ThemeProvider } from './theme-provider';
import { SWRProvider } from './swr-provider';
import { SocketProvider } from './socket-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SWRProvider>
        <SocketProvider>
          <TooltipProvider delay={200}>
            {children}
            <Toaster position="top-right" />
          </TooltipProvider>
        </SocketProvider>
      </SWRProvider>
    </ThemeProvider>
  );
}
