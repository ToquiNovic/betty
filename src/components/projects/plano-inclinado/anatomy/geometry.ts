import {
  circleRing,
  extrude,
  insetPlan,
  onTop,
  pathOf,
  planOutline,
  radialTicks,
  slabOf,
  type Flat,
  type Plan,
  type Point3,
  type SolidPaths,
} from '@/components/iso/iso-kit';
import { ANCHORS, at, PROJECTION } from './view';

const solid = (plan: Plan, z: number, h: number, steps = 6, bevel = 0) =>
  slabOf(plan, z, h, PROJECTION, steps, bevel);

const cyl = (cx: number, cy: number, r: number, z: number, h: number, steps = 24) =>
  extrude(circleRing(cx, cy, r, steps), z, h, PROJECTION, { convex: true });

const ring = (cx: number, cy: number, r: number, z: number, steps = 32) =>
  onTop(circleRing(cx, cy, r, steps), z, PROJECTION, true);

const segment = (a: Point3, b: Point3) => pathOf([at(a), at(b)]);
const join = (paths: string[]) => paths.join('');

const { base, nameplate, pivot, servo1, servo2, dial, esp32 } = ANCHORS;

/* =========================================================================
 * 1. Long Track Base Chassis & Leveling Feet
 * ========================================================================= */
const footPositions: [number, number][] = [
  [base.x + 22, base.y + 12],
  [base.x + base.w - 22, base.y + 12],
  [base.x + 22, base.y + base.d - 12],
  [base.x + base.w - 22, base.y + base.d - 12],
];

const feetSolids: SolidPaths[][] = footPositions.map(([fx, fy]) => [
  cyl(fx, fy, 7, -6, 6, 16),      // Rubber foot pad
  cyl(fx, fy, 4, 0, 1.5, 16),    // Threaded silver adjuster
]);

const baseSlab = solid(base, 0, base.h, 6, 1.2);
const baseGroove = planOutline(insetPlan(base, 4), base.h + 0.1, PROJECTION);

const screwCoords: Point3[] = [
  [base.x + 10, base.y + 8, base.h + 0.2],
  [base.x + base.w - 10, base.y + 8, base.h + 0.2],
  [base.x + 10, base.y + base.d - 8, base.h + 0.2],
  [base.x + base.w - 10, base.y + base.d - 8, base.h + 0.2],
];

const baseScrewPoints: Flat[] = screwCoords.map((p) => at(p));
const baseScrewRings = join(screwCoords.map(([x, y, z]) => ring(x, y, 2.2, z, 16)));

// Brass identification nameplate
const platePlan: Plan = {
  x: nameplate.x,
  y: nameplate.y,
  w: nameplate.w,
  d: nameplate.d,
  r: 2,
};
const plateSolid = solid(platePlan, nameplate.z, 1, 4);
const plateLine = planOutline(insetPlan(platePlan, 1.2), nameplate.z + 1.1, PROJECTION);
const plateRule = join([
  segment([nameplate.x + 8, nameplate.y + 5, nameplate.z + 1.1], [nameplate.x + nameplate.w - 8, nameplate.y + 5, nameplate.z + 1.1]),
  segment([nameplate.x + 8, nameplate.y + 9, nameplate.z + 1.1], [nameplate.x + nameplate.w - 8, nameplate.y + 9, nameplate.z + 1.1]),
]);
const plateRivetPoints: Flat[] = [
  at([nameplate.x + 3, nameplate.y + 3, nameplate.z + 1.1]),
  at([nameplate.x + nameplate.w - 3, nameplate.y + 3, nameplate.z + 1.1]),
  at([nameplate.x + 3, nameplate.y + nameplate.d - 3, nameplate.z + 1.1]),
  at([nameplate.x + nameplate.w - 3, nameplate.y + nameplate.d - 3, nameplate.z + 1.1]),
];

export const BASE_ART = {
  halo: baseSlab.fill,
  feet: feetSolids,
  slab: baseSlab,
  groove: baseGroove,
  screws: baseScrewPoints,
  screwRings: baseScrewRings,
  plate: plateSolid,
  plateLine,
  plateRule,
  plateRivets: plateRivetPoints,
};

/* =========================================================================
 * 2. Pivot Journals & Axle Pin
 * ========================================================================= */
const bracketY1 = -pivot.span / 2;
const bracketY2 = pivot.span / 2 - pivot.bracketThickness;

const leftBracketPlan: Plan = {
  x: pivot.x - 6,
  y: bracketY1,
  w: 12,
  d: pivot.bracketThickness,
  r: 2,
};
const rightBracketPlan: Plan = {
  x: pivot.x - 6,
  y: bracketY2,
  w: 12,
  d: pivot.bracketThickness,
  r: 2,
};

const leftBracketSolid = solid(leftBracketPlan, base.h, pivot.bracketHeight, 4);
const rightBracketSolid = solid(rightBracketPlan, base.h, pivot.bracketHeight, 4);

const leftBearing = cyl(pivot.x, bracketY1 + pivot.bracketThickness / 2, 5.5, pivot.z - 2, 4, 16);
const rightBearing = cyl(pivot.x, bracketY2 + pivot.bracketThickness / 2, 5.5, pivot.z - 2, 4, 16);

export const PIVOT_ART = {
  leftBracket: leftBracketSolid,
  rightBracket: rightBracketSolid,
  leftBearing,
  rightBearing,
  axlePointL: at([pivot.x, bracketY1 - 3, pivot.z]),
  axlePointR: at([pivot.x, bracketY2 + pivot.bracketThickness + 3, pivot.z]),
};

/* =========================================================================
 * 3. Dual MG996R Servomotors (Real Red & Black Case + Brass Horn)
 * ========================================================================= */
function buildServoArt(cfg: typeof servo1) {
  const bodyPlan: Plan = { x: cfg.x - cfg.w / 2, y: cfg.y - cfg.d / 2, w: cfg.w, d: cfg.d, r: 2 };
  const earPlan: Plan = { x: cfg.x - cfg.w / 2 - 3, y: cfg.y - cfg.d / 2, w: cfg.w + 6, d: cfg.d, r: 1.5 };

  // Black bottom & ears
  const earSolid = solid(earPlan, cfg.z, 3, 4);
  // Red middle case body (distinctive MG996R)
  const redBodySolid = solid(bodyPlan, cfg.z + 3, cfg.h - 8, 4);
  // Black top case
  const topCaseSolid = solid(bodyPlan, cfg.z + cfg.h - 5, 5, 4);

  // Brass output gear & horn disc
  const hornHub = cyl(cfg.x, cfg.y, 6.5, cfg.z + cfg.h, 2.5, 20);
  const hornArm = solid(
    { x: cfg.x - 3, y: cfg.y - 12, w: 6, d: 24, r: 2 },
    cfg.z + cfg.h + 2,
    2,
    4
  );

  const earScrews: Flat[] = [
    at([cfg.x - cfg.w / 2 - 1.5, cfg.y - cfg.d / 2 + 3, cfg.z + 3.2]),
    at([cfg.x - cfg.w / 2 - 1.5, cfg.y + cfg.d / 2 - 3, cfg.z + 3.2]),
    at([cfg.x + cfg.w / 2 + 1.5, cfg.y - cfg.d / 2 + 3, cfg.z + 3.2]),
    at([cfg.x + cfg.w / 2 + 1.5, cfg.y + cfg.d / 2 - 3, cfg.z + 3.2]),
  ];

  return {
    ears: earSolid,
    redBody: redBodySolid,
    topCase: topCaseSolid,
    hornHub,
    hornArm,
    screws: earScrews,
    hornCenter: [cfg.x, cfg.y, cfg.z + cfg.h + 3] as Point3,
  };
}

export const SERVO1_ART = buildServoArt(servo1);
export const SERVO2_ART = buildServoArt(servo2);

/* =========================================================================
 * 4. Precision Angle Dial Gauge (0° to 90°)
 * ========================================================================= */
const dialStem = cyl(dial.x, dial.y, 3.5, 0, dial.stemHeight, 16);
const dialCase = cyl(dial.x, dial.y, dial.diameter / 2, dial.stemHeight, dial.height, 32);
const dialBezel = ring(dial.x, dial.y, dial.diameter / 2 - 1.2, dial.stemHeight + dial.height + 0.1, 32);
const dialInnerFace = ring(dial.x, dial.y, dial.diameter / 2 - 3.2, dial.stemHeight + dial.height + 0.1, 32);

// Angle graduations (0 to 90 degrees)
const dialTicks = radialTicks(
  dial.x,
  dial.y,
  dial.diameter / 2 - 4,
  18, // 18 ticks = every 5 degrees
  2,  // major tick every 10 degrees
  dial.stemHeight + dial.height + 0.2,
  [1.5, 3.2],
  PROJECTION,
  0,
  Math.PI / 2
);

export const DIAL_ART = {
  stem: dialStem,
  casing: dialCase,
  bezel: dialBezel,
  innerFace: dialInnerFace,
  ticksMajor: dialTicks.major,
  ticksMinor: dialTicks.minor,
  center: [dial.x, dial.y, dial.stemHeight + dial.height + 0.3] as Point3,
  radius: dial.diameter / 2 - 5,
};

/* =========================================================================
 * 5. ESP32 Microcontroller Unit
 * ========================================================================= */
const pcbPlan: Plan = {
  x: esp32.x - esp32.w / 2,
  y: esp32.y - esp32.d / 2,
  w: esp32.w,
  d: esp32.d,
  r: 2,
};
const pcbSolid = solid(pcbPlan, 3, esp32.h, 4);

// Metal RF Canister Shield (ESP-WROOM-32)
const rfShieldPlan: Plan = {
  x: esp32.x - esp32.w / 2 + 5,
  y: esp32.y - esp32.d / 2 + 3,
  w: 18,
  d: 20,
  r: 1,
};
const rfShield = solid(rfShieldPlan, 3 + esp32.h, 2.5, 4);

// Micro USB / USB-C connector
const usbPlan: Plan = {
  x: esp32.x + esp32.w / 2 - 2,
  y: esp32.y - 4,
  w: 6,
  d: 8,
  r: 1,
};
const usbSocket = solid(usbPlan, 3 + esp32.h, 3, 4);

// 4 Corner Brass Standoffs
const standoffCoords: Point3[] = [
  [pcbPlan.x + 3, pcbPlan.y + 3, 0],
  [pcbPlan.x + pcbPlan.w - 3, pcbPlan.y + 3, 0],
  [pcbPlan.x + 3, pcbPlan.y + pcbPlan.d - 3, 0],
  [pcbPlan.x + pcbPlan.w - 3, pcbPlan.y + pcbPlan.d - 3, 0],
];
const standoffs = standoffCoords.map(([sx, sy, sz]) => cyl(sx, sy, 2, sz, 3, 12));

// Status LEDs (Power Red, TX Blue, RX Green)
const ledDots: Flat[] = [
  at([esp32.x + 8, esp32.y - 5, 3 + esp32.h + 0.2]),
  at([esp32.x + 13, esp32.y - 5, 3 + esp32.h + 0.2]),
  at([esp32.x + 18, esp32.y - 5, 3 + esp32.h + 0.2]),
];

// Dual pin headers
const pinHeaderL = segment(
  [pcbPlan.x + 2, pcbPlan.y + 2, 3 + esp32.h],
  [pcbPlan.x + pcbPlan.w - 2, pcbPlan.y + 2, 3 + esp32.h]
);
const pinHeaderR = segment(
  [pcbPlan.x + 2, pcbPlan.y + pcbPlan.d - 2, 3 + esp32.h],
  [pcbPlan.x + pcbPlan.w - 2, pcbPlan.y + pcbPlan.d - 2, 3 + esp32.h]
);

export const ESP32_ART = {
  standoffs,
  pcb: pcbSolid,
  shield: rfShield,
  usb: usbSocket,
  leds: ledDots,
  headers: join([pinHeaderL, pinHeaderR]),
  usbPortCenter: at([pcbPlan.x + pcbPlan.w + 4, esp32.y, 3 + esp32.h + 1.5]),
};
