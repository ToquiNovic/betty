/**
 * Pure physical and mathematical model for the Plano Inclinado Anatomy Figure.
 * Independent of DOM / React rendering.
 */

export type AnatomyEasing = 'CUBIC' | 'SMOOTHERSTEP' | 'SINE' | 'QUAD' | 'LINEAR';

export interface PlanoModelInputs {
  angle: number; // 0 to 75 degrees
  easing?: AnatomyEasing;
  cargoMassKg?: number; // default ~0.25 kg
  staticFrictionCoeff?: number; // default ~0.58 (wood on aluminum)
}

export interface PlanoModelState {
  angle: number; // current angle degrees (0 - 75)
  rad: number;
  servo1Angle: number; // degrees
  servo2Angle: number; // degrees (symmetric: 180 - servo1)
  torqueNm: number; // Servo holding torque (Nm)
  slipAngle: number; // Critical angle where cargo begins sliding
  isSliding: boolean;
  slideProgress: number; // 0 (top rest) to 1 (slid down)
  normalForceN: number;
  parallelForceN: number;
  frictionForceN: number;
  easing: AnatomyEasing;
}

export const GRAVITY = 9.81; // m/s^2
export const DEFAULT_FRICTION = 0.58; // wood on aluminum
export const DEFAULT_MASS = 0.28; // kg
export const CRITICAL_SLIP_ANGLE = Math.round((Math.atan(DEFAULT_FRICTION) * 180) / Math.PI * 10) / 10; // ~30.1°

/**
 * Computes the easing interpolation value f(t) for t in [0, 1].
 */
export function evaluateEasing(type: AnatomyEasing, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (type) {
    case 'CUBIC':
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
    case 'SMOOTHERSTEP':
      // Ken Perlin quintic: 6t^5 - 15t^4 + 10t^3 (zero jerk at t=0 and t=1)
      return (
        clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10)
      );
    case 'SINE':
      return (1 - Math.cos(Math.PI * clamped)) / 2;
    case 'QUAD':
      // Smoothstep 3t^2 - 2t^3
      return clamped * clamped * (3 - 2 * clamped);
    case 'LINEAR':
    default:
      return clamped;
  }
}

/**
 * Resolves the physical state from inputs.
 */
export function computePlanoState(inputs: PlanoModelInputs): PlanoModelState {
  const angle = Math.max(0, Math.min(75, inputs.angle));
  const rad = (angle * Math.PI) / 180;
  const mass = inputs.cargoMassKg ?? DEFAULT_MASS;
  const mu = inputs.staticFrictionCoeff ?? DEFAULT_FRICTION;
  const slipAngle = Math.atan(mu) * (180 / Math.PI);
  const isSliding = angle > slipAngle;

  const normalForceN = mass * GRAVITY * Math.cos(rad);
  const parallelForceN = mass * GRAVITY * Math.sin(rad);
  const maxFrictionN = mu * normalForceN;
  const frictionForceN = isSliding ? 0.85 * maxFrictionN : Math.min(parallelForceN, maxFrictionN);

  // Servo dynamics: Base holding torque + arm mechanical load * cos(angle)
  const torqueNm = 0.35 + 1.15 * Math.cos(rad);

  // Sliding progress on ramp (0 = upper rest, 1 = slid to bottom stop)
  const slideProgress = isSliding
    ? Math.min(1, Math.max(0, (angle - slipAngle) / (75 - slipAngle)))
    : 0;

  return {
    angle,
    rad,
    servo1Angle: Math.round(angle * 10) / 10,
    servo2Angle: Math.round((180 - angle) * 10) / 10,
    torqueNm: Math.round(torqueNm * 100) / 100,
    slipAngle: Math.round(slipAngle * 10) / 10,
    isSliding,
    slideProgress,
    normalForceN: Math.round(normalForceN * 100) / 100,
    parallelForceN: Math.round(parallelForceN * 100) / 100,
    frictionForceN: Math.round(frictionForceN * 100) / 100,
    easing: inputs.easing ?? 'SMOOTHERSTEP',
  };
}

/**
 * Returns formatted readout string for Anatomy card corner.
 */
export function formatPlanoReadout(state: PlanoModelState): string {
  const slipStatus = state.isSliding
    ? `· DESLIZAMIENTO (>${state.slipAngle}°)`
    : `· ESTÁTICO (μ ${DEFAULT_FRICTION})`;

  return `θ ${state.angle.toFixed(1)}° · S1: ${state.servo1Angle}° / S2: ${state.servo2Angle}° · τ ${state.torqueNm} N·m ${slipStatus}`;
}
