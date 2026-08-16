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
