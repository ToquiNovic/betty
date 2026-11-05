import { iso, type Flat, type Point3, type Projection } from '@/components/iso/iso-kit';

export const VIEW_WIDTH = 760;
export const VIEW_HEIGHT = 460;

/**
 * Isometric camera calibrated to match the 3D perspective of plano_inclinado.glb
 */
export const PROJECTION: Projection = {
  origin: [380, 275],
  scale: 1.18,
  azimuth: 42,
  elevation: 26,
};

/**
 * Convenience projection wrapper.
 */
export function at(p: Point3): Flat {
  return iso(p, PROJECTION);
}

/**
 * Coordinate landmarks in world space (mm).
 * Exactly matching the long-chassis physical geometry in plano_inclinado.glb
 */
export const ANCHORS = {
  // Long base chassis plank
  base: { x: -140, y: -24, w: 275, d: 48, h: 10, r: 4 },

  // Pivot journal brackets and axle (at right end)
  pivot: {
    x: 95,
    y: 0,
    z: 22,
    bracketThickness: 6,
    bracketHeight: 26,
    span: 52,
    axleRadius: 3,
  },

  // Incline ramp beam (tilts from pivot at x=95 toward the left)
  ramp: {
    length: 220,
    width: 36,
    thickness: 7,
    stopHeight: 14,
  },

  // Dual servomotors MG996R (flanking the pivot axle)
  servo1: { x: 95, y: -38, z: 10, w: 38, d: 18, h: 32 },
  servo2: { x: 95, y: 38, z: 10, w: 38, d: 18, h: 32 },

  // Precision angle dial gauge (0° to 90°)
  dial: { x: -25, y: -50, z: 0, diameter: 44, height: 16, stemHeight: 12 },

  // ESP32 microelectronics on standoff risers
  esp32: { x: -15, y: 44, z: 0, w: 48, d: 26, h: 4 },

  // Brass engraved identification plate
  nameplate: { x: -125, y: -48, w: 62, d: 14, z: 0 },
};
