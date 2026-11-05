import {
  pathOf,
  type Point3,
} from '@/components/iso/iso-kit';
import { ANCHORS, at } from './view';
import { computePlanoState } from './model';
import { DIAL_ART, SERVO1_ART, SERVO2_ART } from './geometry';

const { pivot, ramp } = ANCHORS;

/**
 * Computes dynamic geometry for the Plano Inclinado given a tilt angle.
 */
export function computePlanoPose(angleDegrees: number) {
  const state = computePlanoState({ angle: angleDegrees });
  const rad = (state.angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  /* -----------------------------------------------------------------------
   * 1. Incline Ramp Geometry (Hinged at pivot x=95, tilting up to the left)
   * ----------------------------------------------------------------------- */
  const halfW = ramp.width / 2;
  const len = ramp.length;
  const th = ramp.thickness;

  // Vector pointing along the tilted beam: [-cosA, 0, sinA]
  // Vector pointing UP normal to ramp: [sinA, 0, cosA]
  const upX = sinA * th;
  const upZ = cosA * th;

  // 4 Bottom corners of the ramp beam
  const p0: Point3 = [pivot.x, -halfW, pivot.z];
  const p1: Point3 = [pivot.x - len * cosA, -halfW, pivot.z + len * sinA];
  const p2: Point3 = [pivot.x - len * cosA, halfW, pivot.z + len * sinA];
  const p3: Point3 = [pivot.x, halfW, pivot.z];

  // 4 Top corners
  const t0: Point3 = [p0[0] + upX, p0[1], p0[2] + upZ];
  const t1: Point3 = [p1[0] + upX, p1[1], p1[2] + upZ];
  const t2: Point3 = [p2[0] + upX, p2[1], p2[2] + upZ];
  const t3: Point3 = [p3[0] + upX, p3[1], p3[2] + upZ];

  // 2D projected corners
  const fp0 = at(p0);
  const fp1 = at(p1);
  const fp2 = at(p2);
  const fp3 = at(p3);
  const ft0 = at(t0);
  const ft1 = at(t1);
  const ft2 = at(t2);
  const ft3 = at(t3);

  // Surfaces
  const rampTopPath = pathOf([ft0, ft1, ft2, ft3], true);
  const rampRightSide = pathOf([fp0, fp1, ft1, ft0], true);
  const rampFrontEnd = pathOf([fp1, fp2, ft2, ft1], true);
  const rampLeftSide = pathOf([fp3, fp2, ft2, ft3], true);
  const rampOutline = pathOf([ft0, ft3, fp3, fp2, ft2, ft1, fp1, fp0], true);

  // Center groove along the ramp
  const grooveStart: Point3 = [pivot.x - 12 * cosA + upX, 0, pivot.z + 12 * sinA + upZ];
  const grooveEnd: Point3 = [pivot.x - (len - 12) * cosA + upX, 0, pivot.z + (len - 12) * sinA + upZ];
  const rampGroove = pathOf([at(grooveStart), at(grooveEnd)]);

  // Millimeter ticks along top front edge
  const tickPaths: string[] = [];
  const numTicks = 24;
  for (let i = 1; i <= numTicks; i++) {
    const s = (i / numTicks) * (len - 24) + 12;
    const isMajor = i % 5 === 0;
    const tickLen = isMajor ? 5 : 2.5;

    const tickEdge: Point3 = [pivot.x - s * cosA + upX, -halfW, pivot.z + s * sinA + upZ];
    const tickInner: Point3 = [pivot.x - s * cosA + upX, -halfW + tickLen, pivot.z + s * sinA + upZ];
    tickPaths.push(pathOf([at(tickEdge), at(tickInner)]));
  }
  const rampTicks = tickPaths.join('');

  // Top mechanical stop plate at elevated end of ramp
  const stopP1: Point3 = [p1[0] + upX, -halfW, p1[2] + upZ];
  const stopP2: Point3 = [p2[0] + upX, halfW, p2[2] + upZ];
  const stopTop1: Point3 = [stopP1[0] + sinA * ramp.stopHeight, -halfW, stopP1[2] + cosA * ramp.stopHeight];
  const stopTop2: Point3 = [stopP2[0] + sinA * ramp.stopHeight, halfW, stopP2[2] + cosA * ramp.stopHeight];
  const rampStopPlate = pathOf([at(stopP1), at(stopTop1), at(stopTop2), at(stopP2)], true);

  /* -----------------------------------------------------------------------
   * 2. Sliding Sensor Cube Cargo (White Alabaster Block)
   * ----------------------------------------------------------------------- */
  // Cube sits on top of ramp. At rest, it is near the top (s = 175 mm).
  // When sliding, it accelerates towards the pivot end stop (s = 40 mm).
  const cubeStation = state.isSliding
    ? 175 - state.slideProgress * 135
    : 175;

  const cubeSize = 20;
  const cubeHalf = cubeSize / 2;
  const cubeH = 16;

  // Center on ramp top surface
  const cbX = pivot.x - cubeStation * cosA + upX;
  const cbZ = pivot.z + cubeStation * sinA + upZ;

  // 4 Bottom corners of cube (touching ramp)
  const c0: Point3 = [cbX + cosA * cubeHalf, -cubeHalf, cbZ - sinA * cubeHalf];
  const c1: Point3 = [cbX - cosA * cubeHalf, -cubeHalf, cbZ + sinA * cubeHalf];
  const c2: Point3 = [cbX - cosA * cubeHalf, cubeHalf, cbZ + sinA * cubeHalf];
  const c3: Point3 = [cbX + cosA * cubeHalf, cubeHalf, cbZ - sinA * cubeHalf];

  // 4 Top corners of cube (lifted by normal vector)
  const normX = sinA * cubeH;
  const normZ = cosA * cubeH;

  const ct0: Point3 = [c0[0] + normX, c0[1], c0[2] + normZ];
  const ct1: Point3 = [c1[0] + normX, c1[1], c1[2] + normZ];
  const ct2: Point3 = [c2[0] + normX, c2[1], c2[2] + normZ];
  const ct3: Point3 = [c3[0] + normX, c3[1], c3[2] + normZ];

  const fc0 = at(c0);
  const fc1 = at(c1);
  const fc2 = at(c2);
  const fc3 = at(c3);
  const fct0 = at(ct0);
  const fct1 = at(ct1);
  const fct2 = at(ct2);
  const fct3 = at(ct3);

  const cubeTop = pathOf([fct0, fct1, fct2, fct3], true);
  const cubeRight = pathOf([fc0, fc1, fct1, fct0], true);
  const cubeLeft = pathOf([fc3, fc2, fct2, fct3], true);
  const cubeFront = pathOf([fc1, fc2, fct2, fct1], true);
  const cubeOutline = pathOf([fct0, fct3, fc3, fc2, fct2, fct1, fc1, fc0], true);
  const cubeCenter = at([cbX + normX / 2, 0, cbZ + normZ / 2]);

  /* -----------------------------------------------------------------------
   * 3. Mechanical Pushrod Linkages (Steel Rods)
   * ----------------------------------------------------------------------- */
  const lugStation = 60; // attach point along the ramp
  const lugL: Point3 = [pivot.x - lugStation * cosA, -halfW - 2, pivot.z + lugStation * sinA];
  const lugR: Point3 = [pivot.x - lugStation * cosA, halfW + 2, pivot.z + lugStation * sinA];

  const pushrod1 = pathOf([at(SERVO1_ART.hornCenter), at(lugL)]);
  const pushrod2 = pathOf([at(SERVO2_ART.hornCenter), at(lugR)]);

  /* -----------------------------------------------------------------------
   * 4. Dial Gauge Needle
   * ----------------------------------------------------------------------- */
  const needleAngle = (angleDegrees * Math.PI) / 180;
  const needleLen = DIAL_ART.radius * 0.85;
  const nTipX = DIAL_ART.center[0] + Math.cos(needleAngle) * needleLen;
  const nTipY = DIAL_ART.center[1] + Math.sin(needleAngle) * needleLen;
  const nTailX = DIAL_ART.center[0] - Math.cos(needleAngle) * (needleLen * 0.25);
  const nTailY = DIAL_ART.center[1] - Math.sin(needleAngle) * (needleLen * 0.25);

  const needlePath = pathOf([
    at([nTailX, nTailY, DIAL_ART.center[2]]),
    at([nTipX, nTipY, DIAL_ART.center[2]]),
  ]);
  const needleHubCenter = at(DIAL_ART.center);

  return {
    state,
    ramp: {
      top: rampTopPath,
      right: rampRightSide,
      front: rampFrontEnd,
      left: rampLeftSide,
      outline: rampOutline,
      groove: rampGroove,
      ticks: rampTicks,
      stop: rampStopPlate,
      pivotAxleL: at(p0),
      pivotAxleR: at(p3),
    },
    cube: {
      top: cubeTop,
      right: cubeRight,
      left: cubeLeft,
      front: cubeFront,
      outline: cubeOutline,
      center: cubeCenter,
    },
    pushrods: {
      rod1: pushrod1,
      rod2: pushrod2,
      lugL: at(lugL),
      lugR: at(lugR),
    },
    dial: {
      needle: needlePath,
      hub: needleHubCenter,
    },
  };
}
