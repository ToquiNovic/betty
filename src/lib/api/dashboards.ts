import useSWR from 'swr';
import { fetcher, apiPost, apiPatch, apiDelete } from '@/lib/fetcher';
import {
  Dashboard,
  DashboardWidget,
  CreateDashboardDto,
  UpdateDashboardDto,
  CreateWidgetDto,
  UpdateWidgetDto,
} from '@/types';

export function useDashboards() {
  const { data, error, isLoading, mutate } = useSWR<Dashboard[]>('/dashboards', fetcher);
  return {
    dashboards: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useDashboard(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Dashboard>(
    id ? `/dashboards/${id}` : null,
    fetcher
  );
  return {
    dashboard: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function usePublicDashboards(limit = 20, offset = 0) {
  const { data, error, isLoading, mutate } = useSWR<Dashboard[]>(
    `/dashboards/public?limit=${limit}&offset=${offset}`,
    fetcher
  );
  return {
    dashboards: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function usePublicDashboard(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Dashboard>(
    id ? `/dashboards/public/${id}` : null,
    fetcher
  );
  return {
    dashboard: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export const dashboardApi = {
  create: (data: CreateDashboardDto) => apiPost<Dashboard>('/dashboards', data),
  update: (id: string, data: UpdateDashboardDto) => apiPatch<Dashboard>(`/dashboards/${id}`, data),
  delete: (id: string) => apiDelete<{ message: string }>(`/dashboards/${id}`),
  togglePublish: (id: string, isPublic: boolean) =>
    apiPatch<Dashboard>(`/dashboards/${id}/publish`, { isPublic }),

  // Widgets
  addWidget: (dashboardId: string, data: CreateWidgetDto) =>
    apiPost<DashboardWidget>(`/dashboards/${dashboardId}/widgets`, data),
  updateWidget: (dashboardId: string, widgetId: string, data: UpdateWidgetDto) =>
    apiPatch<DashboardWidget>(`/dashboards/${dashboardId}/widgets/${widgetId}`, data),
  deleteWidget: (dashboardId: string, widgetId: string) =>
    apiDelete<{ message: string }>(`/dashboards/${dashboardId}/widgets/${widgetId}`),
};
