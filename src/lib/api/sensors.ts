import useSWR from 'swr';
import { fetcher, apiPost, apiPatch, apiDelete } from '@/lib/fetcher';
import {
  Sensor,
  SensorData,
  CreateSensorDto,
  UpdateSensorDto,
  CreateSensorResponse,
  RotateApiKeyResponse,
  QuerySensorDataDto,
} from '@/types';

export function useSensors() {
  const { data, error, isLoading, mutate } = useSWR<Sensor[]>('/sensors', fetcher);
  return {
    sensors: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useSensor(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Sensor>(
    id ? `/sensors/${id}` : null,
    fetcher
  );
  return {
    sensor: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useSensorData(id: string | null, params?: QuerySensorDataDto) {
  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';

  const { data, error, isLoading, mutate } = useSWR<SensorData[]>(
    id ? `/sensors/${id}/data${query}` : null,
    fetcher,
    {
      refreshInterval: 0, // Driven by WebSockets
      revalidateOnFocus: false,
    }
  );

  return {
    data: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export const sensorApi = {
  create: (data: CreateSensorDto) => apiPost<CreateSensorResponse>('/sensors', data),
  update: (id: string, data: UpdateSensorDto) => apiPatch<Sensor>(`/sensors/${id}`, data),
  delete: (id: string) => apiDelete<{ message: string }>(`/sensors/${id}`),
  rotateApiKey: (id: string) => apiPost<RotateApiKeyResponse>(`/sensors/${id}/api-key/rotate`),
  revokeApiKey: (id: string) => apiPost<{ message: string }>(`/sensors/${id}/api-key/revoke`),
};
