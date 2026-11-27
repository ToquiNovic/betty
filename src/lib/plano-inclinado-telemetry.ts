export type EasingType = 'CUBIC' | 'SMOOTHERSTEP' | 'SINE' | 'QUAD' | 'LINEAR';

export type ControlMode = 'virtual' | 'physical' | 'auto';

export type EmbedViewMode = 'math' | 'math_chart' | 'full';

export type ExperimentState = 'idle' | 'running' | 'slip_detected' | 'paused';

export type TelemetryOriginType = 'sensor' | 'metaverso';

export const EASING_TYPES: readonly EasingType[] = [
  'CUBIC',
  'SMOOTHERSTEP',
  'SINE',
  'QUAD',
  'LINEAR',
];

export const CONTROL_MODES: readonly ControlMode[] = ['auto', 'virtual', 'physical'];

export const EMBED_VIEW_MODES: readonly EmbedViewMode[] = ['math', 'math_chart', 'full'];

export const EXPERIMENT_STATES: readonly ExperimentState[] = [
  'idle',
  'running',
  'slip_detected',
  'paused',
];

export interface InclinedPlanePhysics {
  rad: number;
  tanTheta: number;
  parallelRatio: number;
  normalRatio: number;
  criticalMuS: number;
}

export interface NormalizedPlanoTelemetry {
  hasKinematics: boolean;
  plankAngle?: number;
  servo1?: number;
  servo2?: number;
  targetAngle?: number;
  cubeDetected?: boolean;
  slipAngle?: number;
  muS?: number;
  angularVelocity?: number;
  normalForceRatio?: number;
  parallelForceRatio?: number;
  easingType?: EasingType;
  controlMode?: ControlMode;
  viewMode?: EmbedViewMode;
  experimentState?: ExperimentState;
  originType?: TelemetryOriginType;
  ephemeral?: boolean;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined;
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return undefined;
}

export function parseEasingType(value: unknown): EasingType | undefined {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim().toUpperCase() as EasingType;
  return EASING_TYPES.includes(candidate) ? candidate : undefined;
}

export function parseControlMode(value: unknown): ControlMode | undefined {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim().toLowerCase() as ControlMode;
  return CONTROL_MODES.includes(candidate) ? candidate : undefined;
}

export function parseEmbedViewMode(value: unknown): EmbedViewMode | undefined {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim().toLowerCase() as EmbedViewMode;
  return EMBED_VIEW_MODES.includes(candidate) ? candidate : undefined;
}

export function parseExperimentState(value: unknown): ExperimentState | undefined {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim().toLowerCase() as ExperimentState;
  return EXPERIMENT_STATES.includes(candidate) ? candidate : undefined;
}

export function parseOriginType(value: unknown): TelemetryOriginType | undefined {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim().toLowerCase();
  if (candidate === 'sensor' || candidate === 'metaverso') {
    return candidate;
  }
  return undefined;
}

export function computeInclinedPlanePhysics(
  plankAngle: number,
  slipAngle = 0
): InclinedPlanePhysics {
  const safePlank = Number.isFinite(plankAngle) ? plankAngle : 0;
  const safeSlip = Number.isFinite(slipAngle) ? slipAngle : 0;

  const rad = (safePlank * Math.PI) / 180;
  const tanTheta = Math.tan(rad);
  const parallelRatio = Math.sin(rad);
  const normalRatio = Math.cos(rad);
  const criticalMuS = safeSlip > 0 ? Math.tan((safeSlip * Math.PI) / 180) : 0;

  return {
    rad,
    tanTheta,
    parallelRatio,
    normalRatio,
    criticalMuS,
  };
}

export function evaluateEasing(easingType: EasingType, rawT: number): number {
  const t = Number.isFinite(rawT) ? Math.max(0, Math.min(1, rawT)) : 0;
  switch (easingType) {
    case 'SMOOTHERSTEP':
      return t * t * t * (t * (t * 6 - 15) + 10);
    case 'SINE':
      return (1 - Math.cos(Math.PI * t)) / 2;
    case 'QUAD':
      return 3 * t * t - 2 * t * t * t;
    case 'LINEAR':
      return t;
    case 'CUBIC':
    default:
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

export function shouldAcceptTelemetryForMode(
  activeControlMode: ControlMode,
  incomingOriginType?: TelemetryOriginType | null
): boolean {
  if (activeControlMode === 'auto') {
    return true;
  }
  if (activeControlMode === 'virtual') {
    return incomingOriginType === 'metaverso';
  }
  if (activeControlMode === 'physical') {
    return incomingOriginType === 'sensor';
  }
  return true;
}

export function normalizePlanoInclinadoPayload(
  rawPayload: unknown,
  maxPlankAngle = 30,
  originType?: TelemetryOriginType | string | null
): NormalizedPlanoTelemetry {
  const fallbackOrigin = parseOriginType(originType);

  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    return {
      hasKinematics: false,
      originType: fallbackOrigin,
    };
  }

  const outer = rawPayload as Record<string, unknown>;
  const rawMetrics = outer.metrics;
  const metrics =
    rawMetrics && typeof rawMetrics === 'object' && !Array.isArray(rawMetrics)
      ? (rawMetrics as Record<string, unknown>)
      : null;

  const source: Record<string, unknown> = metrics ? { ...metrics, ...outer } : outer;

  const safeMaxPlank =
    Number.isFinite(maxPlankAngle) && maxPlankAngle > 0 ? maxPlankAngle : 30;

  const rawPlank = toFiniteNumber(source.plank_angle);
  const rawServo1 = toFiniteNumber(source.servo1);
  const rawServo2 = toFiniteNumber(source.servo2);
  const targetAngle = toFiniteNumber(source.target_angle) ?? toFiniteNumber(source.target);
  const slipAngle = toFiniteNumber(source.slip_angle);
  const rawMuS = toFiniteNumber(source.mu_s);
  const angularVelocity = toFiniteNumber(source.angular_velocity);
  const cubeDetected =
    toOptionalBoolean(source.cube_detected) ??
    (source.sensor_digital !== undefined ? toOptionalBoolean(source.sensor_digital) : undefined);

  let plankAngle = rawPlank;
  let servo1 = rawServo1;

  if (plankAngle !== undefined && servo1 === undefined) {
    servo1 = (plankAngle / safeMaxPlank) * 180;
  } else if (plankAngle === undefined && servo1 !== undefined) {
    plankAngle = (servo1 / 180) * safeMaxPlank;
  }

  const servo2 = rawServo2 ?? (servo1 !== undefined ? 180 - servo1 : undefined);

  const muS =
    rawMuS !== undefined
      ? rawMuS
      : slipAngle !== undefined
      ? slipAngle > 0
        ? Math.tan((slipAngle * Math.PI) / 180)
        : 0
      : undefined;

  const physics =
    plankAngle !== undefined
      ? computeInclinedPlanePhysics(plankAngle, slipAngle ?? 0)
      : undefined;

  const normalForceRatio =
    toFiniteNumber(source.normal_force_ratio) ?? physics?.normalRatio;
  const parallelForceRatio =
    toFiniteNumber(source.parallel_force_ratio) ?? physics?.parallelRatio;

  const hasKinematics =
    plankAngle !== undefined ||
    servo1 !== undefined ||
    slipAngle !== undefined ||
    cubeDetected !== undefined ||
    angularVelocity !== undefined;

  return {
    hasKinematics,
    plankAngle,
    servo1,
    servo2,
    targetAngle,
    cubeDetected,
    slipAngle,
    muS,
    angularVelocity,
    normalForceRatio,
    parallelForceRatio,
    easingType: parseEasingType(source.easing_type),
    controlMode: parseControlMode(source.control_mode),
    viewMode: parseEmbedViewMode(source.view_mode),
    experimentState: parseExperimentState(source.experiment_state),
    originType: parseOriginType(source.origin_type) ?? fallbackOrigin,
    ephemeral: toOptionalBoolean(source.ephemeral),
  };
}
