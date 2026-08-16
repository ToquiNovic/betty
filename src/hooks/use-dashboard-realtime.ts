'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import { SensorData } from '@/types';

export function useDashboardRealtime(dashboardId: string | null) {
  const { socket, isConnected } = useSocket();
  const [liveReadings, setLiveReadings] = useState<Record<string, SensorData>>({});

  useEffect(() => {
    if (!socket || !dashboardId || !isConnected) return;

    // Join all sensor rooms linked to this dashboard
    socket.emit('subscribe:dashboard', { dashboardId });

    const handleSensorData = (data: SensorData) => {
      setLiveReadings((prev) => ({
        ...prev,
        [data.sensorId]: data,
      }));
    };

    socket.on('sensor:data', handleSensorData);

    return () => {
      socket.off('sensor:data', handleSensorData);
    };
  }, [socket, dashboardId, isConnected]);

  const getReadingForSensor = useCallback(
    (sensorId: string) => {
      return liveReadings[sensorId];
    },
    [liveReadings]
  );

  return {
    liveReadings,
    getReadingForSensor,
    isConnected,
  };
}
