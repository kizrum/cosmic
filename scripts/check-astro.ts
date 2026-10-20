/**
 * Ephemeris check against JPL Horizons: run with `npm run check:astro`.
 * Compares the app's positions with scripts/horizons-reference.json (refresh it with
 * `npm run fetch:horizons`) over the years listed in src/data/validity.ts.
 */
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { BODIES } from '../src/data/bodies';
import { daysFromDate, eclToScene, elementsAt, keplerPosition, moonPosition, orbitalPosition } from '../src/astro';
import type { Sample } from './fetch-horizons';

/**
 * Largest allowed error: direction (degrees, as seen from the Sun or the parent) and
 * distance (fraction), set just above the model's actual accuracy so a regression shows.
 * Mean elements cannot follow resonant moons for long (Mimas–Tethys, Enceladus–Dione, the
 * Io–Europa–Ganymede chain, Miranda), nor Phobos' decaying orbit: those get looser limits.
 */
const LIMITS: Record<string, { deg: number; dist: number }> = {
  // JPL table 1 quotes Saturn's error up to ~0.2° over 1800–2050.
  planet: { deg: 0.2, dist: 0.002 },
  dwarf: { deg: 0.3, dist: 0.002 },
  moon: { deg: 1, dist: 0.01 },
  // Meeus' main terms: ~0.3° and ~500 km.
  'body:moon': { deg: 0.3, dist: 0.002 },
  'body:phobos': { deg: 2.5, dist: 0.01 },
  'body:europa': { deg: 2, dist: 0.02 },
  'body:mimas': { deg: 5, dist: 0.05 },
  'body:enceladus': { deg: 2.5, dist: 0.015 },
  'body:tethys': { deg: 5, dist: 0.01 },
  'body:miranda': { deg: 6, dist: 0.01 },
};

const { samples } = JSON.parse(readFileSync(new URL('./horizons-reference.json', import.meta.url), 'utf8')) as { samples: Sample[] };

let failures = 0;
const ref = new THREE.Vector3();
const app = new THREE.Vector3();
const byBody = new Map<string, Sample[]>();
for (const s of samples) byBody.set(s.id, [...(byBody.get(s.id) ?? []), s]);

console.log('\nBody        worst direction   worst distance   years');
for (const [id, list] of byBody) {
  const def = BODIES.find((b) => b.id === id);
  if (!def) throw new Error(`unknown body ${id}`);
  const lim = LIMITS[`body:${id}`] ?? LIMITS[def.group];
  let worstDeg = 0, worstDist = 0, worstAt = '';
  for (const s of list) {
    const d = daysFromDate(Date.parse(s.utc));
    eclToScene(s.xyz[0], s.xyz[1], s.xyz[2], ref);
    if (id === 'moon') {
      const km = moonPosition(d, app);
      app.multiplyScalar(km);
    } else if (def.group === 'moon') keplerPosition(elementsAt(def.orbit!, d), app);
    else orbitalPosition(def.orbit!, d, app);
    const deg = THREE.MathUtils.radToDeg(app.angleTo(ref));
    const dist = Math.abs(app.length() / ref.length() - 1);
    if (deg > worstDeg) { worstDeg = deg; worstAt = s.utc.slice(0, 10); }
    worstDist = Math.max(worstDist, dist);
  }
  const ok = worstDeg <= lim.deg && worstDist <= lim.dist;
  if (!ok) failures++;
  const years = `${list[0].utc.slice(0, 4)}–${list[list.length - 1].utc.slice(0, 4)}`;
  console.log(
    `${ok ? '  ✓' : '  ✗'} ${id.padEnd(10)} ${worstDeg.toFixed(3).padStart(7)}° / ${lim.deg}°`.padEnd(34) +
    `${(worstDist * 100).toFixed(3).padStart(7)} % / ${lim.dist * 100} %`.padEnd(20) + `${years}${ok ? '' : `  (worst ${worstAt})`}`,
  );
}

console.log(failures ? `\n✗ ${failures} bod${failures === 1 ? 'y' : 'ies'} out of tolerance` : `\n✓ ${samples.length} samples within tolerance`);
process.exit(failures ? 1 : 0);
