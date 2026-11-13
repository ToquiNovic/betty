'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { LocationPickerMapInnerProps } from './location-picker-map-inner';

const DynamicLocationPickerMap = dynamic(() => import('./location-picker-map-inner'), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-[180px] w-full rounded-xl" />,
});

export function LocationPickerMap(props: LocationPickerMapInnerProps) {
  return <DynamicLocationPickerMap {...props} />;
}
