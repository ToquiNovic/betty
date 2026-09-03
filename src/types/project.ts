export type ProjectDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ChipFamily = 'ESP32' | 'ESP8266' | 'ESP32-S2' | 'ESP32-S3' | 'ESP32-C3' | 'other';
export type Model3DFormat = 'glb' | 'gltf' | 'stl';

export interface EstimatedTime {
  value: number;
  unit: string;
}

export interface ProjectStep {
  id: string;
  projectId: string;
  stepOrder: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
}

export interface ProjectMaterial {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  purchaseUrl?: string | null;
  imageUrl?: string | null;
  estimatedCost?: string | number | null;
  currency?: string;
  createdAt: string;
}

export interface ProjectFirmware {
  id: string;
  projectId: string;
  name: string;
  chipFamily: ChipFamily;
  version: string;
  firmwareUrl: string;
  flashOffset?: string;
  manifest?: Record<string, unknown> | null;
  flashInstructions?: string | null;
  fileSizeBytes?: number | null;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  slug?: string | null;
  description: string;
  coverImageUrl?: string | null;
  difficulty: ProjectDifficulty;
  boardType: string;
  estimatedTime: EstimatedTime;
  isPublished: boolean;
  model3dUrl?: string | null;
  model3dFormat?: Model3DFormat | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  stepsCount?: number;
  materialsCount?: number;
  hasFirmware?: boolean;
  has3DModel?: boolean;
  hasDigitalTwin?: boolean;
  creatorName?: string | null;
  creatorAvatar?: string | null;
  steps?: ProjectStep[];
  materials?: ProjectMaterial[];
  firmware?: ProjectFirmware[];
}

export interface ProjectFilters {
  difficulty?: ProjectDifficulty | 'all';
  boardType?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
