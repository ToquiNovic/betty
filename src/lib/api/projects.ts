import useSWR from 'swr';
import {
  apiDelete,
  apiPatch,
  apiPost,
  apiPut,
  apiUpload,
  fetcher,
} from '../fetcher';
import {
  Project,
  ProjectFilters,
  ProjectMaterial,
  ProjectStep,
  ProjectFirmware,
} from '@/types/project';

/**
 * Hook for public project listing
 */
export function useProjects(filters?: ProjectFilters) {
  const query = new URLSearchParams();
  if (filters?.difficulty && filters.difficulty !== 'all') {
    query.set('difficulty', filters.difficulty);
  }
  if (filters?.boardType) query.set('boardType', filters.boardType);
  if (filters?.tag) query.set('tag', filters.tag);
  if (filters?.search) query.set('search', filters.search);
  if (filters?.limit) query.set('limit', String(filters.limit));
  if (filters?.offset) query.set('offset', String(filters.offset));

  const queryString = query.toString();
  const endpoint = `/projects${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<Project[]>(endpoint, fetcher);

  return {
    projects: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for single project detail (authenticated)
 */
export function useProject(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Project>(
    id ? `/projects/${id}` : null,
    fetcher,
  );

  return {
    project: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for admin projects listing (including drafts)
 */
export function useAdminProjects(filters?: ProjectFilters) {
  const query = new URLSearchParams();
  if (filters?.difficulty && filters.difficulty !== 'all') {
    query.set('difficulty', filters.difficulty);
  }
  if (filters?.boardType) query.set('boardType', filters.boardType);
  if (filters?.tag) query.set('tag', filters.tag);
  if (filters?.search) query.set('search', filters.search);

  const queryString = query.toString();
  const endpoint = `/admin/projects${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<Project[]>(endpoint, fetcher);

  return {
    projects: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/* =========================================================================
 * Admin Project Mutations
 * ========================================================================= */

export async function createProject(formData: FormData): Promise<Project> {
  return apiUpload<Project>('/admin/projects', formData, 'POST');
}

export async function updateProject(id: string, formData: FormData): Promise<Project> {
  return apiUpload<Project>(`/admin/projects/${id}`, formData, 'PATCH');
}

export async function deleteProject(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/admin/projects/${id}`);
}

export async function toggleProjectPublish(id: string, isPublished: boolean): Promise<Project> {
  return apiPatch<Project>(`/admin/projects/${id}/publish`, { isPublished });
}

export async function upload3DModel(projectId: string, file: File): Promise<Project> {
  const formData = new FormData();
  formData.append('model', file);
  return apiUpload<Project>(`/admin/projects/${projectId}/model`, formData, 'POST');
}

export async function delete3DModel(projectId: string): Promise<Project> {
  return apiDelete<Project>(`/admin/projects/${projectId}/model`);
}

/* Steps */
export async function addProjectStep(projectId: string, formData: FormData): Promise<ProjectStep> {
  return apiUpload<ProjectStep>(`/admin/projects/${projectId}/steps`, formData, 'POST');
}

export async function updateProjectStep(
  projectId: string,
  stepId: string,
  formData: FormData,
): Promise<ProjectStep> {
  return apiUpload<ProjectStep>(`/admin/projects/${projectId}/steps/${stepId}`, formData, 'PATCH');
}

export async function deleteProjectStep(
  projectId: string,
  stepId: string,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/admin/projects/${projectId}/steps/${stepId}`);
}

export async function reorderProjectSteps(
  projectId: string,
  stepIds: string[],
): Promise<ProjectStep[]> {
  return apiPut<ProjectStep[]>(`/admin/projects/${projectId}/steps/reorder`, { stepIds });
}

/* Materials */
export async function addProjectMaterial(
  projectId: string,
  formData: FormData,
): Promise<ProjectMaterial> {
  return apiUpload<ProjectMaterial>(`/admin/projects/${projectId}/materials`, formData, 'POST');
}

export async function updateProjectMaterial(
  projectId: string,
  materialId: string,
  formData: FormData,
): Promise<ProjectMaterial> {
  return apiUpload<ProjectMaterial>(
    `/admin/projects/${projectId}/materials/${materialId}`,
    formData,
    'PATCH',
  );
}

export async function deleteProjectMaterial(
  projectId: string,
  materialId: string,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/admin/projects/${projectId}/materials/${materialId}`);
}

/* Firmware */
export async function addProjectFirmware(
  projectId: string,
  formData: FormData,
): Promise<ProjectFirmware> {
  return apiUpload<ProjectFirmware>(`/admin/projects/${projectId}/firmware`, formData, 'POST');
}

export async function deleteProjectFirmware(
  projectId: string,
  firmwareId: string,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/admin/projects/${projectId}/firmware/${firmwareId}`);
}
