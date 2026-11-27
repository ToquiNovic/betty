import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type * as TelemetryModule from './plano-inclinado-telemetry';

let telemetry: typeof TelemetryModule;

before(async () => {
  const modulePath = './plano-inclinado-telemetry.ts';
  telemetry = (await import(modulePath)) as typeof TelemetryModule;
});

describe('Plano Inclinado Telemetry Regression Probes (S1, S2)', () => {
  it('guards inclined plane physics against Infinity, negative slipAngle, and 90-degree edge', () => {
    const inf = telemetry.computeInclinedPlanePhysics(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY);
    assert.deepEqual(inf, { rad: 0, tanTheta: 0, parallelRatio: 0, normalRatio: 1, criticalMuS: 0 });

    const negSlip = telemetry.computeInclinedPlanePhysics(15, -10);
    assert.equal(negSlip.criticalMuS, 0);
    assert.ok(Math.abs(negSlip.parallelRatio - Math.sin((15 * Math.PI) / 180)) < 1e-12);
  });

  it('guards normalizePlanoInclinadoPayload against zero/NaN maxPlankAngle, malformed strings, and array metrics', () => {
    for (const bad of [null, undefined, [], 'raw', 42, false]) {
      const res = telemetry.normalizePlanoInclinadoPayload(bad, 30, 'metaverso');
      assert.equal(res.hasKinematics, false);
      assert.equal(res.originType, 'metaverso');
    }

    assert.equal(telemetry.normalizePlanoInclinadoPayload({ plank_angle: 15 }, 0).servo1, 90);
    assert.equal(telemetry.normalizePlanoInclinadoPayload({ servo1: 90 }, Number.NaN).plankAngle, 15);

    const outerWins = telemetry.normalizePlanoInclinadoPayload({
      plank_angle: 20,
      metrics: { plank_angle: 10, easing_type: 'SMOOTHERSTEP' },
    });
    assert.equal(outerWins.plankAngle, 20);
    assert.equal(outerWins.easingType, 'SMOOTHERSTEP');

    const badNums = telemetry.normalizePlanoInclinadoPayload({
      plank_angle: '   ',
      servo1: 'NaN',
      target_angle: 'Infinity',
      slip_angle: 'bad',
      cube_detected: 'maybe',
      metrics: ['ignored'],
    });
    assert.equal(badNums.hasKinematics, false);
    assert.equal(badNums.plankAngle, undefined);
    assert.equal(badNums.cubeDetected, undefined);
  });

  it('verifies easing clamping + symmetry and proxy.ts embed exemption', () => {
    for (const curve of telemetry.EASING_TYPES) {
      assert.equal(telemetry.evaluateEasing(curve, -5), 0);
      assert.equal(telemetry.evaluateEasing(curve, 5), 1);
      assert.equal(telemetry.evaluateEasing(curve, Number.NaN), 0);
      assert.equal(telemetry.evaluateEasing(curve, Number.POSITIVE_INFINITY), 0);
      const sum = telemetry.evaluateEasing(curve, 0.25) + telemetry.evaluateEasing(curve, 0.75);
      assert.ok(Math.abs(sum - 1) < 1e-12);
    }

    const proxySrc = fs.readFileSync(path.resolve(process.cwd(), 'src', 'proxy.ts'), 'utf8');
    const match = proxySrc.match(/const\s+PROTECTED_ROUTES\s*=\s*\[([^\]]+)\]/);
    assert.ok(match);
    const routes = Array.from(match[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
    const isProtected = (pathname: string) => {
      const seg = pathname.split('/').filter(Boolean);
      const stripped = seg[0] === 'es' || seg[0] === 'en' ? '/' + seg.slice(1).join('/') : pathname;
      return routes.some((r) => stripped === r || stripped.startsWith(r + '/'));
    };
    assert.equal(isProtected('/es/embed/plano-inclinado'), false);
    assert.equal(isProtected('/en/embed/plano-inclinado'), false);
    assert.equal(isProtected('/es/projects/plano-inclinado'), true);
  });
});
