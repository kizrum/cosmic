/**
 * Frames beyond the Solar System, expressed in the scene frame of astro.ts (ecliptic J2000,
 * y = ecliptic north), with the Sun at the origin:
 *  - the neighbourhood view measures in astronomical units,
 *  - the Galaxy view measures in light years.
 */
import * as THREE from 'three';
import { DEG, eclToScene, equToScene } from '../astro';

export const AU_PER_LY = 63_241.077;

/** Sun → Galactic centre distance (GRAVITY collaboration 2019: 8.178 kpc). */
export const R0_LY = 26_670;

/** Galactic axes in the scene frame: x toward the centre, y toward l = 90°, z to the north pole. */
const GX = equToScene(266.405, -28.936);
const GZ = equToScene(192.859, 27.128);
GX.addScaledVector(GZ, -GX.dot(GZ)).normalize();
const GY = new THREE.Vector3().crossVectors(GZ, GX);

/** Matrix taking galactic Sun-centred coordinates (any unit) to the scene frame. */
export const GALACTIC_BASIS = new THREE.Matrix4().makeBasis(GX, GY, GZ);

export function galacticToScene(x: number, y: number, z: number, out = new THREE.Vector3()) {
  return out.set(0, 0, 0).addScaledVector(GX, x).addScaledVector(GY, y).addScaledVector(GZ, z);
}

/** Direction (scene frame) and distance for a position given by RA/Dec (degrees). */
export const equatorial = (raDeg: number, decDeg: number, distance: number) => equToScene(raDeg, decDeg).multiplyScalar(distance);

/** Unit vector in the scene frame for ecliptic longitude / latitude in degrees. */
export function eclipticDir(lonDeg: number, latDeg: number, out = new THREE.Vector3()) {
  const l = lonDeg * DEG, b = latDeg * DEG;
  return eclToScene(Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b), out);
}

/**
 * The face-on Milky Way image (NASA/JPL-Caltech/R. Hurt, PIA10748) seen from the north
 * Galactic pole with the centre at the image centre. Calibrated against the annotated
 * public-domain map "Milky Way Arms ssc2008-10.svg": the Sun sits 0.1929 image widths
 * below the centre (and 0.0019 to the right); the width is scaled so that this is R0.
 */
export const IMAGE = {
  sunU: 0.5019,
  sunV: 0.6929,
  widthLy: R0_LY / 0.1929,
};

/** Image coordinates (u right, v down, 0…1) → galactic Sun-centred x, y in light years. */
export function imageToGalactic(u: number, v: number) {
  return { x: -(v - IMAGE.sunV) * IMAGE.widthLy, y: -(u - IMAGE.sunU) * IMAGE.widthLy };
}
