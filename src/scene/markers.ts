/** Labels and markers over the scene: body names, belt names, site markers and outlines, the scan probe. */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { DEG } from '../astro';
import type { Site } from '../data/bodies';
import { REGIONS, type RegionDef } from '../data/regions';
import { categoryOf, shapeOf } from '../data/siteShapes';
import { bodyL, regionL } from '../data/localize';
import type { Mode } from '../navigation';
import { SiteOutline } from './SiteOutlines';
import { helioDistance } from './scale';
import type { Body, SolarSystem } from './SolarSystem';

export interface MarkerEvents {
  body(b: Body): void;
  site(b: Body, s: Site): void;
  region(r: RegionDef): void;
}

/** What the markers reflect this frame. */
export interface MarkerView {
  mode: Mode;
  focused: Body | null;
  focusedSite: Site | null;
  hovered: Body | null;
  showOrbits: boolean;
  flying: boolean;
}

const LABEL_PRIORITY: Record<string, number> = { star: 0, planet: 1, dwarf: 2, moon: 4 };

export class Markers {
  /** Scan point on a surface; parented to the scanned body's spin frame while in use. */
  readonly probe = new THREE.Object3D();
  readonly regionAnchors = new Map<string, THREE.Object3D>();
  /** Site under the pointer on the map and in the panel list. */
  readonly hover: { map: string | null; panel: string | null } = { map: null, panel: null };
  private readonly regionLabels: CSS2DObject[] = [];
  private readonly probeMarker: CSS2DObject;
  private readonly nameWidth = new Map<HTMLElement, number>();
  private readonly occluder = new THREE.Sphere();
  private readonly ray = new THREE.Ray();
  private readonly hitPt = new THREE.Vector3();
  private readonly tmpA = new THREE.Vector3();
  private readonly tmpB = new THREE.Vector3();
  private readonly labelPos = new THREE.Vector3();

  constructor(scene: THREE.Scene, private readonly system: SolarSystem, private readonly camera: THREE.PerspectiveCamera, on: MarkerEvents) {
    for (const b of system.bodies) {
      b.label.element.addEventListener('click', (e) => {
        e.stopPropagation();
        on.body(b);
      });
      for (const site of b.def.sites) this.addSite(b, site, on);
    }

    for (const r of REGIONS) {
      const anchor = new THREE.Object3D();
      placeRegion(anchor, r);
      const el = document.createElement('div');
      el.className = 'body-label region';
      el.innerHTML = `<span class="dot" style="--c:${r.color}"></span><span class="name"></span>`;
      el.querySelector('.name')!.textContent = regionL(r).name;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        on.region(r);
      });
      const label = new CSS2DObject(el);
      anchor.add(label);
      scene.add(anchor);
      this.regionAnchors.set(r.id, anchor);
      this.regionLabels.push(label);
    }

    const probeEl = document.createElement('div');
    probeEl.className = 'probe-marker';
    probeEl.innerHTML = '<i></i><i></i><i></i>';
    this.probeMarker = new CSS2DObject(probeEl);
    this.probe.add(this.probeMarker);
  }

  private addSite(b: Body, site: Site, on: MarkerEvents) {
    const cat = categoryOf(site, b.def.id);
    const el = document.createElement('button');
    el.className = 'site-marker';
    el.style.setProperty('--mc', cat.color);
    el.innerHTML = `<i></i><span></span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      on.site(b, site);
    });
    el.addEventListener('pointerenter', () => (this.hover.map = site.id));
    el.addEventListener('pointerleave', () => (this.hover.map = null));
    const shape = shapeOf(b.def.id, site.id);
    if (shape) {
      const outline = new SiteOutline(shape, [site.lat, site.lon], b.def.radiusKm, b.overlayRadius(), cat.color);
      b.spin.add(outline.group);
      b.siteOutlines.set(site.id, outline);
    }
    const marker = new CSS2DObject(el);
    marker.visible = false;
    b.siteAnchors.get(site.id)!.add(marker);
    b.siteMarkers.set(site.id, marker);
  }

  /** Belt labels follow the scale mode. */
  placeRegions() {
    for (const r of REGIONS) placeRegion(this.regionAnchors.get(r.id)!, r);
  }

  relang() {
    for (const b of this.system.bodies) {
      const l = bodyL(b.def);
      b.label.element.querySelector('.name')!.textContent = l.name;
      for (const site of l.sites) {
        const span = b.siteMarkers.get(site.id)?.element.querySelector('span');
        if (span) span.textContent = site.name;
      }
    }
    for (const r of REGIONS) {
      const label = this.regionAnchors.get(r.id)?.children[0] as CSS2DObject | undefined;
      const span = label?.element.querySelector('.name');
      if (span) span.textContent = regionL(r).name;
    }
    this.nameWidth.clear();
  }

  /** Moons are only labelled (and pickable) once the camera is in their planet's neighbourhood. */
  private nearParent(b: Body, focused: Body | null) {
    if (!b.parent || b.def.group !== 'moon') return true;
    const p = b.parent;
    const dist = this.camera.position.distanceTo(p.getWorldPosition(this.tmpA));
    return dist < b.root.position.length() * 5 || focused === p || focused?.parent === p;
  }

  update(v: MarkerView) {
    const cam = this.camera.position;
    const hot = (id: string) => id === this.hover.map || id === this.hover.panel;
    for (const b of this.system.bodies) {
      const isFocused = b === v.focused;
      const near = this.nearParent(b, v.focused);
      b.label.visible = !isFocused && near;
      b.label.element.classList.toggle('dim', v.mode !== 'system');
      if (b.orbitLine) {
        b.orbitLine.visible = v.showOrbits && near;
        const m = b.orbitLine.material as THREE.LineBasicMaterial;
        m.opacity = b === v.hovered || isFocused ? 0.6 : v.mode === 'system' ? 0.22 : b.def.group === 'moon' ? 0.18 : 0.1;
      }
      b.axis.visible = v.showOrbits && isFocused;
      const showSites = isFocused && !v.flying;
      for (const [id, outline] of b.siteOutlines) {
        outline.setState(!showSites ? 'hidden' : v.focusedSite?.id === id ? 'active' : hot(id) ? 'hover' : 'idle');
      }
      if (!showSites) {
        for (const marker of b.siteMarkers.values()) marker.visible = false;
        continue;
      }
      // Markers are hidden when the body is between the camera and the marker.
      this.occluder.set(b.getWorldPosition(this.tmpA), b.geoRadius * 0.97 * Math.min(b.spin.scale.x, b.spin.scale.y, b.spin.scale.z));
      for (const [id, marker] of b.siteMarkers) {
        marker.visible = true;
        marker.element.classList.toggle('current', v.focusedSite?.id === id);
        marker.element.classList.toggle('hot', hot(id));
        const toP = marker.parent!.getWorldPosition(this.tmpB).sub(cam);
        const dist = toP.length();
        this.ray.set(cam, toP.normalize());
        const hit = this.ray.intersectSphere(this.occluder, this.hitPt);
        const hidden = hit !== null && this.hitPt.distanceTo(cam) < dist - b.radius * 0.01;
        marker.element.classList.toggle('occluded', hidden);
      }
    }
    this.probeMarker.visible = !!this.probe.parent && !v.flying;
    this.layoutLabels(v.mode);
  }

  /**
   * Rings hug each body: diameter = apparent disc + a constant margin, so every object gets
   * the same visual gap. Names that would overlap a higher-priority name are hidden.
   */
  private layoutLabels(mode: Mode) {
    const { camera, labelPos } = this;
    const halfW = window.innerWidth / 2, halfH = window.innerHeight / 2;
    const focal = halfH / Math.tan((camera.fov * Math.PI) / 360);
    const items: { el: HTMLElement; x: number; y: number; s: number; prio: number; size: number }[] = [];
    const add = (obj: CSS2DObject, radius: number, prio: number) => {
      if (!obj.visible) return;
      obj.getWorldPosition(labelPos);
      const depth = labelPos.distanceTo(camera.position);
      labelPos.project(camera);
      if (labelPos.z > 1) return;
      const discPx = radius > 0 ? (2 * radius / depth) * focal : 0;
      const s = THREE.MathUtils.clamp(discPx + 10, 12, 96);
      const el = obj.element;
      el.style.setProperty('--s', `${s.toFixed(1)}px`);
      el.classList.toggle('big', discPx + 10 > 96);
      items.push({ el, x: (labelPos.x + 1) * halfW, y: (1 - labelPos.y) * halfH, s, prio, size: radius });
    };
    for (const b of this.system.bodies) add(b.label, b.radius, LABEL_PRIORITY[b.def.group] ?? 5);
    // Belt labels float in empty space: show them only in the overview, never over a planet.
    for (const l of this.regionLabels) {
      l.visible = mode === 'system' || mode === 'region';
      add(l, 0, 3);
    }

    items.sort((a, b) => a.prio - b.prio || b.size - a.size);
    const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
    for (const it of items) {
      const name = it.el.querySelector<HTMLElement>('.name')!;
      let w = this.nameWidth.get(name);
      if (!w) {
        w = name.offsetWidth;
        if (w) this.nameWidth.set(name, w);
      }
      const box = { x0: it.x + it.s / 2 + 6, x1: it.x + it.s / 2 + 10 + (w || 80), y0: it.y - 9, y1: it.y + 9 };
      const hit = placed.some((p) => box.x0 < p.x1 && box.x1 > p.x0 && box.y0 < p.y1 && box.y1 > p.y0);
      it.el.classList.toggle('crowded', hit);
      if (!hit) placed.push(box);
    }
  }
}

function placeRegion(anchor: THREE.Object3D, r: RegionDef) {
  const s = helioDistance(r.au);
  anchor.position.set(Math.cos(r.lon * DEG) * s, 0, -Math.sin(r.lon * DEG) * s);
}
