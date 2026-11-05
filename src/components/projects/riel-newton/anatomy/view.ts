import { iso, type Flat, type Point3, type Projection } from '@/components/iso/iso-kit';

export const VIEW_WIDTH = 760;
export const VIEW_HEIGHT = 460;

/**
 * Isometric camera calibrated to match the exact perspective of riel_newton.glb
 * Showing the long black test bench, elevated linear rail, pneumatic launcher cylinder on the right,
 * and onboard instrumented glider with blue SG90 micro-servo.
 */
export const PROJECTION: Projection = {
  origin: [380, 255],
  scale: 1.15,
  azimuth: 42,
  elevation: 24,
};

/**
 * Convenience projection wrapper.
 */
export function at(p: Point3): Flat {
  return iso(p, PROJECTION);
}

/**
 * Coordinate landmarks in world space (mm).
 * Rigorously extracted from riel_newton.glb mesh geometries:
 * - Cube.028 (Base Bench Table)
 * - Cube.030 (4 Support Legs)
 * - Plane.002 / Cube.014 (Elevated Linear Guide Rail)
 * - Cube.034 (Left End Bracket)
 * - Cylinder.001 & Cylinder.004 (Right Pneumatic / Solenoid Launcher Barrel & Chrome Piston)
 * - GONDS_Metal.002 + SG90 Blue Servo (Onboard Mobile Glider)
 */
export const ANCHORS = {
  // Heavy solid black bench table (Cube.028)
  bench: {
    x: -165,
    y: -26,
    w: 330,
    d: 52,
    h: 12,
    r: 2,
  },

  // 4 Square support legs (Cube.030)
  legs: [
    { x: -155, y: -20 },
    { x: -155, y: 16 },
    { x: 145, y: -20 },
    { x: 145, y: 16 },
  ],
  legSize: 10,
  legHeight: 22,

  // Elevated linear guide rail (Plane.002) suspended above bench
  rail: {
    x: -140,
    y: -7,
    w: 245,
    d: 14,
    z: 14, // elevated 14mm above table top
    h: 10,
    slotWidth: 4,
  },

  // Left upright stop / mounting bracket (Cube.034)
  leftBracket: {
    x: -148,
    y: -12,
    w: 12,
    d: 24,
    z: 12,
    h: 20,
  },

  // Right Pneumatic Launcher Barrel & Piston Shaft (Cylinder.001 & Cylinder.004)
  launcher: {
    barrelX: 105,
    barrelY: 0,
    barrelZ: 19,
    barrelRadius: 7.5,
    barrelLength: 50,
    pistonRadius: 3.5,
    pistonLength: 28,
  },

  // Mobile glider carriage running along the rail (GONDS_Metal.002)
  glider: {
    minX: -130, // near left stop
    maxX: 95,   // near launcher nozzle
    length: 44,
    width: 28,
    height: 12,
  },

  // Onboard TowerPro SG90 blue micro-servo mounted on glider
  sg90: {
    w: 23,
    d: 12,
    h: 22,
    hornRadius: 4.5,
  },

  // Onboard digital LCD / Sensor display unit on glider (lcd.obj.cleaner)
  onboardLcd: {
    w: 20,
    d: 14,
    h: 8,
    screenWidth: 16,
    screenHeight: 10,
  },

  // Brass engraved identification plate on bench edge
  nameplate: {
    x: -150,
    y: 18,
    w: 56,
    d: 14,
    z: 12,
  },
};
