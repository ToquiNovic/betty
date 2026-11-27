import useSWR from 'swr';
import { fetcher, apiPost, apiPatch, apiDelete, ApiError } from '@/lib/fetcher';
import {
  Sensor,
  SensorData,
  CreateSensorDto,
  UpdateSensorDto,
  CreateSensorResponse,
  RotateApiKeyResponse,
  QuerySensorDataDto,
  LoraNetworkResponse,
  AdminSensorItem,
  CreateEmbedTokenDto,
  EmbedTokenResponse,
  PublicLatestSensorResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function usePublicLoraNetwork() {
  const { data, error, isLoading, mutate } = useSWR<LoraNetworkResponse>(
    '/sensors/public/lora-network',
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: true,
    }
  );
  return {
    network: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useAdminSensors(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const { data, error, isLoading, mutate } = useSWR<AdminSensorItem[]>(
    `/sensors/admin/all${query}`,
    fetcher
  );
  return {
    sensors: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

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

export async function createSensorEmbedToken(
  sensorId: string,
  dto: CreateEmbedTokenDto = {}
): Promise<EmbedTokenResponse> {
  return apiPost<EmbedTokenResponse, CreateEmbedTokenDto>(
    `/sensors/${encodeURIComponent(sensorId)}/embed-token`,
    dto
  );
}

export async function fetchPublicLatestSensorState(
  sensorId: string,
  options?: { token?: string; historyLimit?: number }
): Promise<PublicLatestSensorResponse> {
  const params = new URLSearchParams();
  if (options?.token) {
    params.set('token', options.token);
  }
  if (options?.historyLimit !== undefined) {
    params.set('historyLimit', String(options.historyLimit));
  }
  const queryString = params.toString();
  const baseUrl = API_BASE.replace(/\/+$/, '');
  const url = `${baseUrl}/sensors/${encodeURIComponent(sensorId)}/public-latest${
    queryString ? `?${queryString}` : ''
  }`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
  } catch (err: unknown) {
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? Array.isArray((body as { message: unknown }).message)
          ? (body as { message: unknown[] }).message.join(', ')
          : String((body as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, body);
  }

  if (
    body &&
    typeof body === 'object' &&
    'data' in body &&
    (body as { data?: unknown }).data !== undefined
  ) {
    return (body as { data: PublicLatestSensorResponse }).data;
  }

  return body as PublicLatestSensorResponse;
}

export const sensorApi = {
  create: (data: CreateSensorDto) => apiPost<CreateSensorResponse>('/sensors', data),
  update: (id: string, data: UpdateSensorDto) => apiPatch<Sensor>(`/sensors/${id}`, data),
  delete: (id: string) => apiDelete<{ message: string }>(`/sensors/${id}`),
  rotateApiKey: (id: string) => apiPost<RotateApiKeyResponse>(`/sensors/${id}/api-key/rotate`),
  revokeApiKey: (id: string) => apiPost<{ message: string }>(`/sensors/${id}/api-key/revoke`),
  createEmbedToken: (id: string, data?: CreateEmbedTokenDto) => createSensorEmbedToken(id, data),
};
