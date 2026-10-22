/** Positions of the spacecraft leaving the Solar System, from the JPL Horizons tracks. */
import * as THREE from 'three';
import { eclToScene } from '../astro';
import { PROBE_TRACKS } from '../data/probeTracks';

export const PROBE_IDS = ['voyager1', 'voyager2', 'pioneer10', 'pioneer11', 'newHorizons'] as const;
export type ProbeId = (typeof PROBE_IDS)[number];

const STRIDE = 4;

export const trackStart = (id: ProbeId) => PROBE_TRACKS[id][0];
export const trackEnd = (id: ProbeId) => PROBE_TRACKS[id][PROBE_TRACKS[id].length - STRIDE];

/**
 * Heliocentric position in AU (scene frame) on day `d`, or null before launch. Linear
 * between samples; past the end of the ephemeris the last segment is extended (a constant
 * velocity — the escape speed changes by a fraction of a per cent over decades).
 */
export function probePosition(id: ProbeId, d: number, out = new THREE.Vector3()): THREE.Vector3 | null {
  const t = PROBE_TRACKS[id];
  const n = t.length / STRIDE;
  if (d < t[0]) return null;
  let lo = 0, hi = n - 1;
  if (d >= t[(n - 1) * STRIDE]) {
    lo = n - 2;
    hi = n - 1;
  } else {
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (t[mid * STRIDE] <= d) lo = mid;
      else hi = mid;
    }
  }
  const a = lo * STRIDE, b = hi * STRIDE;
  const f = (d - t[a]) / (t[b] - t[a]);
  return eclToScene(t[a + 1] + (t[b + 1] - t[a + 1]) * f, t[a + 2] + (t[b + 2] - t[a + 2]) * f, t[a + 3] + (t[b + 3] - t[a + 3]) * f, out);
}

/** Speed relative to the Sun in km/s on day `d` (from neighbouring samples). */
export function probeSpeed(id: ProbeId, d: number) {
  const a = probePosition(id, d - 30), b = probePosition(id, d + 30);
  if (!a || !b) return null;
  return (a.distanceTo(b) * 149_597_870.7) / (60 * 86_400);
}

/** The whole track as scene-frame points (AU) with the day of each point. */
export function trackPoints(id: ProbeId) {
  const t = PROBE_TRACKS[id];
  const pts: THREE.Vector3[] = [];
  const days: number[] = [];
  for (let i = 0; i < t.length; i += STRIDE) {
    pts.push(eclToScene(t[i + 1], t[i + 2], t[i + 3]));
    days.push(t[i]);
  }
  return { pts, days };
}
