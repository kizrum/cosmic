/**
 * Scene layout of body sizes and moon orbits. Pure functions (no three.js scene objects),
 * shared by the renderer and by the consistency checks in scripts/check-layout.ts.
 *
 * Real proportions cannot fit on a screen, so three things are compressed:
 *  - heliocentric distances (astro.sceneDistance),
 *  - body radii (visualRadius),
 *  - moon distances (satelliteDistance, then squeezed per system by layoutMoons).
 * The rules below keep the *ordering* and the *containment* relations true:
 * planets stay in their order, a moon system never reaches toward a neighbouring planet's
 * orbit, moons stay outside their planet and its rings and never touch each other.
 */
import type { BodyDef } from '../data/bodies';
import { elementsAt, satelliteDistance, sceneDistance } from '../astro';

export const SUN_RADIUS = 12;

/** Radii are compressed (power 0.55) so small worlds stay visible next to giants. */
export const visualRadius = (def: BodyDef) =>
  def.id === 'sun' ? SUN_RADIUS : Math.max(0.045, Math.pow(def.radiusKm / 6371, 0.55));

/** Largest semi-axis scale for triaxial / oblate bodies (the visual extent). */
export function extentScale(def: BodyDef) {
  if (!def.shape) return 1;
  const [a, b, c] = def.shape;
  return a / Math.cbrt(a * b * c);
}

/** Ring systems' outer edge in planet radii (main rings drawn by the renderer). */
export const RING_OUTER: Record<string, number> = { saturn: 2.27, uranus: 51_149 / 25_362, neptune: 62_932 / 24_622, haumea: 2_287 / 780 };

/** A moon system may use at most this share of the gap to the nearest neighbouring orbit. */
export const MOON_SYSTEM_SHARE = 0.4;
/** Moons closer than this (in parent radii) keep the generic distance; only outer systems are squeezed. */
export const MOON_KEEP = 2.5;
/** Minimum clearance between neighbouring moon orbits, in units of the two moons' radii. */
const MOON_SPACING = 1.5;

export interface MoonLayout {
  /** Squeeze of the outer system per parent id (1 = generic compression only). */
  squeeze: Map<string, number>;
  /** Distance (parent radii) below which moons are not squeezed, per parent id. */
  keep: Map<string, number>;
  /** Extra per-moon factor that keeps neighbours apart (1 = none). */
  spread: Map<string, number>;
  /** Gap to the nearest neighbouring orbit per parent id (scene units), for checks. */
  gap: Map<string, number>;
}

/** Mean Earth–Moon distance (km); the Moon uses Meeus' theory rather than elements. */
const MOON_MEAN_KM = 384_400;

const semiMajorKm = (m: BodyDef, d: number) => (m.id === 'moon' ? MOON_MEAN_KM : elementsAt(m.orbit!, d).a);
const apoKm = (m: BodyDef, d: number) => {
  if (m.id === 'moon') return 405_500;
  const k = elementsAt(m.orbit!, d);
  return k.a * (1 + k.e);
};

/** Scene distance of a moon from its parent for a given km distance (before per-moon spread). */
export function moonDistance(parent: BodyDef, km: number, squeeze: number, keep = MOON_KEEP) {
  const s = satelliteDistance(km / parent.radiusKm);
  const squeezed = s <= keep ? s : keep + (s - keep) * squeeze;
  return visualRadius(parent) * squeezed;
}

/** Heliocentric [perihelion, aphelion] in scene units. */
export function sceneRange(def: BodyDef, d: number): [number, number] {
  const k = elementsAt(def.orbit!, d);
  return [sceneDistance(k.a * (1 - k.e)), sceneDistance(k.a * (1 + k.e))];
}

export function layoutMoons(bodies: BodyDef[], d: number): MoonLayout {
  const out: MoonLayout = { squeeze: new Map(), keep: new Map(), spread: new Map(), gap: new Map() };
  const helio = bodies.filter((b) => b.orbit && b.group !== 'moon');
  for (const p of helio) {
    const moons = bodies.filter((m) => m.parent === p.id && m.group === 'moon').sort((a, b) => semiMajorKm(a, d) - semiMajorKm(b, d));
    if (!moons.length) continue;

    // 1. Squeeze the outer system into its share of the gap to the nearest neighbouring orbit.
    const [q, Q] = sceneRange(p, d);
    let gap = Infinity;
    for (const o of helio) {
      // Planets are constrained by planets; dwarf planets by everything heliocentric.
      if (o === p || (p.group === 'planet' && o.group !== 'planet')) continue;
      const [oq, oQ] = sceneRange(o, d);
      if (oq > Q) gap = Math.min(gap, oq - Q);
      else if (oQ < q) gap = Math.min(gap, q - oQ);
      // Crossing orbits (Pluto–Neptune) give no usable constraint.
    }
    out.gap.set(p.id, gap);
    let squeeze = 1;
    let keep = MOON_KEEP;
    const outer = moons.reduce((a, m) => (apoKm(m, d) > apoKm(a, d) ? m : a));
    const s = satelliteDistance(apoKm(outer, d) / p.radiusKm);
    if (Number.isFinite(gap)) {
      // Where the outermost moon's orbit (plus its own disc) may reach, in parent radii.
      const target = (MOON_SYSTEM_SHARE * gap - visualRadius(outer) * extentScale(outer)) / visualRadius(p);
      if (s > target) {
        // Small systems with big compressed moons (Earth) must squeeze below the usual threshold.
        keep = Math.min(MOON_KEEP, target);
        squeeze = s > keep ? Math.min(1, Math.max(0, (target - keep) / (s - keep))) : 1;
      }
    }
    out.squeeze.set(p.id, squeeze);
    out.keep.set(p.id, keep);

    // 2. Push moons apart where squeezing (or compressed radii) made neighbours touch,
    //    and keep the innermost moon clear of the planet and its rings.
    const R = visualRadius(p) * extentScale(p);
    let prevEdge = R * Math.max(1, RING_OUTER[p.id] ?? 1);
    let prevR = 0;
    for (const m of moons) {
      const r = visualRadius(m) * extentScale(m);
      const want = moonDistance(p, semiMajorKm(m, d), squeeze, keep);
      const min = prevR ? prevEdge + (prevR + r) * MOON_SPACING : prevEdge + r * MOON_SPACING;
      const dist = Math.max(want, min);
      out.spread.set(m.id, dist / want);
      prevEdge = dist;
      prevR = r;
    }
  }
  return out;
}
