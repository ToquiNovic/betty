import { useAuthStore } from '@/stores/auth-store';
import { ApiResponse, TokenPair } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

async function refreshToken(): Promise<string | null> {
  const { refreshToken, logout, setTokens } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      logout();
      return null;
    }

    const json: ApiResponse<TokenPair> = await res.json();
    setTokens(json.data);
    return json.data.accessToken;
  } catch {
    logout();
    return null;
  }
}

export async function fetcher<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (err: unknown) {
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }

  // Handle 401 Unauthorized - Attempt token refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
    if (isRefreshing) {
      try {
        await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        // Retry with new token
        const newAccessToken = useAuthStore.getState().accessToken;
        if (newAccessToken) {
          headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        response = await fetch(url, { ...init, headers });
      } catch {
        throw new ApiError(401, 'Unauthorized');
      }
    } else {
      isRefreshing = true;
      try {
        const newAccessToken = await refreshToken();
        if (newAccessToken) {
          processQueue(null);
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(url, { ...init, headers });
        } else {
          processQueue(new Error('Refresh failed'));
          throw new ApiError(401, 'Session expired');
        }
      } finally {
        isRefreshing = false;
      }
    }
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : String(data.message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  // If response is wrapped in standard API envelope ApiResponse<T>, unwrap data
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

export async function apiPost<T, B = unknown>(endpoint: string, body?: B): Promise<T> {
  return fetcher<T>(endpoint, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T, B = unknown>(endpoint: string, body?: B): Promise<T> {
  return fetcher<T>(endpoint, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T, B = unknown>(endpoint: string, body?: B): Promise<T> {
  return fetcher<T>(endpoint, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  return fetcher<T>(endpoint, {
    method: 'DELETE',
  });
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PATCH' | 'PUT' = 'POST',
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : String(data.message)
        : `Upload failed with status ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

