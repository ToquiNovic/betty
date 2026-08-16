'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import { SensorData } from '@/types';
import { useSWRConfig } from 'swr';

export function useSensorRealtime(sensorId: string | null) {
  const { socket, isConnected } = useSocket();
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!socket || !sensorId || !isConnected) return;

    // Join sensor room
    socket.emit('subscribe:sensor', { sensorId });

    const handleSensorData = (data: SensorData) => {
      if (data.sensorId === sensorId) {
        setLatestData(data);

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
      socket.emit('unsubscribe:sensor', { sensorId });
      socket.off('sensor:data', handleSensorData);
    };
  }, [socket, sensorId, isConnected, mutate]);

  return {
    latestData,
    isConnected,
  };
}
