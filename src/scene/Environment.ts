import * as THREE from 'three';
import { DEG, equToScene, sceneDistance } from '../astro';

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
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, color: new THREE.Color(0.55, 0.55, 0.6) });
  const sky = new THREE.Mesh(geo, mat);
  const gc = equToScene(266.405, -28.936);
  const ngp = equToScene(192.859, 27.128);
  const x = gc.clone().sub(ngp.clone().multiplyScalar(gc.dot(ngp))).normalize();
  const z = new THREE.Vector3().crossVectors(x, ngp);
  sky.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, ngp, z));
  sky.renderOrder = -10;
  sky.frustumCulled = false;
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
    // Periods are ~250–330 years: recompute only when the date moved noticeably.
    if (Math.abs(d - this.lastD) < 20) return;
    this.lastD = d;
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
      const s = sceneDistance(r);
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
  private readonly a: Float32Array;
  private readonly phase: Float32Array;
  private readonly incl: Float32Array;
  private readonly node: Float32Array;
  private readonly scale: Float32Array;
  private readonly spinAxis: THREE.Vector3[] = [];
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly qs = new THREE.Quaternion();
  private readonly p = new THREE.Vector3();
  private readonly s = new THREE.Vector3();

  constructor(count = 7000) {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      this.p.fromBufferAttribute(pos, i);
      const k = 0.65 + 0.35 * Math.sin(this.p.x * 3.1 + 1.7) * Math.cos(this.p.y * 2.3) + 0.2 * Math.sin(this.p.z * 5.0);
      this.p.multiplyScalar(k);
      pos.setXYZ(i, this.p.x, this.p.y, this.p.z);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 1, flatShading: true });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    this.a = new Float32Array(count);
    this.phase = new Float32Array(count);
    this.incl = new Float32Array(count);
    this.node = new Float32Array(count);
    this.scale = new Float32Array(count);
    const gaps = [2.06, 2.5, 2.82, 2.95, 3.27];
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      let a: number;
      do {
        a = 2.1 + Math.pow(Math.random(), 1.3) * 1.2;
      } while (gaps.some((g) => Math.abs(a - g) < 0.025 * (0.4 + Math.random())));
      this.a[i] = a;
      this.phase[i] = Math.random() * Math.PI * 2;
      this.incl[i] = (Math.random() ** 2) * 18 * DEG;
      this.node[i] = Math.random() * Math.PI * 2;
      // Real asteroids would be invisible specks millions of km apart; sizes are exaggerated.
      this.scale[i] = 0.03 + Math.pow(Math.random(), 5) * 0.22;
      this.spinAxis.push(new THREE.Vector3().randomDirection());
      // C-type (dark) dominate the outer belt, S-type (lighter, reddish) the inner.
      const outer = THREE.MathUtils.smoothstep(a, 2.4, 3.0);
      color.setRGB(0.75 - outer * 0.3, 0.68 - outer * 0.28, 0.6 - outer * 0.25).multiplyScalar(0.8 + Math.random() * 0.4);
      this.mesh.setColorAt(i, color);
    }
  }

  update(d: number) {
    for (let i = 0; i < this.a.length; i++) {
      const a = this.a[i];
      const M = this.phase[i] + (d / (365.256 * Math.pow(a, 1.5))) * Math.PI * 2;
      const r = sceneDistance(a);
      const cn = Math.cos(this.node[i]), sn = Math.sin(this.node[i]);
      const cu = Math.cos(M), su = Math.sin(M);
      const ci = Math.cos(this.incl[i]), si = Math.sin(this.incl[i]);
      const x = cn * cu - sn * su * ci;
      const y = sn * cu + cn * su * ci;
      const z = su * si;
      this.p.set(x * r, z * r, -y * r);
      this.qs.setFromAxisAngle(this.spinAxis[i], d * 0.3 + i);
      this.s.setScalar(this.scale[i]);
      this.m.compose(this.p, this.q.copy(this.qs), this.s);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
