/**
 * Where the viewer is: the overview, a belt, a body, or a point on a surface. Each step
 * opens its panel and flies the camera there; the info panel's live numbers follow it.
 */
import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { localToLatLon, surfaceDistanceKm } from './astro';
import type { CameraDirector } from './CameraDirector';
import type { SimClock } from './clock';
import type { Site } from './data/bodies';
import type { RegionDef } from './data/regions';
import type { Display } from './display';
import { t } from './i18n';
import { bodyStats, localConditions, sunElevation, type LatLon } from './liveStats';
import type { Markers } from './scene/markers';
import { helioDistance, systemFactor } from './scene/scale';
import type { Body, SolarSystem } from './scene/SolarSystem';
import * as sound from './ui/sound';
import type { UI } from './ui/UI';

export type Mode = 'system' | 'region' | 'body' | 'site';

const OVERVIEW = new THREE.Vector3(0, 300, 470);
const ORIGIN = new THREE.Vector3();
const FRAMING: Record<string, number> = { saturn: 6.5, sun: 4.2, haumea: 6, jupiter: 11, uranus: 10, neptune: 8 };

export interface NavigationDeps {
  system: SolarSystem;
  director: CameraDirector;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  ui: UI;
  clock: SimClock;
  display: Display;
  markers: Markers;
}

export class Navigation {
  mode: Mode = 'system';
  focused: Body | null = null;
  focusedSite: Site | null = null;
  private region: RegionDef | null = null;
  /** Scanned surface point (when not at a known site) and the closest known site to it. */
  private point: LatLon | null = null;
  private nearest: { site: Site; km: number } | undefined;
  private liveTimer = 0;
  private readonly tmp = new THREE.Vector3();

  constructor(private readonly d: NavigationDeps) {
    // Flights never pass through a body (its current size: the scale mode changes it).
    d.director.obstacles = () => d.system.bodies.map((b) => ({ center: (out) => b.getWorldPosition(out), radius: b.radius * 1.08 }));
  }

  private get probe() {
    return this.d.markers.probe;
  }

  /** Overview vantage scaled with the system (illustrative → true scale). */
  private overview() {
    return OVERVIEW.clone().multiplyScalar(systemFactor());
  }

  /** Leave the current step: no site, no probe, haze back on, time warp restored. */
  private reset(mode: Mode, focused: Body | null) {
    this.d.display.clearAutoLight();
    this.d.clock.releaseRealtime();
    this.mode = mode;
    this.focused = focused;
    this.focusedSite = null;
    this.probe.removeFromParent();
    this.setSurfaceView(null);
  }

  /** The Solar System is being left for a wider view: drop any selection, no flight. */
  leave() {
    this.reset('system', null);
    this.d.ui.showSystem();
  }

  goSystem(onArrive?: () => void) {
    const { system, ui, director } = this.d;
    this.reset('system', null);
    ui.showSystem();
    ui.hint(t('hintSystem'));
    const sunR = system.get('sun').radius;
    director.flyTo({
      anchor: null, position: this.overview(), target: new THREE.Vector3(),
      minDistance: sunR * 1.6, maxDistance: 3000 * systemFactor(),
      avoid: { center: (out) => out.copy(ORIGIN), radius: sunR * 1.3 },
      pullBack: true,
      onArrive,
    });
  }

  /** The overview, entered by zooming in from the neighbourhood (the camera is already there). */
  arriveSystem() {
    this.reset('system', null);
    this.d.ui.showSystem();
  }

  /** Camera distance of the overview (scene units). */
  get overviewDistance() {
    return OVERVIEW.length() * systemFactor();
  }

  /** Closest the camera may come to the Sun in the overview. */
  get overviewMinDistance() {
    return this.d.system.get('sun').radius * 1.6;
  }

  focusRegion(r: RegionDef) {
    const { ui, director, markers } = this.d;
    this.region = r;
    this.reset('region', null);
    ui.showRegion(r);
    ui.hint(t('hintRegion'));
    const target = markers.regionAnchors.get(r.id)!.position.clone();
    const dir = target.clone().normalize();
    const position = dir.multiplyScalar(helioDistance(r.viewAu)).add(new THREE.Vector3(0, r.viewHeight * systemFactor(), 0));
    director.flyTo({ anchor: null, position, target, minDistance: 5 * systemFactor(), maxDistance: 1500 * systemFactor() });
  }

  /** How far the camera may pull back from a body: far enough to see its whole moon system. */
  private maxDistance(b: Body) {
    const base = b.radius * (b.def.id === 'sun' ? 25 : b.def.group === 'planet' ? 40 : 60);
    let extent = 0;
    for (const m of this.d.system.bodies) {
      if (m.parent === b && m.def.group === 'moon') extent = Math.max(extent, m.root.position.length());
    }
    return Math.max(base, extent * 3);
  }

  focusBody(b: Body) {
    const { ui, director, camera } = this.d;
    const prev = this.focused;
    this.reset('body', b);
    ui.showBody(b.def);
    ui.hint(b.def.id === 'sun' ? t('hintSun') : t('hintBody'));

    const center = b.getWorldPosition();
    const R = b.radius;
    const fromCam = camera.position.clone().sub(center).normalize();
    const toSun = center.clone().negate().normalize();
    // Rings are only bright on the face the Sun shines on: view Saturn from that side.
    const pole = new THREE.Vector3(0, 1, 0).applyQuaternion(b.tilt.getWorldQuaternion(new THREE.Quaternion()));
    // Giant planets: look down on the moon system at an angle so the orbits are in frame.
    const moonSystem = ['jupiter', 'uranus', 'neptune'].includes(b.def.id);
    const up = b.def.id === 'saturn'
      ? pole.multiplyScalar(Math.sign(pole.dot(toSun)) * 0.45)
      : new THREE.Vector3(0, moonSystem ? 0.75 : 0.3, 0);
    let dir: THREE.Vector3;
    if (b.def.id === 'sun') dir = fromCam.add(new THREE.Vector3(0, 0.35, 0)).normalize();
    else if (prev === b) dir = fromCam;
    else if (b.def.group === 'moon' && b.parent) {
      // Moons are approached from the outside, with their planet in the background: the view
      // tells where you are, and flying back to the planet is a straight push forward.
      const outward = center.clone().sub(b.parent.getWorldPosition()).normalize();
      dir = outward.multiplyScalar(0.8).add(toSun.multiplyScalar(0.35)).add(new THREE.Vector3(0, 0.3, 0)).normalize();
    } else dir = toSun.multiplyScalar(0.6).add(fromCam.multiplyScalar(0.5)).add(up).normalize();
    const distance = R * (FRAMING[b.def.id] ?? 3.8);
    this.d.system.expectView(b, distance);
    director.flyTo({
      anchor: b.root,
      position: center.clone().addScaledVector(dir, distance),
      target: center,
      minDistance: R * 1.2,
      maxDistance: this.maxDistance(b),
      avoid: { center: (out) => b.getWorldPosition(out), radius: R * 1.08 },
    });
  }

  private enterSite(b: Body) {
    if (this.focused !== b) {
      this.focused = b;
      this.d.ui.setActiveBody(b.def.id);
    }
    this.mode = 'site';
    this.d.clock.holdRealtime();
    this.setSurfaceView(b);
  }

  private surfaceView(b: Body, anchor: THREE.Object3D, altitude: number) {
    const center = b.getWorldPosition();
    const p = anchor.getWorldPosition(new THREE.Vector3());
    const normal = p.clone().sub(center).normalize();
    // Approach at an angle from the side the camera is already on.
    const side = this.d.camera.position.clone().sub(p);
    side.addScaledVector(normal, -side.dot(normal));
    if (side.lengthSq() < 1e-8) side.set(0, 1, 0).addScaledVector(normal, -normal.y);
    side.normalize();
    const h = b.radius * altitude;
    this.d.system.expectView(b, p.distanceTo(center) + h);
    this.d.director.flyTo({
      anchor,
      position: p.clone().addScaledVector(normal, h).addScaledVector(side, h * 0.55),
      target: p,
      minDistance: b.radius * 0.04,
      maxDistance: b.radius * 3,
      avoid: { center: (out) => b.getWorldPosition(out), radius: b.radius * 1.012 },
    });
  }

  focusSite(b: Body, s: Site) {
    this.enterSite(b);
    this.focusedSite = s;
    this.probe.removeFromParent();
    this.d.ui.showSite(b.def, s);
    this.d.ui.hint(t('hintSite'));
    this.surfaceView(b, b.siteAnchors.get(s.id)!, s.elevation ? 0.9 : 0.42);
    sound.scan();
    if (!s.elevation) this.autoLight(b, s);
  }

  /** Inspect an arbitrary surface point: coordinates, local conditions, nearest known site. */
  scanPoint(b: Body, worldPoint: THREE.Vector3) {
    const local = b.spin.worldToLocal(worldPoint.clone());
    const p = localToLatLon(local);
    this.probe.position.copy(local);
    b.spin.add(this.probe);
    this.probe.updateWorldMatrix(true, false);
    this.enterSite(b);
    this.focusedSite = null;
    this.point = p;
    let nearest: { site: Site; km: number } | undefined;
    for (const s of b.def.sites) {
      if (s.elevation) continue;
      const km = surfaceDistanceKm(b.def.radiusKm, p, s);
      if (!nearest || km < nearest.km) nearest = { site: s, km };
    }
    this.nearest = nearest;
    this.d.ui.showPoint(b.def, { ...p, nearest, status: localConditions(b, p) });
    this.d.ui.hint(t('hintBack'));
    this.surfaceView(b, this.probe, 0.42);
    sound.scan();
    this.autoLight(b, p);
  }

  /** Night-side sites would be black: the fill light comes on (not on Earth: city lights). */
  private autoLight(b: Body, p: LatLon) {
    if (this.d.display.autoLight(sunElevation(b, p) < -6 && b.def.id !== 'earth')) this.d.ui.hint(t('hintNight'));
  }

  /**
   * Surface inspection: Venus and Titan drop their opaque haze (radar / infrared view),
   * Earth's clouds thin out so the terrain stays readable.
   */
  private setSurfaceView(b: Body | null) {
    for (const body of this.d.system.bodies) {
      if (!body.clouds) continue;
      body.cloudOpacityTarget = body !== b ? 1 : body.def.id === 'earth' ? 0.45 : 0;
    }
  }

  /** One level up: site → body, moon → planet, body or belt → overview. */
  back() {
    const f = this.focused;
    if (this.mode === 'site' && f) this.focusBody(f);
    else if (this.mode === 'body' && f?.def.group === 'moon' && f.parent) this.focusBody(f.parent);
    else if (this.mode === 'body' || this.mode === 'region') this.goSystem();
  }

  /** Re-render the open panel in place (after a language switch): no animation, no re-scan. */
  refreshPanel() {
    const { ui, display } = this.d;
    const f = this.focused;
    if (this.mode === 'system') ui.hint(t('hintSystem'));
    else if (this.mode === 'region' && this.region) {
      ui.showRegion(this.region, false);
      ui.hint(t('hintRegion'));
    } else if (this.mode === 'body' && f) {
      ui.showBody(f.def, false);
      ui.hint(f.def.id === 'sun' ? t('hintSun') : t('hintBody'));
    } else if (this.mode === 'site' && f && this.focusedSite) {
      ui.showSite(f.def, this.focusedSite, false);
      ui.hint(display.autoLit ? t('hintNight') : t('hintSite'));
    } else if (this.mode === 'site' && f && this.point) {
      ui.showPoint(f.def, { ...this.point, nearest: this.nearest, status: localConditions(f, this.point) }, false);
      ui.hint(t('hintBack'));
    }
    this.liveTimer = 0;
  }

  /** Live numbers in the panel, four times a second. */
  refreshLive(dt: number) {
    const { ui, system, clock } = this.d;
    const f = this.focused;
    this.liveTimer -= dt;
    if (this.liveTimer > 0 || !f) return;
    this.liveTimer = 0.25;
    if (this.mode === 'body') ui.setLive(bodyStats(system, f, clock.days));
    else if (this.mode === 'site') {
      // Ring features have no local sky: they keep the static panel.
      const p = this.focusedSite ? (this.focusedSite.elevation ? null : this.focusedSite) : this.point;
      if (p) ui.setLive(localConditions(f, p));
    }
  }

  // ── Framing ──────────────────────────────────────────────────────────────────
  private lastFactor = 1;
  private lastBodyScale = 1;
  private lastFocus: Body | null = null;

  /**
   * Keep the framing while the scale animates: in the overview the camera scales with the
   * system, next to a body the camera's offset scales with the body.
   */
  followScale() {
    const { camera, controls, director } = this.d;
    const factor = systemFactor();
    const focused = this.focused;
    const bodyScale = focused?.sizeScale ?? 1;
    if (focused !== this.lastFocus) {
      this.lastFocus = focused;
      this.lastBodyScale = bodyScale;
    }
    if (!director.flying) {
      if ((this.mode === 'system' || this.mode === 'region') && factor !== this.lastFactor) {
        const k = factor / this.lastFactor;
        camera.position.multiplyScalar(k);
        controls.target.multiplyScalar(k);
        controls.minDistance *= k;
        controls.maxDistance *= k;
      } else if (focused && bodyScale !== this.lastBodyScale) {
        const k = bodyScale / this.lastBodyScale;
        const c = focused.getWorldPosition(this.tmp);
        camera.position.sub(c).multiplyScalar(k).add(c);
        controls.target.sub(c).multiplyScalar(k).add(c);
        controls.minDistance *= k;
        controls.maxDistance *= k;
      }
      // Moon systems spread out at true scale: allow pulling back far enough to see them.
      if (focused && this.mode === 'body') controls.maxDistance = this.maxDistance(focused);
    }
    this.lastFactor = factor;
    this.lastBodyScale = bodyScale;
  }

  private readonly viewShift = { x: 0, y: 0 };

  /**
   * Keep the subject centred in the part of the screen the info panel leaves free:
   * the projection is shifted (setViewOffset), so camera flights and controls are unchanged.
   */
  frameFreeArea(dt: number) {
    const { camera, ui } = this.d;
    const W = window.innerWidth, H = window.innerHeight;
    let tx = 0, ty = 0;
    const occ = this.mode === 'system' ? null : ui.occlusion();
    if (occ) {
      const besideMiddle = occ.top < H * 0.6 && occ.bottom > H * 0.4;
      if (occ.left > W * 0.4 && besideMiddle) tx = (W - occ.left) / 2; // side panel
      else if (occ.top > H * 0.35 && occ.width > W * 0.6) ty = (H - occ.top) / 2; // bottom sheet
    }
    const k = Math.min(1, dt * 5);
    const s = this.viewShift;
    s.x += (tx - s.x) * k;
    s.y += (ty - s.y) * k;
    if (Math.abs(s.x) < 0.5 && Math.abs(s.y) < 0.5) {
      if (camera.view?.enabled) camera.clearViewOffset();
    } else {
      camera.setViewOffset(W, H, s.x, s.y, W, H);
    }
  }
}
