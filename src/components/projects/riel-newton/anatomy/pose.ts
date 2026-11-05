import {
  circleRing,
  extrude,
  pathOf,
  slabOf,
  type Flat,
  type Point3,
  type SolidPaths,
} from '@/components/iso/iso-kit';
import { ANCHORS, at, PROJECTION } from './view';
import {
  computeNewtonKinematics,
  NewtonState,
} from './model';

const solid = (
  x: number,
  y: number,
  w: number,
  d: number,
  z: number,
  h: number,
  r = 1
) => slabOf({ x, y, w, d, r }, z, h, PROJECTION);

const cyl = (cx: number, cy: number, r: number, z: number, h: number, steps = 16) =>
  extrude(circleRing(cx, cy, r, steps), z, h, PROJECTION, { convex: true });

export interface NewtonPose {
  state: NewtonState;
  glider: {
    body: SolidPaths;
    wheels: SolidPaths[];
    center: Flat;
  };
  sg90: {
    casing: SolidPaths;
    ears: SolidPaths;
    horn: SolidPaths;
    pin: Flat;
  };
  lcd: {
    bezel: SolidPaths;
    screen: SolidPaths;
    led: Flat;
  };
}

/**
 * Computes dynamic pose given the glider position (0 to 225 mm)
 */
export function computeNewtonPose(
  cartTravelMm: number,
  cartMassKg = 0.15,
  hangingMassKg = 0.05
): NewtonPose {
  const state = computeNewtonKinematics(cartTravelMm, cartMassKg, hangingMassKg);

  const { glider, rail, sg90, onboardLcd } = ANCHORS;

  // Glider X coordinate in world space (slides from left to right along the rail)
  const currentX = glider.minX + Math.min(glider.maxX - glider.minX, cartTravelMm);
  const cartY = -glider.width / 2;
  const cartZ = rail.z + rail.h - 2;

  // 1. Glider Carriage Body (embracing the elevated rail)
  const gliderBody = solid(
    currentX,
    cartY,
    glider.length,
    glider.width,
    cartZ,
    glider.height,
    2
  );

  // 4 Micro Roller Bearings under the carriage
  const wheelOffset = 7;
  const wheelRadius = 3.2;
  const wheels: SolidPaths[] = [
    cyl(currentX + wheelOffset, cartY + 2, wheelRadius, cartZ - 2, 2.5),
    cyl(currentX + glider.length - wheelOffset, cartY + 2, wheelRadius, cartZ - 2, 2.5),
    cyl(currentX + wheelOffset, cartY + glider.width - 2, wheelRadius, cartZ - 2, 2.5),
    cyl(currentX + glider.length - wheelOffset, cartY + glider.width - 2, wheelRadius, cartZ - 2, 2.5),
  ];

  // 2. TowerPro SG90 Blue Micro-Servo (mounted on the glider rear)
  const sg90X = currentX + 4;
  const sg90Y = cartY + 3;
  const sg90Z = cartZ + glider.height;

  const sg90Casing = solid(sg90X, sg90Y, sg90.w, sg90.d, sg90Z, sg90.h, 1.5);
  const sg90Ears = solid(sg90X - 2, sg90Y - 1, sg90.w + 4, sg90.d + 2, sg90Z + 12, 2.5, 0.5);

  // Servo output horn (white / brass arm)
  const hornX = sg90X + sg90.w - 5;
  const hornY = sg90Y + sg90.d / 2;
  const hornArm = solid(hornX - 2, hornY - 2, 10, 4, sg90Z + sg90.h, 2, 1);
  const hornPin = at([hornX, hornY, sg90Z + sg90.h + 2.5]);

  // 3. Onboard LCD Screen & Digital Matrix Display (mounted on front of glider)
  const lcdX = currentX + glider.length - onboardLcd.w - 4;
  const lcdY = cartY + glider.width - onboardLcd.d - 3;
  const lcdZ = cartZ + glider.height;

  const lcdBezel = solid(lcdX, lcdY, onboardLcd.w, onboardLcd.d, lcdZ, onboardLcd.h, 1);
  const lcdScreen = solid(
    lcdX + 2,
    lcdY + 2,
    onboardLcd.screenWidth,
    onboardLcd.screenHeight,
    lcdZ + onboardLcd.h - 1,
    1.2,
    0.5
  );
  const lcdLed = at([lcdX + onboardLcd.w - 2, lcdY + 3, lcdZ + onboardLcd.h + 0.5]);

  return {
    state,
    glider: {
      body: gliderBody,
      wheels,
      center: at([currentX + glider.length / 2, 0, cartZ + glider.height / 2]),
    },
    sg90: {
      casing: sg90Casing,
      ears: sg90Ears,
      horn: hornArm,
      pin: hornPin,
    },
    lcd: {
      bezel: lcdBezel,
      screen: lcdScreen,
      led: lcdLed,
    },
  };
}
