/**
 * Physics and Metrology Model for the Newton Air Track (Riel de Newton)
 * Rigorously implementing Newton's Second Law and Photogate transit kinematics.
 */

export const GRAVITY = 9.80665; // m/s^2

export interface NewtonState {
  cartMassKg: number; // m1 (e.g. 0.150 kg)
  hangingMassKg: number; // m2 (e.g. 0.050 kg)
  cartPositionMm: number; // 0 to 235 mm
  accelerationTheoretical: number; // a = (m2 * g) / (m1 + m2) m/s^2
  currentVelocity: number; // v(x) m/s
  v1Gate: number; // Velocity at photogate 1 (m/s)
  v2Gate: number; // Velocity at photogate 2 (m/s)
  t1TransitMs: number; // Flag transit time through gate 1 (ms)
  t2TransitMs: number; // Flag transit time through gate 2 (ms)
  elapsedTimeMs: number; // Total run time
  gate1Interrupted: boolean;
  gate2Interrupted: boolean;
}

export const GATE1_POS_MM = 80; // Distance from rest to gate 1
export const GATE2_POS_MM = 185; // Distance from rest to gate 2
export const FLAG_WIDTH_MM = 15; // Width of optical interrupt blade

/**
 * Computes exact analytical kinematics for the Newton Track rig
 */
export function computeNewtonKinematics(
  cartPositionMm: number,
  cartMassKg = 0.15,
  hangingMassKg = 0.05
): NewtonState {
  const m1 = Math.max(0.05, cartMassKg);
  const m2 = Math.max(0.01, hangingMassKg);

  // a = (m2 * g) / (m1 + m2)
  const a = (m2 * GRAVITY) / (m1 + m2);

  // Position in meters
  const xM = Math.max(0, cartPositionMm) / 1000;

  // Instantaneous velocity v = sqrt(2 * a * x)
  const v = Math.sqrt(2 * a * xM);

  // Kinematics at Gate 1
  const x1M = GATE1_POS_MM / 1000;
  const v1 = Math.sqrt(2 * a * x1M);
  const t1TransitMs = (FLAG_WIDTH_MM / 1000 / v1) * 1000;

  // Kinematics at Gate 2
  const x2M = GATE2_POS_MM / 1000;
  const v2 = Math.sqrt(2 * a * x2M);
  const t2TransitMs = (FLAG_WIDTH_MM / 1000 / v2) * 1000;

  // Elapsed time to current position t = sqrt(2 * x / a)
  const elapsedMs = Math.sqrt((2 * xM) / a) * 1000;

  // Gate beam interruption flags
  const g1Start = GATE1_POS_MM - 2;
  const g1End = GATE1_POS_MM + FLAG_WIDTH_MM;
  const gate1Interrupted = cartPositionMm >= g1Start && cartPositionMm <= g1End;

  const g2Start = GATE2_POS_MM - 2;
  const g2End = GATE2_POS_MM + FLAG_WIDTH_MM;
  const gate2Interrupted = cartPositionMm >= g2Start && cartPositionMm <= g2End;

  return {
    cartMassKg: m1,
    hangingMassKg: m2,
    cartPositionMm,
    accelerationTheoretical: Math.round(a * 1000) / 1000,
    currentVelocity: Math.round(v * 1000) / 1000,
    v1Gate: Math.round(v1 * 1000) / 1000,
    v2Gate: Math.round(v2 * 1000) / 1000,
    t1TransitMs: Math.round(t1TransitMs * 10) / 10,
    t2TransitMs: Math.round(t2TransitMs * 10) / 10,
    elapsedTimeMs: Math.round(elapsedMs),
    gate1Interrupted,
    gate2Interrupted,
  };
}

/**
 * Format readout according to the Anatomy standard plate specification
 */
export function formatNewtonReadout(state: NewtonState): string {
  const gateStatus = state.gate2Interrupted
    ? '· GATE 2 ACTIVO'
    : state.gate1Interrupted
    ? '· GATE 1 ACTIVO'
    : '· EN ESPERA';

  return `a: ${state.accelerationTheoretical.toFixed(2)} m/s² · v: ${state.currentVelocity.toFixed(2)} m/s · Δt₁: ${state.t1TransitMs.toFixed(1)} ms · Δt₂: ${state.t2TransitMs.toFixed(1)} ms ${gateStatus}`;
}
