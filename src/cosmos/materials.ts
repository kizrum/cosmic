/**
 * Materials of the neighbourhood and Galaxy views. Everything there is light on black
 * (stars, gas, glowing outlines), so it is drawn additively without depth testing.
 */
import * as THREE from 'three';

/** Point sprites with a soft glow; per-point `color` and `size` (pixels) attributes. */
export function glowPoints(opacity = 1, attenuate = false) {
  return new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: 1 }, uOpacity: { value: opacity }, uScale: { value: 1 } },
    vertexShader: `
attribute vec3 color;
attribute float size;
uniform float uPixelRatio;
uniform float uScale;
varying vec3 vColor;
void main() {
  vColor = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  ${attenuate ? 'gl_PointSize = clamp(size * uScale / -mv.z, 0.8, 6.0) * uPixelRatio;' : 'gl_PointSize = size * uPixelRatio;'}
}`,
    fragmentShader: `
uniform float uOpacity;
varying vec3 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float core = exp(-r * r * 6.0);
  gl_FragColor = vec4(vColor * core * uOpacity, 1.0);
}`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
}

/** Lines whose vertices carry a day (`aDay`): bright up to `uDays`, faint after (future path). */
export function trackLine(color: THREE.ColorRepresentation) {
  return new THREE.ShaderMaterial({
    uniforms: { uDays: { value: 0 }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 } },
    vertexShader: `
attribute float aDay;
varying float vDay;
void main() {
  vDay = aDay;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `
uniform float uDays;
uniform vec3 uColor;
uniform float uOpacity;
varying float vDay;
void main() {
  float a = vDay <= uDays ? 0.85 : 0.22;
  gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
}`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
}

/** Glowing translucent shell (brighter toward the rim), for the heliosphere boundaries. */
export function rimShell(color: THREE.ColorRepresentation, strength: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength }, uOpacity: { value: 1 } },
    vertexShader: `
varying vec3 vNormal;
varying vec3 vView;
varying float vFade;
attribute float aFade;
void main() {
  vFade = aFade;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `
uniform vec3 uColor;
uniform float uStrength;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vView;
varying float vFade;
void main() {
  float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
  float a = (0.015 + pow(rim, 4.0) * 0.55) * uStrength * vFade * uOpacity;
  gl_FragColor = vec4(uColor * a, 1.0);
}`,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
}

/** Approximate colour of a star from its B−V index (blackbody, Ballesteros 2012). */
export function starColor(bv: number | null, out = new THREE.Color()) {
  const b = THREE.MathUtils.clamp(bv ?? 0.65, -0.4, 2.0);
  const t = 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62));
  // Blackbody → sRGB (Tanner Helland's fit), softened toward white: stars look pale to the eye.
  const k = t / 100;
  const r = k <= 66 ? 255 : 329.7 * Math.pow(k - 60, -0.1332);
  const g = k <= 66 ? 99.47 * Math.log(k) - 161.12 : 288.12 * Math.pow(k - 60, -0.0755);
  const bl = k >= 66 ? 255 : k <= 19 ? 0 : 138.52 * Math.log(k - 10) - 305.04;
  const c = (v: number) => THREE.MathUtils.clamp(v, 0, 255) / 255;
  out.setRGB(c(r), c(g), c(bl), THREE.SRGBColorSpace);
  return out.lerp(new THREE.Color(1, 1, 1), 0.25);
}
