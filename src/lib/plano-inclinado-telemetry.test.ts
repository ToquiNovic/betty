import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type * as TelemetryModule from './plano-inclinado-telemetry';

let telemetry: typeof TelemetryModule;

before(async () => {
  const modulePath = './plano-inclinado-telemetry.ts';
  telemetry = (await import(modulePath)) as typeof TelemetryModule;
});

describe('computeInclinedPlanePhysics', () => {
  it('computes exact trigonometric ratios at 0 degrees with no slip', () => {
    const result = telemetry.computeInclinedPlanePhysics(0, 0);

    assert.equal(result.rad, 0);
    assert.equal(result.tanTheta, 0);
    assert.equal(result.parallelRatio, 0);
    assert.equal(result.normalRatio, 1);
    assert.equal(result.criticalMuS, 0);
  });

  it('computes force ratios and critical static friction coefficient for active angle and slip', () => {
    const result = telemetry.computeInclinedPlanePhysics(30, 18.5);

    assert.ok(Math.abs(result.rad - Math.PI / 6) < 1e-9);
    assert.ok(Math.abs(result.parallelRatio - 0.5) < 1e-9);
    assert.ok(Math.abs(result.normalRatio - Math.sqrt(3) / 2) < 1e-9);
    assert.ok(Math.abs(result.tanTheta - Math.tan(Math.PI / 6)) < 1e-9);
    assert.ok(Math.abs(result.criticalMuS - Math.tan((18.5 * Math.PI) / 180)) < 1e-9);
  });

  it('guards against non-finite inputs', () => {
    const result = telemetry.computeInclinedPlanePhysics(Number.NaN, Number.POSITIVE_INFINITY);

    assert.equal(result.rad, 0);
    assert.equal(result.tanTheta, 0);
    assert.equal(result.parallelRatio, 0);
    assert.equal(result.normalRatio, 1);
    assert.equal(result.criticalMuS, 0);
  });
});

describe('normalizePlanoInclinadoPayload', () => {
  it('normalizes flat sensor payload fields and computes force ratios', () => {
    const normalized = telemetry.normalizePlanoInclinadoPayload(
      {
        origin_type: 'sensor',
        plank_angle: 15,
        servo1: 90,
        servo2: 90,
        target_angle: 120,
        cube_detected: false,
        slip_angle: 15,
        mu_s: 0.2679,
        angular_velocity: 6.4,
        easing_type: 'SMOOTHERSTEP',
        control_mode: 'physical',
        view_mode: 'math_chart',
        experiment_state: 'slip_detected',
      },
      30
    );

    assert.equal(normalized.hasKinematics, true);
    assert.equal(normalized.originType, 'sensor');
    assert.equal(normalized.plankAngle, 15);
    assert.equal(normalized.servo1, 90);
    assert.equal(normalized.servo2, 90);
    assert.equal(normalized.targetAngle, 120);
    assert.equal(normalized.cubeDetected, false);
    assert.equal(normalized.slipAngle, 15);
    assert.equal(normalized.muS, 0.2679);
    assert.equal(normalized.angularVelocity, 6.4);
    assert.equal(normalized.easingType, 'SMOOTHERSTEP');
    assert.equal(normalized.controlMode, 'physical');
    assert.equal(normalized.viewMode, 'math_chart');
    assert.equal(normalized.experimentState, 'slip_detected');
    assert.ok(Math.abs((normalized.parallelForceRatio ?? 0) - Math.sin((15 * Math.PI) / 180)) < 1e-6);
    assert.ok(Math.abs((normalized.normalForceRatio ?? 0) - Math.cos((15 * Math.PI) / 180)) < 1e-6);
  });

  it('unwraps nested payload.metrics while retaining outer mode and origin fields', () => {
    const normalized = telemetry.normalizePlanoInclinadoPayload(
      {
        origin_type: 'metaverso',
        control_mode: 'virtual',
        easing_type: 'sine',
        view_mode: 'full',
        experiment_state: 'running',
        metrics: {
          plank_angle: 20,
          target: 140,
          cube_detected: 1,
          slip_angle: 0,
        },
      },
      30
    );

    assert.equal(normalized.hasKinematics, true);
    assert.equal(normalized.originType, 'metaverso');
    assert.equal(normalized.controlMode, 'virtual');
    assert.equal(normalized.easingType, 'SINE');
    assert.equal(normalized.viewMode, 'full');
    assert.equal(normalized.experimentState, 'running');
    assert.equal(normalized.plankAngle, 20);
    assert.equal(normalized.servo1, 120);
    assert.equal(normalized.servo2, 60);
    assert.equal(normalized.targetAngle, 140);
    assert.equal(normalized.cubeDetected, true);
    assert.equal(normalized.slipAngle, 0);
    assert.equal(normalized.muS, 0);
  });

  it('derives plankAngle from servo1 and falls back to originType argument', () => {
    const normalized = telemetry.normalizePlanoInclinadoPayload(
      {
        servo1: 90,
        slip_angle: 18,
      },
      40,
      'metaverso'
    );

    assert.equal(normalized.hasKinematics, true);
    assert.equal(normalized.plankAngle, 20);
    assert.equal(normalized.servo1, 90);
    assert.equal(normalized.servo2, 90);
    assert.equal(normalized.originType, 'metaverso');
    assert.ok(Math.abs((normalized.muS ?? 0) - Math.tan((18 * Math.PI) / 180)) < 1e-6);
  });

  it('handles pure control/config packets without fabricating kinematic angles', () => {
    const normalized = telemetry.normalizePlanoInclinadoPayload({
      origin_type: 'metaverso',
      control_mode: 'auto',
      easing_type: 'QUAD',
      view_mode: 'math',
      experiment_state: 'paused',
    });

    assert.equal(normalized.hasKinematics, false);
    assert.equal(normalized.plankAngle, undefined);
    assert.equal(normalized.servo1, undefined);
    assert.equal(normalized.controlMode, 'auto');
    assert.equal(normalized.easingType, 'QUAD');
    assert.equal(normalized.viewMode, 'math');
    assert.equal(normalized.experimentState, 'paused');
  });

  it('rejects unknown enum values and handles invalid payloads safely', () => {
    const invalid = telemetry.normalizePlanoInclinadoPayload({
      easing_type: 'INVALID_CURVE',
      control_mode: 'hybrid',
      view_mode: 'split',
      experiment_state: 'broken',
    });

    assert.equal(invalid.easingType, undefined);
    assert.equal(invalid.controlMode, undefined);
    assert.equal(invalid.viewMode, undefined);
    assert.equal(invalid.experimentState, undefined);

    const empty = telemetry.normalizePlanoInclinadoPayload(null, 30, 'sensor');
    assert.equal(empty.hasKinematics, false);
    assert.equal(empty.originType, 'sensor');
  });
});

describe('shouldAcceptTelemetryForMode', () => {
  it('accepts all origins in auto mode', () => {
    assert.equal(telemetry.shouldAcceptTelemetryForMode('auto', 'sensor'), true);
    assert.equal(telemetry.shouldAcceptTelemetryForMode('auto', 'metaverso'), true);
    assert.equal(telemetry.shouldAcceptTelemetryForMode('auto', undefined), true);
  });

  it('accepts only metaverso origin in virtual mode', () => {
    assert.equal(telemetry.shouldAcceptTelemetryForMode('virtual', 'metaverso'), true);
    assert.equal(telemetry.shouldAcceptTelemetryForMode('virtual', 'sensor'), false);
    assert.equal(telemetry.shouldAcceptTelemetryForMode('virtual', undefined), false);
  });

  it('accepts only sensor origin in physical mode', () => {
    assert.equal(telemetry.shouldAcceptTelemetryForMode('physical', 'sensor'), true);
    assert.equal(telemetry.shouldAcceptTelemetryForMode('physical', 'metaverso'), false);
    assert.equal(telemetry.shouldAcceptTelemetryForMode('physical', undefined), false);
  });
});

describe('evaluateEasing', () => {
  it('evaluates boundary and midpoint values consistently for all curves', () => {
    for (const curve of telemetry.EASING_TYPES) {
      assert.equal(telemetry.evaluateEasing(curve, 0), 0);
      assert.equal(telemetry.evaluateEasing(curve, 1), 1);
      assert.ok(Math.abs(telemetry.evaluateEasing(curve, 0.5) - 0.5) < 1e-9);
    }

    assert.equal(telemetry.evaluateEasing('LINEAR', 0.25), 0.25);
    assert.ok(telemetry.evaluateEasing('SMOOTHERSTEP', 0.25) < 0.25);
  });
});
