import * as THREE from 'three';

/**
 * Astronomy core: time, frames and orbital mechanics.
 *
 * Frames:
 *  - ICRF equatorial (x → vernal equinox, z → celestial north pole)
 *  - Ecliptic J2000 (z → ecliptic north pole)
 *  - Scene (three.js): x = ecl.x, y = ecl.z (up = ecliptic north), z = -ecl.y
 */

export const DEG = Math.PI / 180;
export const AU_KM = 149_597_870.7;
export const LIGHT_KM_S = 299_792.458;

const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const OBLIQUITY = 23.4392911 * DEG;

export const daysFromDate = (ms: number) => (ms - J2000_MS) / 86_400_000;
export const dateFromDays = (d: number) => new Date(J2000_MS + d * 86_400_000);

export function eclToScene(x: number, y: number, z: number, out = new THREE.Vector3()) {
  return out.set(x, z, -y);
}

/** Unit vector (scene frame) for an equatorial direction given by RA/Dec in degrees. */
export function equToScene(raDeg: number, decDeg: number, out = new THREE.Vector3()) {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const x = Math.cos(dec) * Math.cos(ra);
  const y = Math.cos(dec) * Math.sin(ra);
  const z = Math.sin(dec);
  const ye = y * Math.cos(OBLIQUITY) + z * Math.sin(OBLIQUITY);
  const ze = -y * Math.sin(OBLIQUITY) + z * Math.cos(OBLIQUITY);
  return eclToScene(x, ye, ze, out).normalize();
}

/** Osculating Keplerian elements at one instant. Angles in degrees. */
export interface Kepler {
  a: number;
  e: number;
  i: number;
  node: number; // longitude of ascending node
  peri: number; // longitude of perihelion (node + argument of periapsis)
  L: number; // mean longitude
}

/**
 * Planet elements: JPL "Approximate Positions of the Planets", table 1 (valid 1800–2050),
 * J2000 values plus linear rates per Julian century.
 */
export interface OrbitalElements extends Kepler {
  rates: Kepler;
  period: number; // sidereal period, days (for drawing the orbit)
}

/** Mean elements fitted from JPL Horizons at an epoch (days from J2000), rates per day. */
export interface MeanElements {
  epoch: number; a: number; e: number; i: number; node: number; peri: number; L: number;
  n: number; nodeRate: number; periRate: number;
}

export type ElementSource = { kind: 'planet'; el: OrbitalElements } | { kind: 'mean'; el: MeanElements };

const kTmp: Kepler = { a: 0, e: 0, i: 0, node: 0, peri: 0, L: 0 };

export function elementsAt(src: ElementSource, d: number, out: Kepler = kTmp): Kepler {
  if (src.kind === 'planet') {
    const T = d / 36525;
    const el = src.el;
    out.a = el.a + el.rates.a * T;
    out.e = el.e + el.rates.e * T;
    out.i = el.i + el.rates.i * T;
    out.L = el.L + el.rates.L * T;
    out.peri = el.peri + el.rates.peri * T;
    out.node = el.node + el.rates.node * T;
  } else {
    const el = src.el;
    const dt = d - el.epoch;
    out.a = el.a;
    out.e = el.e;
    out.i = el.i;
    out.L = el.L + el.n * dt;
    out.peri = el.peri + el.periRate * dt;
    out.node = el.node + el.nodeRate * dt;
  }
  return out;
}

export const periodDays = (src: ElementSource) => (src.kind === 'planet' ? src.el.period : 360 / Math.abs(src.el.n));

function solveKepler(M: number, e: number) {
  let E = M + e * Math.sin(M);
  for (let k = 0; k < 10; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

/** Position (same units as k.a) in the scene frame. Returns the distance. */
export function keplerPosition(k: Kepler, out: THREE.Vector3) {
  const M = (((k.L - k.peri) % 360) + 360) % 360 * DEG;
  const E = solveKepler(M, k.e);
  const xv = k.a * (Math.cos(E) - k.e);
  const yv = k.a * Math.sqrt(1 - k.e * k.e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.hypot(xv, yv);
  const node = k.node * DEG;
  const inc = k.i * DEG;
  const u = v + (k.peri - k.node) * DEG;
  const x = r * (Math.cos(node) * Math.cos(u) - Math.sin(node) * Math.sin(u) * Math.cos(inc));
  const y = r * (Math.sin(node) * Math.cos(u) + Math.cos(node) * Math.sin(u) * Math.cos(inc));
  const z = r * Math.sin(u) * Math.sin(inc);
  eclToScene(x, y, z, out);
  return r;
}

/** Orbit normal (unit, scene frame) for given elements. */
export function orbitNormal(k: Kepler, out = new THREE.Vector3()) {
  const node = k.node * DEG, inc = k.i * DEG;
  return eclToScene(Math.sin(inc) * Math.sin(node), -Math.sin(inc) * Math.cos(node), Math.cos(inc), out);
}

/** Heliocentric position in AU, scene frame. Returns distance from the Sun in AU. */
export function orbitalPosition(src: ElementSource, d: number, out: THREE.Vector3) {
  return keplerPosition(elementsAt(src, d), out);
}

/**
 * Geocentric Moon (Meeus, "Astronomical Algorithms" ch. 47, main periodic terms):
 * ~0.3° in longitude, ~0.2° in latitude, ~500 km in distance.
 * Returns distance in km; `out` gets the unit direction in the scene frame.
 */
export function moonPosition(d: number, out: THREE.Vector3) {
  const r = (x: number) => (((x % 360) + 360) % 360) * DEG;
  const Lp = r(218.3164477 + 13.17639648 * d);
  const D = r(297.8501921 + 12.19074912 * d);
  const M = r(357.5291092 + 0.98560028 * d);
  const Mp = r(134.9633964 + 13.06499295 * d);
  const F = r(93.272095 + 13.22935024 * d);
  const sin = Math.sin, cos = Math.cos;
  // Meeus longitudes refer to the equinox of date; −1.397°/century brings them back to J2000.
  const lon = Lp - 1.397 * (d / 36525) * DEG + DEG * (
    6.288774 * sin(Mp) + 1.274027 * sin(2 * D - Mp) + 0.658314 * sin(2 * D) + 0.213618 * sin(2 * Mp)
    - 0.185116 * sin(M) - 0.114332 * sin(2 * F) + 0.058793 * sin(2 * D - 2 * Mp) + 0.057066 * sin(2 * D - M - Mp)
    + 0.053322 * sin(2 * D + Mp) + 0.045758 * sin(2 * D - M) - 0.040923 * sin(M - Mp) - 0.03472 * sin(D)
    - 0.030383 * sin(M + Mp) + 0.015327 * sin(2 * D - 2 * F) - 0.012528 * sin(Mp + 2 * F) + 0.01098 * sin(Mp - 2 * F));
  const lat = DEG * (
    5.128122 * sin(F) + 0.280602 * sin(Mp + F) + 0.277693 * sin(Mp - F) + 0.173237 * sin(2 * D - F)
    + 0.055413 * sin(2 * D - Mp + F) + 0.046271 * sin(2 * D - Mp - F) + 0.032573 * sin(2 * D + F) + 0.017198 * sin(2 * Mp + F));
  const dist = 385000.56 - 20905.355 * cos(Mp) - 3699.111 * cos(2 * D - Mp) - 2955.968 * cos(2 * D)
    - 569.925 * cos(2 * Mp) + 48.888 * cos(M) - 3.149 * cos(2 * F) + 246.158 * cos(2 * D - 2 * Mp)
    - 152.138 * cos(2 * D - M - Mp) - 170.733 * cos(2 * D + Mp) - 204.586 * cos(2 * D - M) - 129.62 * cos(M - Mp);
  eclToScene(cos(lat) * cos(lon), cos(lat) * sin(lon), sin(lat), out);
  return dist;
}

/**
 * Real distances span 0.39–30 AU while planets are tiny; showing both at true scale is
 * impossible on a screen. Distances are compressed with a power law, directions are exact.
 */
export const sceneDistance = (au: number) => 20 + 38 * Math.pow(au, 0.6);

/** Heliocentric body position in scene units for day d. */
export function scenePosition(src: ElementSource, d: number, out: THREE.Vector3) {
  const r = orbitalPosition(src, d, out);
  return out.multiplyScalar(sceneDistance(r) / r);
}

/**
 * Moon orbits are compressed the same way: distances up to 2.5 parent radii are true
 * (keeps Saturn's rings vs. Mimas right), beyond that they grow with the square root.
 */
export const satelliteDistance = (radii: number) => (radii <= 2.5 ? radii : 2.5 + 1.25 * (Math.sqrt(radii) - Math.sqrt(2.5)));

const CELESTIAL_NORTH = equToScene(0, 90);

/**
 * Body-fixed frame: local +Y = north pole, local +X = node of the body equator on the
 * ICRF equator (W = 0). Rotating the child by W about +Y gives the IAU orientation.
 */
export function basisFromPole(pole: THREE.Vector3, out = new THREE.Matrix4()) {
  const node = new THREE.Vector3().crossVectors(CELESTIAL_NORTH, pole);
  if (node.lengthSq() < 1e-10) node.set(1, 0, 0);
  node.normalize();
  const z = new THREE.Vector3().crossVectors(node, pole);
  return out.makeBasis(node, pole, z);
}

export function poleBasis(poleRa: number, poleDec: number) {
  return basisFromPole(equToScene(poleRa, poleDec));
}

/** Direction (unit, body-local) for planetocentric latitude / east longitude in degrees. */
export function latLonToLocal(lat: number, lon: number, out = new THREE.Vector3()) {
  const phi = (lon + 180) * DEG;
  const theta = (90 - lat) * DEG;
  return out.set(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
}

export function localToLatLon(v: THREE.Vector3) {
  const n = v.clone().normalize();
  const lat = 90 - Math.acos(THREE.MathUtils.clamp(n.y, -1, 1)) / DEG;
  let lon = Math.atan2(n.z, -n.x) / DEG - 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
}

/** Great-circle distance in km. */
export function surfaceDistanceKm(radiusKm: number, a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const p1 = a.lat * DEG, p2 = b.lat * DEG;
  const dl = (b.lon - a.lon) * DEG;
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatLatLon(lat: number, lon: number) {
  const la = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'с. ш.' : 'ю. ш.'}`;
  const lo = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'в. д.' : 'з. д.'}`;
  return `${la}, ${lo}`;
}
