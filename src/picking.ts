/** What is under the pointer: bodies by their apparent disc, surfaces by ray cast. */
import * as THREE from 'three';
import { localToLatLon } from './astro';
import type { Site } from './data/bodies';
import type { Body, SolarSystem } from './scene/SolarSystem';

export class Picker {
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly v = new THREE.Vector3();
  private readonly hits: THREE.Intersection[] = [];

  constructor(private readonly camera: THREE.PerspectiveCamera, private readonly system: SolarSystem) {}

  /** Nearest labelled body whose disc (or a 16 px target around it) contains the point. */
  body(x: number, y: number, exclude: Body | null): Body | null {
    const { camera, v } = this;
    let best: Body | null = null;
    let bestDepth = Infinity;
    const halfH = window.innerHeight / 2;
    const focal = halfH / Math.tan((camera.fov * Math.PI) / 360);
    for (const b of this.system.bodies) {
      if (b === exclude || !b.label.visible) continue;
      b.getWorldPosition(v);
      const depth = v.distanceTo(camera.position);
      v.project(camera);
      if (v.z > 1) continue;
      const sx = ((v.x + 1) * window.innerWidth) / 2;
      const sy = (1 - v.y) * halfH;
      const rpx = (b.radius / depth) * focal;
      const d = Math.hypot(sx - x, sy - y);
      if (d < Math.max(rpx * 1.1, 16) && depth < bestDepth) {
        best = b;
        bestDepth = depth;
      }
    }
    return best;
  }

  /** Point on the surface of `b` under the pointer (the Sun has no surface to scan). */
  surface(x: number, y: number, b: Body | null) {
    if (!b || b.def.id === 'sun') return null;
    this.ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    this.hits.length = 0;
    return this.raycaster.intersectObject(b.surface, false, this.hits)[0] ?? null;
  }

  /** Smallest outlined site containing a surface point. */
  siteAt(b: Body, worldPoint: THREE.Vector3): Site | null {
    const { lat, lon } = localToLatLon(b.spin.worldToLocal(this.v.copy(worldPoint)));
    let best: Site | null = null;
    let bestArea = Infinity;
    for (const site of b.def.sites) {
      const o = b.siteOutlines.get(site.id);
      if (o && o.area < bestArea && o.contains(lat, lon)) {
        best = site;
        bestArea = o.area;
      }
    }
    return best;
  }
}
