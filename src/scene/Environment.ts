import * as THREE from 'three';
import { DEG, equToScene } from '../astro';
import { AU_UNITS, helioDistance, scale } from './scale';

/**
 * Milky Way panorama in galactic coordinates, oriented with the real galactic
 * centre (RA 266.405°, Dec −28.936°) and north galactic pole (RA 192.859°, Dec 27.128°).
 */
export function createSky(loader: THREE.TextureLoader) {
  const tex = loader.load('textures/stars.jpg');
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.SphereGeometry(9000, 64, 32);
  // Seen from inside, longitude must increase to the left: mirror U.
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, color: new THREE.Color(0.62, 0.6, 0.6) });
  const sky = new THREE.Mesh(geo, mat);
  const gc = equToScene(266.405, -28.936);
  const ngp = equToScene(192.859, 27.128);
  const x = gc.clone().sub(ngp.clone().multiplyScalar(gc.dot(ngp))).normalize();
  const z = new THREE.Vector3().crossVectors(x, ngp);
  sky.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, ngp, z));
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  // Stars are effectively at infinity: the sky moves with the camera, so it never distorts
  // or drifts away however far the camera travels.
  sky.onBeforeRender = (_r, _s, camera) => {
    sky.position.copy(camera.position);
    sky.updateMatrixWorld();
  };
  return sky;
}

/**
 * Kuiper belt: cold classical objects (42–47 AU, low inclination), plutinos in the 3:2
 * resonance with Neptune (39.4 AU, eccentric) and a dynamically hot population.
 */
export class KuiperBelt {
  readonly points: THREE.Points;
  private readonly el: { a: number; e: number; i: number; node: number; peri: number; M0: number }[] = [];
  private readonly pos: Float32Array;
  private lastD = NaN;
  private lastScale = 0;

  constructor(count = 3500) {
    for (let k = 0; k < count; k++) {
      const r = Math.random();
      let a: number, e: number, i: number;
      if (r < 0.25) { a = 39.4 + (Math.random() - 0.5) * 0.4; e = 0.1 + Math.random() * 0.2; i = Math.random() * 20; }
      else if (r < 0.7) { a = 42 + Math.random() * 5.5; e = Math.random() * 0.08; i = Math.random() ** 2 * 5; }
      else { a = 40 + Math.random() * 9; e = Math.random() * 0.25; i = 5 + Math.random() * 25; }
      this.el.push({ a, e, i: i * DEG, node: Math.random() * Math.PI * 2, peri: Math.random() * Math.PI * 2, M0: Math.random() * Math.PI * 2 });
    }
    this.pos = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0x9fb4cc, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    this.points.frustumCulled = false;
  }

  update(d: number) {
    // Periods are ~250–330 years: recompute only when the date (or the scale) changed.
    if (Math.abs(d - this.lastD) < 20 && scale.t === this.lastScale) return;
    this.lastD = d;
    this.lastScale = scale.t;
    this.el.forEach((o, k) => {
      const M = o.M0 + (d / (365.256 * Math.pow(o.a, 1.5))) * Math.PI * 2;
      let E = M;
      for (let it = 0; it < 6; it++) E -= (E - o.e * Math.sin(E) - M) / (1 - o.e * Math.cos(E));
      const xv = o.a * (Math.cos(E) - o.e), yv = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
      const v = Math.atan2(yv, xv), r = Math.hypot(xv, yv);
      const u = v + o.peri;
      const cn = Math.cos(o.node), sn = Math.sin(o.node), ci = Math.cos(o.i), si = Math.sin(o.i);
      const x = cn * Math.cos(u) - sn * Math.sin(u) * ci;
      const y = sn * Math.cos(u) + cn * Math.sin(u) * ci;
      const z = Math.sin(u) * si;
      const s = helioDistance(r);
      this.pos[k * 3] = x * s;
      this.pos[k * 3 + 1] = z * s;
      this.pos[k * 3 + 2] = -y * s;
    });
    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}

/** Main asteroid belt with Kirkwood gaps (3:1, 5:2, 7:3, 2:1 resonances with Jupiter). */
export class AsteroidBelt {
  readonly mesh: THREE.InstancedMesh;
  /**
   * Orbits are evaluated on the GPU: each instance carries its elements (a, phase,
   * inclination, node) and spin (axis, size); only a few uniforms change per frame.
   */
  private readonly u = { uYears: { value: 0 }, uScaleT: { value: 0 }, uAU: { value: AU_UNITS }, uSpin: { value: 0 } };

  constructor(count = 7000) {
    // 20-face rocks: at their on-screen size (a few pixels) more facets are invisible.
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i);
      const k = 0.65 + 0.35 * Math.sin(p.x * 3.1 + 1.7) * Math.cos(p.y * 2.3) + 0.2 * Math.sin(p.z * 5.0);
      p.multiplyScalar(k);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    geo.computeVertexNormals();

    const orbit = new Float32Array(count * 4);
    const spin = new Float32Array(count * 4);
    const gaps = [2.06, 2.5, 2.82, 2.95, 3.27];
    const colors = new Float32Array(count * 3);
    const axis = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      let a: number;
      do {
        a = 2.1 + Math.pow(Math.random(), 1.3) * 1.2;
      } while (gaps.some((g) => Math.abs(a - g) < 0.025 * (0.4 + Math.random())));
      orbit.set([a, Math.random() * Math.PI * 2, (Math.random() ** 2) * 18 * DEG, Math.random() * Math.PI * 2], i * 4);
      axis.randomDirection();
      // Real asteroids would be invisible specks millions of km apart; sizes are exaggerated.
      spin.set([axis.x, axis.y, axis.z, 0.03 + Math.pow(Math.random(), 5) * 0.22], i * 4);
      // C-type (dark) dominate the outer belt, S-type (lighter, reddish) the inner.
      const outer = THREE.MathUtils.smoothstep(a, 2.4, 3.0);
      const k = 0.8 + Math.random() * 0.4;
      colors.set([(0.75 - outer * 0.3) * k, (0.68 - outer * 0.28) * k, (0.6 - outer * 0.25) * k], i * 3);
    }
    geo.setAttribute('aOrbit', new THREE.InstancedBufferAttribute(orbit, 4));
    geo.setAttribute('aSpin', new THREE.InstancedBufferAttribute(spin, 4));

    const mat = new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 1, flatShading: true });
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.u);
      shader.vertexShader = `
attribute vec4 aOrbit;
attribute vec4 aSpin;
uniform float uYears;
uniform float uScaleT;
uniform float uAU;
uniform float uSpin;
vec3 rotAxis(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }
` + shader.vertexShader.replace('#include <begin_vertex>', `
  float sa = aOrbit.x;
  float M = aOrbit.y + 6.2831853 * fract(uYears / pow(sa, 1.5));
  float rVis = 20.0 + 38.0 * pow(sa, 0.6);
  float r = exp(mix(log(rVis), log(sa * uAU), uScaleT));
  float cn = cos(aOrbit.w), sn = sin(aOrbit.w), cu = cos(M), su = sin(M), ci = cos(aOrbit.z), si = sin(aOrbit.z);
  vec3 orb = vec3(cn * cu - sn * su * ci, su * si, -(sn * cu + cn * su * ci)) * r;
  vec3 transformed = rotAxis(position * aSpin.w, aSpin.xyz, uSpin + float(gl_InstanceID)) + orb;
`);
    };
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    // Instance matrices stay identity: the transform is computed in the shader.
    for (let i = 0; i < count; i++) this.mesh.setMatrixAt(i, new THREE.Matrix4());
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    this.mesh.frustumCulled = false;
  }

  update(d: number) {
    this.u.uYears.value = (d / 365.256) % 1e4;
    this.u.uScaleT.value = scale.t;
    this.u.uSpin.value = (d * 0.3) % (Math.PI * 2);
  }
}
