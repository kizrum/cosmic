import * as THREE from 'three';
import { DEG, latLonToLocal } from '../astro';
import type { SiteShape } from '../data/siteShapes';

type LatLon = [number, number];

/** Point reached from (lat, lon) after `dist` km along `bearing` (deg from north) on a sphere. */
function destination([lat, lon]: LatLon, bearing: number, dist: number, R: number): LatLon {
  const d = dist / R, th = bearing * DEG, p1 = lat * DEG, l1 = lon * DEG;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(th));
  const l2 = l1 + Math.atan2(Math.sin(th) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [p2 / DEG, ((l2 / DEG + 540) % 360) - 180];
}

/** Azimuthal-equidistant coordinates (km east, km north) of a point relative to a centre. */
function tangent([lat0, lon0]: LatLon, [lat, lon]: LatLon, R: number): [number, number] {
  const p1 = lat0 * DEG, p2 = lat * DEG, dl = (lon - lon0) * DEG;
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const d = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  const th = Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl));
  return [d * Math.sin(th), d * Math.cos(th)];
}

const dirOf = ([lat, lon]: LatLon) => latLonToLocal(lat, lon, new THREE.Vector3());

export type OutlineState = 'hidden' | 'idle' | 'hover' | 'active';

const STYLE: Record<Exclude<OutlineState, 'hidden'>, { line: number; fill: number }> = {
  idle: { line: 0.6, fill: 0.05 },
  hover: { line: 1, fill: 0.2 },
  active: { line: 1, fill: 0.06 },
};
const ACTIVE_COLOR = new THREE.Color('#ffb347');

/** Outline + translucent fill of a surface region, living in the body-fixed frame. */
export class SiteOutline {
  readonly group = new THREE.Group();
  private readonly lineMat: THREE.LineBasicMaterial;
  private readonly fillMat: THREE.MeshBasicMaterial;
  private readonly color: THREE.Color;
  private readonly center: LatLon;
  private readonly polygon?: [number, number][];
  private state: OutlineState = 'hidden';
  /** Surface area in km² (smaller regions win when outlines overlap). */
  readonly area: number;

  constructor(
    private readonly shape: SiteShape,
    site: LatLon,
    private readonly radiusKm: number,
    radius: number,
    color: string,
  ) {
    this.color = new THREE.Color(color);
    this.lineMat = new THREE.LineBasicMaterial({ color: this.color, transparent: true, opacity: 0, depthWrite: false });
    this.fillMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    this.group.renderOrder = 4;
    this.group.visible = false;

    if (shape.type === 'band') {
      this.center = site;
      this.area = 2 * Math.PI * radiusKm ** 2 * Math.abs(Math.sin(shape.to * DEG) - Math.sin(shape.from * DEG));
      this.buildBand(shape.from, shape.to, radius);
      return;
    }
    let boundary: LatLon[];
    if (shape.type === 'polygon') {
      // Densify edges along great circles so long sides follow the curvature.
      const dirs = shape.points.map(dirOf);
      const c = dirs.reduce((s, v) => s.add(v), new THREE.Vector3()).normalize();
      this.center = latLonOf(c);
      boundary = [];
      dirs.forEach((a, i) => {
        const b = dirs[(i + 1) % dirs.length];
        for (let k = 0; k < 16; k++) boundary.push(latLonOf(slerp(a, b, k / 16)));
      });
      this.polygon = shape.points.map((p) => tangent(this.center, p, radiusKm));
      this.area = polygonArea(this.polygon);
    } else {
      this.center = shape.type === 'circle' && shape.center ? shape.center : site;
      const a = shape.type === 'circle' ? shape.r : shape.a;
      const b = shape.type === 'circle' ? shape.r : shape.b;
      const az = (shape.type === 'ellipse' ? shape.az : 0) * DEG;
      this.area = Math.PI * a * b;
      boundary = [];
      const N = 160;
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        const along = a * Math.cos(t), across = b * Math.sin(t);
        // Axis along the azimuth (clockwise from north) and its perpendicular, in (east, north).
        const e = along * Math.sin(az) + across * Math.cos(az);
        const n = along * Math.cos(az) - across * Math.sin(az);
        boundary.push(destination(this.center, Math.atan2(e, n) / DEG, Math.hypot(e, n), radiusKm));
      }
    }
    this.buildPatch(dirOf(this.center), boundary.map(dirOf), radius);
  }

  private buildPatch(center: THREE.Vector3, ring: THREE.Vector3[], radius: number) {
    const N = ring.length, K = 8;
    const pos: number[] = [];
    const idx: number[] = [];
    pos.push(...center.clone().multiplyScalar(radius).toArray());
    for (let k = 1; k <= K; k++) {
      for (const b of ring) pos.push(...slerp(center, b, k / K).multiplyScalar(radius).toArray());
    }
    for (let i = 0; i < N; i++) idx.push(0, 1 + i, 1 + ((i + 1) % N));
    for (let k = 1; k < K; k++) {
      const r0 = 1 + (k - 1) * N, r1 = 1 + k * N;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        idx.push(r0 + i, r1 + i, r1 + j, r0 + i, r1 + j, r0 + j);
      }
    }
    const fillGeo = new THREE.BufferGeometry();
    fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    fillGeo.setIndex(idx);
    this.group.add(new THREE.Mesh(fillGeo, this.fillMat));
    this.addLoop(ring.map((d) => d.clone().multiplyScalar(radius)));
  }

  private buildBand(from: number, to: number, radius: number) {
    const N = 256, K = 6;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let k = 0; k <= K; k++) {
      const lat = from + ((to - from) * k) / K;
      for (let i = 0; i < N; i++) pos.push(...dirOf([lat, (i / N) * 360 - 180]).multiplyScalar(radius).toArray());
    }
    for (let k = 0; k < K; k++) {
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, a = k * N, b = (k + 1) * N;
        idx.push(a + i, b + i, b + j, a + i, b + j, a + j);
      }
    }
    const fillGeo = new THREE.BufferGeometry();
    fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    fillGeo.setIndex(idx);
    this.group.add(new THREE.Mesh(fillGeo, this.fillMat));
    for (const lat of [from, to]) {
      this.addLoop(Array.from({ length: N }, (_, i) => dirOf([lat, (i / N) * 360 - 180]).multiplyScalar(radius)));
    }
  }

  private addLoop(points: THREE.Vector3[]) {
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), this.lineMat);
    line.renderOrder = 5;
    this.group.add(line);
  }

  /** True if the surface point lies inside the region. */
  contains(lat: number, lon: number) {
    const s = this.shape;
    if (s.type === 'band') return lat >= Math.min(s.from, s.to) && lat <= Math.max(s.from, s.to);
    const [x, y] = tangent(this.center, [lat, lon], this.radiusKm);
    if (s.type === 'polygon') return pointInPolygon(x, y, this.polygon!);
    const a = s.type === 'circle' ? s.r : s.a;
    const b = s.type === 'circle' ? s.r : s.b;
    const az = (s.type === 'ellipse' ? s.az : 0) * DEG;
    const along = x * Math.sin(az) + y * Math.cos(az);
    const across = x * Math.cos(az) - y * Math.sin(az);
    return (along / a) ** 2 + (across / b) ** 2 <= 1;
  }

  setState(state: OutlineState) {
    if (state === this.state) return;
    this.state = state;
    this.group.visible = state !== 'hidden';
    if (state === 'hidden') return;
    const st = STYLE[state];
    const c = state === 'active' ? ACTIVE_COLOR : this.color;
    this.lineMat.color.copy(c);
    this.fillMat.color.copy(c);
    this.lineMat.opacity = st.line;
    this.fillMat.opacity = st.fill;
  }
}

function slerp(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  const om = Math.acos(dot);
  if (om < 1e-6) return a.clone();
  const s = Math.sin(om);
  return a.clone().multiplyScalar(Math.sin((1 - t) * om) / s).add(b.clone().multiplyScalar(Math.sin(t * om) / s));
}

function latLonOf(v: THREE.Vector3): LatLon {
  const n = v.clone().normalize();
  const lat = 90 - Math.acos(THREE.MathUtils.clamp(n.y, -1, 1)) / DEG;
  let lon = Math.atan2(n.z, -n.x) / DEG - 180;
  if (lon < -180) lon += 360;
  return [lat, lon];
}

function pointInPolygon(x: number, y: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polygonArea(poly: [number, number][]) {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return Math.abs(s) / 2;
}
