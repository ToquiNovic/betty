import {
  circleRing,
  extrude,
  insetPlan,
  onTop,
  pathOf,
  planOutline,
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

const segment = (a: Point3, b: Point3) => pathOf([at(a), at(b)]);
const join = (paths: string[]) => paths.join('');

const { bench, legs, legSize, legHeight, rail, leftBracket, launcher, nameplate } = ANCHORS;

/* =========================================================================
 * 1. Heavy Black Bench Table (Cube.028) & 4 Support Legs (Cube.030)
 * ========================================================================= */
const benchSlab = solid(bench, 0, bench.h, 4, 1.2);
const benchGroove = planOutline(insetPlan(bench, 3), bench.h + 0.1, PROJECTION);

// 4 Square support legs beneath the bench
const legSolids: SolidPaths[] = legs.map((pos) =>
  solid(
    { x: pos.x, y: pos.y, w: legSize, d: legSize, r: 1 },
    -legHeight,
    legHeight
  )
);

// Brass identification nameplate on front corner
const platePlan: Plan = {
  x: nameplate.x,
  y: nameplate.y,
  w: nameplate.w,
  d: nameplate.d,
  r: 2,
};
const plateSlab = solid(platePlan, bench.h, 1.2, 4, 0.4);
const plateLine = planOutline(insetPlan(platePlan, 1.5), bench.h + 1.3, PROJECTION);
const plateRule = segment(
  [nameplate.x + 4, nameplate.y + nameplate.d / 2, bench.h + 1.3],
  [nameplate.x + nameplate.w - 4, nameplate.y + nameplate.d / 2, bench.h + 1.3]
);
const plateRivets: Flat[] = [
  at([nameplate.x + 3, nameplate.y + 3, bench.h + 1.35]),
  at([nameplate.x + nameplate.w - 3, nameplate.y + 3, bench.h + 1.35]),
  at([nameplate.x + 3, nameplate.y + nameplate.d - 3, bench.h + 1.35]),
  at([nameplate.x + nameplate.w - 3, nameplate.y + nameplate.d - 3, bench.h + 1.35]),
];

export const BENCH_ART = {
  slab: benchSlab,
  groove: benchGroove,
  legs: legSolids,
  plate: plateSlab,
  plateLine,
  plateRule,
  plateRivets,
};

/* =========================================================================
 * 2. Elevated Linear Guide Rail (Plane.002 / Cube.014)
 * ========================================================================= */
// Rail riser supports that suspend the track above the bench
const railRisers = [
  solid({ x: rail.x + 4, y: -5, w: 12, d: 10, r: 1 }, bench.h, rail.z - bench.h),
  solid({ x: rail.x + rail.w / 2 - 6, y: -5, w: 12, d: 10, r: 1 }, bench.h, rail.z - bench.h),
  solid({ x: rail.x + rail.w - 16, y: -5, w: 12, d: 10, r: 1 }, bench.h, rail.z - bench.h),
];

// Main elevated rail beam
const railBeam = solid(
  { x: rail.x, y: rail.y, w: rail.w, d: rail.d, r: 1.5 },
  rail.z,
  rail.h,
  4,
  0.6
);

// Central guide slot / groove
const railSlot = segment(
  [rail.x + 6, 0, rail.z + rail.h + 0.1],
  [rail.x + rail.w - 6, 0, rail.z + rail.h + 0.1]
);

// Millimeter ticks on top face of the elevated rail
const railTicks: string[] = [];
for (let x = rail.x + 10; x <= rail.x + rail.w - 10; x += 6) {
  const isMajor = (x - rail.x) % 30 === 0;
  const tickLen = isMajor ? 3 : 1.5;
  railTicks.push(
    segment([x, rail.y + 2, rail.z + rail.h + 0.1], [x, rail.y + 2 + tickLen, rail.z + rail.h + 0.1])
  );
}

export const RAIL_ART = {
  risers: railRisers,
  beam: railBeam,
  slot: railSlot,
  ticks: join(railTicks),
};

/* =========================================================================
 * 3. Left Upright Stop Bracket (Cube.034)
 * ========================================================================= */
const leftBracketSolid = solid(
  {
    x: leftBracket.x,
    y: leftBracket.y,
    w: leftBracket.w,
    d: leftBracket.d,
    r: 1.5,
  },
  leftBracket.z,
  leftBracket.h
);

const leftBracketPad = solid(
  {
    x: leftBracket.x + leftBracket.w - 2,
    y: leftBracket.y + 4,
    w: 2,
    d: leftBracket.d - 8,
    r: 0.5,
  },
  leftBracket.z + 4,
  leftBracket.h - 8
);

export const LEFT_BRACKET_ART = {
  solid: leftBracketSolid,
  pad: leftBracketPad,
};

/* =========================================================================
 * 4. Right Pneumatic/Solenoid Launcher Barrel & Chrome Piston (Cylinder.001 / .004)
 * ========================================================================= */
// Mounting cradle at the right end connecting the barrel to the elevated rail
const launcherCradle = solid(
  {
    x: launcher.barrelX - 8,
    y: launcher.barrelY - 10,
    w: 14,
    d: 20,
    r: 1.5,
  },
  bench.h,
  launcher.barrelZ - bench.h + 4
);

// Barrel cylinder (horizontal along X-axis, drawn as extrusion block/cyl)
const barrelSolid = solid(
  {
    x: launcher.barrelX,
    y: launcher.barrelY - launcher.barrelRadius,
    w: launcher.barrelLength,
    d: launcher.barrelRadius * 2,
    r: launcher.barrelRadius,
  },
  launcher.barrelZ - launcher.barrelRadius,
  launcher.barrelRadius * 2,
  8
);

// Brass end ring / seal collar on barrel
const barrelCollar = solid(
  {
    x: launcher.barrelX + launcher.barrelLength - 3,
    y: launcher.barrelY - launcher.barrelRadius - 1,
    w: 3,
    d: (launcher.barrelRadius + 1) * 2,
    r: launcher.barrelRadius + 1,
  },
  launcher.barrelZ - launcher.barrelRadius - 1,
  (launcher.barrelRadius + 1) * 2,
  8
);

// Telescopic Chrome / Silver Piston Rod extending out to the right
const pistonX = launcher.barrelX + launcher.barrelLength;
const pistonSolid = solid(
  {
    x: pistonX,
    y: launcher.barrelY - launcher.pistonRadius,
    w: launcher.pistonLength,
    d: launcher.pistonRadius * 2,
    r: launcher.pistonRadius,
  },
  launcher.barrelZ - launcher.pistonRadius,
  launcher.pistonRadius * 2,
  8
);

// Terminal nozzle cap on piston rod
const pistonTip = solid(
  {
    x: pistonX + launcher.pistonLength - 3,
    y: launcher.barrelY - launcher.pistonRadius - 1,
    w: 3,
    d: (launcher.pistonRadius + 1) * 2,
    r: launcher.pistonRadius + 1,
  },
  launcher.barrelZ - launcher.pistonRadius - 1,
  (launcher.pistonRadius + 1) * 2,
  8
);

export const LAUNCHER_ART = {
  cradle: launcherCradle,
  barrel: barrelSolid,
  collar: barrelCollar,
  piston: pistonSolid,
  tip: pistonTip,
};
