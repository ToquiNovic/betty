'use client';

import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import { SensorData } from '@/types';
import { useSWRConfig } from 'swr';

export interface UseSensorRealtimeOptions {
  embedToken?: string;
  onData?: (data: SensorData) => void;
}

interface SubscribeSensorAck {
  success?: boolean;
  room?: string;
  message?: string;
}

export function useSensorRealtime(
  sensorId: string | null,
  options?: UseSensorRealtimeOptions
) {
  const { socket, isConnected } = useSocket();
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();
  const embedToken = options?.embedToken;
  const onDataRef = useRef(options?.onData);

  useEffect(() => {
    onDataRef.current = options?.onData;
  }, [options?.onData]);

  useEffect(() => {
    if (!socket || !sensorId || !isConnected) return;

    let isActive = true;

    // Join sensor room (authenticated user or read-only embed token / public embed)
    socket.emit(
      'subscribe:sensor',
      { sensorId, embedToken },
      (ack?: SubscribeSensorAck) => {
        if (!isActive) return;
        if (ack && ack.success === false) {
          setSubscriptionError(
            ack.message || 'No se pudo suscribir al canal en tiempo real del sensor'
          );
        } else {
          setSubscriptionError(null);
        }
      }
    );

    const handleSensorData = (data: SensorData) => {
      if (data.sensorId === sensorId) {
        setSubscriptionError(null);
        setLatestData(data);
        onDataRef.current?.(data);

        // Optimistically prepend to any cached historical queries for this sensor
        mutate(
          (key) => typeof key === 'string' && key.startsWith(`/sensors/${sensorId}/data`),
          (currentData: SensorData[] | undefined) => {
            if (!currentData) return [data];
            // Check if already in array
            if (currentData.some((d) => d.id === data.id)) return currentData;
            return [data, ...currentData];
          },
          false // do not revalidate from server
        );
      }
    };

    socket.on('sensor:data', handleSensorData);

    return () => {
      isActive = false;
      socket.emit('unsubscribe:sensor', { sensorId });
      socket.off('sensor:data', handleSensorData);
    };
  }, [socket, sensorId, isConnected, embedToken, mutate]);

  return {
    latestData,
    isConnected,
    subscriptionError,
  };
}
