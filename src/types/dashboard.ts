import { SensorData } from './sensor';

export type WidgetType = 'line_chart' | 'gauge' | 'table' | 'map' | 'metric' | 'bar_chart';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface WidgetConfig {
  metricKey?: string;
  unit?: string;
  min?: number;
  max?: number;
  color?: string;
  timeRange?: string; // '1h' | '24h' | '7d' | '30d'
  latKey?: string;
  lngKey?: string;
  columns?: string[];
  [key: string]: unknown;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  sensorId: string;
  widgetType: WidgetType;
  title: string;
  config: WidgetConfig;
  position: WidgetPosition;
  createdAt: string;
  latestReading?: SensorData;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  layout: unknown[];
  isPublic: boolean;
  widgets?: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDashboardDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateDashboardDto {
  name?: string;
  description?: string;
  layout?: unknown[];
  isPublic?: boolean;
}

export interface CreateWidgetDto {
  sensorId: string;
  widgetType: WidgetType;
  title: string;
  config?: WidgetConfig;
  position?: WidgetPosition;
}

export interface UpdateWidgetDto {
  title?: string;
  config?: WidgetConfig;
  position?: WidgetPosition;
}
