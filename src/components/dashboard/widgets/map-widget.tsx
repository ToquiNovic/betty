'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DashboardWidget, SensorData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DynamicMap = dynamic(() => import('./map-inner'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded" />,
});

interface MapWidgetProps {
  widget: DashboardWidget;
  latestReading?: SensorData;
}

export function MapWidget({ widget, latestReading }: MapWidgetProps) {
  const latKey = widget.config?.latKey || 'lat';
  const lngKey = widget.config?.lngKey || 'lng';

  const reading = latestReading || widget.latestReading;
  const payload =
    reading?.payload && typeof reading.payload === 'object'
      ? (reading.payload as Record<string, unknown>)
      : {};

  const rawLat = payload[latKey];
  const rawLng = payload[lngKey];

  // Default to Bogotá coordinates (4.6097, -74.0817) if none in payload
  const lat = typeof rawLat === 'number' ? rawLat : 4.6097;
  const lng = typeof rawLng === 'number' ? rawLng : -74.0817;

  return (
    <Card className="h-full flex flex-col justify-between border shadow-sm overflow-hidden">
      <CardHeader className="p-3 pb-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold truncate">{widget.title}</CardTitle>
          <MapPin className="h-3.5 w-3.5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-[140px]">
        <DynamicMap lat={lat} lng={lng} title={widget.title} />
      </CardContent>
    </Card>
  );
}
