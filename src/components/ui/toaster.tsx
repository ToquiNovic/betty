'use client';

import * as React from 'react';
import { Toaster as SileoToaster } from 'sileo';
import { useTheme } from '@/components/providers/theme-provider';

export type ToasterProps = React.ComponentProps<typeof SileoToaster>;

export function Toaster({
  position = 'top-right',
  options,
  ...props
}: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <SileoToaster
      position={position}
      theme={(resolvedTheme as 'light' | 'dark') || 'system'}
      options={{
        roundness: 16,
        ...options,
      }}
      {...props}
    />
  );
}
