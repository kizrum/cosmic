/** Live numbers in the info panel: distances, signal delay, phases, local conditions. */
import * as THREE from 'three';
import { AU_KM, DEG, LIGHT_KM_S, elementsAt, keplerPosition, localToLatLon, moonPosition, orbitalPosition } from './astro';
import type { Body, SolarSystem } from './scene/SolarSystem';
import type { LiveStat } from './ui/UI';
import { bodyL } from './data/localize';
import { fmtNum, lang, t } from './i18n';

export type LatLon = { lat: number; lon: number };

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const rel = new THREE.Vector3();
const center = new THREE.Vector3();
const dir = new THREE.Vector3();
const toBody = new THREE.Quaternion();
const SUN = new THREE.Vector3();

export function fmtKm(km: number) {
  if (km > 1e9) return `${fmtNum(km / 1e9, { maximumFractionDigits: 3 })} ${t('bnKm')}`;
  if (km > 1e6) return `${fmtNum(km / 1e6, { maximumFractionDigits: 1 })} ${t('mnKm')}`;
  return `${fmtNum(Math.round(km))} ${t('km')}`;
}

export function fmtLight(km: number) {
  const s = km / LIGHT_KM_S;
  if (s < 60) return `${fmtNum(s, { maximumFractionDigits: 1 })} ${t('sec')}`;
  if (s < 3600) return `${Math.floor(s / 60)} ${t('min')} ${Math.round(s % 60)} ${t('sec')}`;
  return `${Math.floor(s / 3600)} ${t('hr')} ${Math.round((s % 3600) / 60)} ${t('min')}`;
}

/** Planetocentric position of a moon in km (scene frame); returns the distance. */
function moonOffsetKm(b: Body, d: number, out: THREE.Vector3) {
  if (b.def.id !== 'moon') return keplerPosition(elementsAt(b.def.orbit!, d), out);
  const km = moonPosition(d, out);
  out.multiplyScalar(km);
  return km;
}

/** True heliocentric position in AU (moons via their parent); independent of the scene layout. */
function helioAu(b: Body, d: number, out: THREE.Vector3): THREE.Vector3 {
  if (b.def.group === 'moon' && b.parent) {
    helioAu(b.parent, d, out);
    moonOffsetKm(b, d, rel);
    return out.addScaledVector(rel, 1 / AU_KM);
  }
  if (b.def.orbit) orbitalPosition(b.def.orbit, d, out);
  else out.set(0, 0, 0);
  return out;
}

/**
 * Body-fixed latitude / longitude of the point that has a world-space position straight
 * overhead. Only the body's rotation is undone: its shape scale would skew the direction.
 */
function overhead(b: Body, world: THREE.Vector3): LatLon {
  b.getWorldPosition(center);
  dir.copy(world).sub(center).applyQuaternion(b.spin.getWorldQuaternion(toBody).invert());
  return localToLatLon(dir);
}

/** Height in degrees above the horizon at `p` of an object standing overhead at `sub`. */
function elevation(p: LatLon, sub: LatLon) {
  const lat = p.lat * DEG, slat = sub.lat * DEG;
  const cosZ = Math.sin(lat) * Math.sin(slat) + Math.cos(lat) * Math.cos(slat) * Math.cos((p.lon - sub.lon) * DEG);
  return Math.asin(THREE.MathUtils.clamp(cosZ, -1, 1)) / DEG;
}

/** Height of the Sun above the local horizon, degrees. */
export const sunElevation = (b: Body, p: LatLon) => elevation(p, overhead(b, SUN));

/** Phase from true geometry (the scene's compressed distances would distort it). */
function moonPhase(system: SolarSystem, d: number) {
  const toSun = helioAu(system.get('earth'), d, tmpA).negate().normalize();
  const toMoon = tmpB;
  moonPosition(d, toMoon);
  const illum = (1 - toSun.dot(toMoon)) / 2;
  // Waxing when the Moon is east of the Sun: Sun→Moon turns counter-clockwise about ecliptic north (+Y).
  const waxing = toSun.cross(toMoon).y > 0;
  const pct = Math.round(illum * 100);
  const name = t(pct < 3 ? 'newMoon' : pct > 97 ? 'fullMoon' : pct < 50 ? (waxing ? 'waxCrescent' : 'wanCrescent') : waxing ? 'waxing' : 'waning');
  return t('illuminated', name, pct);
}

/** Distances and light time for the body panel, at day `d`. */
export function bodyStats(system: SolarSystem, b: Body, d: number): LiveStat[] {
  const def = b.def;
  const out: LiveStat[] = [];
  const earth = system.get('earth');
  if (def.id === 'sun') {
    const km = helioAu(earth, d, tmpA).length() * AU_KM;
    out.push({ label: t('distEarthNow'), value: fmtKm(km) });
    out.push({ label: t('lightToEarth'), value: fmtLight(km) });
    return out;
  }
  if (def.group === 'moon' && b.parent) {
    const km = moonOffsetKm(b, d, tmpA);
    const parent = b.parent.def;
    const parentName = lang === 'ru' ? parent.genitive ?? parent.name : bodyL(parent).name;
    out.push({ label: t('distTo', parentName), value: fmtKm(km) });
  }
  const helio = helioAu(b, d, tmpA);
  const au = helio.length();
  if (def.group !== 'moon') out.push({ label: t('distSunNow'), value: `${fmtKm(au * AU_KM)} (${fmtNum(au, { maximumFractionDigits: 3 })} ${t('au')})` });
  if (def.id !== 'earth' && def.id !== 'moon') {
    const km = helio.distanceTo(helioAu(earth, d, tmpB)) * AU_KM;
    out.push({ label: t('distEarthNow'), value: fmtKm(km) });
    out.push({ label: t('signalFromEarth'), value: fmtLight(km) });
  }
  if (def.id === 'moon') out.push({ label: t('phase'), value: moonPhase(system, d) });
  if (def.id === 'saturn') {
    // Solar elevation above the ring plane: which face of the rings is lit.
    const pole = tmpA.set(0, 1, 0).applyQuaternion(b.tilt.getWorldQuaternion(toBody));
    const toSun = b.getWorldPosition(tmpB).negate().normalize();
    const el = Math.asin(pole.dot(toSun)) / DEG;
    out.push({ label: t('ringSun'), value: t(el >= 0 ? 'ringLitN' : 'ringLitS', fmtNum(el, { maximumFractionDigits: 1 })) });
  }
  return out;
}

/** Day/night and local solar time at a surface point, from the actual sun direction. */
export function localConditions(b: Body, p: LatLon): LiveStat[] {
  const sub = overhead(b, SUN);
  const sign = (b.def.Wdot ?? 1) < 0 ? -1 : 1;
  let hour = 12 + (sign * ((p.lon - sub.lon + 540) % 360 - 180)) / 15;
  hour = (hour + 24) % 24;
  const elev = elevation(p, sub);
  const state = t(elev > 6 ? 'day' : elev > -6 ? 'twilight' : 'night');
  const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 60);
  const out: LiveStat[] = [
    { label: t('lighting'), value: state },
    { label: t('sunElev'), value: `${fmtNum(elev, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}°` },
    { label: t('solarTime'), value: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` },
  ];
  if (b.def.locked && b.parent) {
    // Synchronous moons: the parent hangs motionless in the sky of the near side.
    const pe = elevation(p, overhead(b, b.parent.getWorldPosition(tmpA)));
    out.push({ label: t('aboveHorizon', bodyL(b.parent.def).name), value: pe > 0 ? t('fixedInSky', fmtNum(pe, { maximumFractionDigits: 1 })) : t('notVisible') });
  }
  return out;
}
