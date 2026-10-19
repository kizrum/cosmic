/**
 * Scale mode: 0 = illustrative (compressed sizes and distances), 1 = true scale.
 * Values in between are a log-space blend used to animate the switch.
 *
 * Scene unit = one Earth radius (6,371 km) in both modes, so Earth itself never changes size.
 */
import { AU_KM, sceneDistance } from '../astro';

export const EARTH_KM = 6371;
/** 1 AU in scene units at true scale. */
export const AU_UNITS = AU_KM / EARTH_KM;

export const scale = {
  /** Current blend (eased), 0…1. */
  t: 0,
  /** Linear progress toward the target, 0…1. */
  p: 0,
  target: 0,
};

/** Blend an illustrative value toward the true one (geometric interpolation). */
export function blend(visual: number, real: number) {
  const t = scale.t;
  if (t <= 0) return visual;
  if (t >= 1) return real;
  return Math.exp(Math.log(visual) * (1 - t) + Math.log(real) * t);
}

/** Heliocentric distance in scene units for a distance in AU. */
export const helioDistance = (au: number) => blend(sceneDistance(au), au * AU_UNITS);

/** How much the whole planetary system grew relative to the illustrative layout. */
export const systemFactor = () => helioDistance(30.07) / sceneDistance(30.07);

/** Advance the transition; returns true while the scale is changing. */
export function stepScale(dt: number, duration = 2.2) {
  if (scale.p === scale.target) return false;
  const dir = Math.sign(scale.target - scale.p);
  scale.p = Math.min(1, Math.max(0, scale.p + (dir * dt) / duration));
  if ((dir > 0 && scale.p > scale.target) || (dir < 0 && scale.p < scale.target)) scale.p = scale.target;
  // Smootherstep: gentle start and finish.
  const x = scale.p;
  scale.t = x * x * x * (x * (x * 6 - 15) + 10);
  return true;
}
