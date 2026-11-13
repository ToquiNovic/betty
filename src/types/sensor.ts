export type SensorStatus = 'active' | 'inactive' | 'revoked';
export type OriginType = 'sensor' | 'metaverso';

export interface Sensor {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  teamId: string | null;
  apiKeyHash?: string;
  apiKeyPrefix: string;
  mqttTopic: string;
  status: SensorStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SensorData {
  id: number;
  sensorId: string;
  originType: OriginType;
  payload: Record<string, unknown>;
  recordedAt: string;
  receivedAt: string;
}

export interface CreateSensorDto {
  name: string;
  description?: string;
  teamId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSensorDto {
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateSensorResponse extends Sensor {
  rawApiKey: string;
  warning: string;
}

export interface RotateApiKeyResponse {
  sensorId: string;
  rawApiKey: string;
  apiKeyPrefix: string;
  warning: string;
}

export interface QuerySensorDataDto {
  startDate?: string;
  endDate?: string;
  originType?: OriginType;
  limit?: number;
}

export interface AdminSensorItem {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  teamId: string | null;
  teamName?: string | null;
  apiKeyPrefix: string;
  mqttTopic: string;
  status: SensorStatus;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoraNetworkNode {
  id: string;
  name: string;
  description: string | null;
  status: SensorStatus;
  lat: number;
  lng: number;
  isLora: boolean;
  hardware: string;
  loraConfig: {
    frequency: string;
    spreading_factor: number;
    bandwidth: string;
    gateway_id: string;
    coverage_radius_meters: number;
  };
  rssi: number;
  snr: number;
  lastSeen: string;
  latestTelemetry: Record<string, any>;
}

export interface LoraGatewayInfo {
  id: string;
  name: string;
  model: string;
  frequency: string;
  lat: number;
  lng: number;
  coverageRadiusMeters: number;
  status: 'online' | 'offline' | 'degraded';
  connectedNodesCount: number;
  latestTelemetry?: Record<string, any>;
  rssi?: number;
  snr?: number;
  lastSeen?: string;
  description?: string | null;
}

export interface LoraNetworkResponse {
  gateway: LoraGatewayInfo;
  nodes: LoraNetworkNode[];
  networkStats: {
    totalNodes: number;
    activeNodes: number;
    avgRssi: number;
    frequency: string;
  };
}
