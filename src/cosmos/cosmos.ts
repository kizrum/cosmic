/**
 * The scales of the cosmos as one continuous zoom: the Solar System, the Solar
 * neighbourhood (heliosphere, spacecraft, Oort cloud, nearest stars) and the Milky Way.
 *
 * In overview mode (nothing selected) the camera's distance is a single number — its
 * logarithm, L = log₁₀(distance in AU) — and the scene on screen follows from it: each
 * scale owns a band of L and neighbouring scales cross-fade over a fixed window around
 * their meeting point, where both show the same distance in the same direction. The
 * wheel, a pinch, the breadcrumbs and the object list all move L, so the way out and the
 * way back are the same path. Along it lie four stops — the Solar System, the heliosphere
 * (with the Voyagers), the Solar neighbourhood (nearest stars) and the Milky Way — the
 * breadcrumbs above the Solar System; the wheel settles on a stop it is released near, and
 * the Sun's label or Esc go one stop toward the Solar System. Selecting a spacecraft, a star or an arm leaves the zoom
 * for an ordinary flight to it; going back returns to the zoom at the height it left.
 */
import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CameraDirector } from '../CameraDirector';
import type { SimClock } from '../clock';
import { LEVEL_PANEL, levelOf, type DeepDef, type DeepRealm, type Level } from '../data/deep';
import { deepL, starInfoL } from '../data/localize';
import { fmtNum, t } from '../i18n';
import type { Navigation } from '../navigation';
import type { LabeledView } from '../scene/renderer';
import { helioDistance } from '../scene/scale';
import type { UI } from '../ui/UI';
import { AU_PER_LY } from './frames';
import type { GalaxyRealm } from './galaxyRealm';
import type { LocalRealm } from './localRealm';
import { PROBE_IDS } from './probes';
import type { Realm } from './realm';

export type RealmId = 'solar' | DeepRealm;
/** A stop of the zoom: the Solar System or a level beyond it. */
export type Stop = 'solar' | Level;

export interface SolarSide {
  view: LabeledView;
  director: CameraDirector;
  controls: OrbitControls;
  nav: Navigation;
}

/** Where neighbouring scales meet (log₁₀ AU), and the half-width of their cross-fade. */
const L_SOLAR = Math.log10(400);
const L_GALAXY = Math.log10(60 * AU_PER_LY);
const FADE = 0.2;
/** Zoom per pixel of wheel travel, in decades (a notch of ~100 px ≈ ×1.4). */
const WHEEL_RATE = 0.0015;
/** Heights of the stops beyond the planets (log₁₀ AU); the Solar System's comes from its overview. */
const L_HELIO = Math.log10(900);
const L_STARS = Math.log10(1.6e6);
const L_GALAXY_VIEW = Math.log10(150_000 * AU_PER_LY);
const STOP_L: Record<Level, number> = { helio: L_HELIO, stars: L_STARS, galaxy: L_GALAXY_VIEW };
/** Where the heliosphere stop hands over to the neighbourhood (20 000 AU). */
const L_STARS_FROM = Math.log10(20_000);
const L_MAX = Math.log10(4e5 * AU_PER_LY);
/** The Oort cloud is a place within the neighbourhood, shown from this height. */
const L_OORT = Math.log10(3e5);
/** A released wheel settles on a stop within this many decades of it. */
const SNAP = 0.4;
const ORDER: Stop[] = ['solar', 'helio', 'stars', 'galaxy'];

const smooth = THREE.MathUtils.smoothstep;
const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

interface Anim {
  from: number;
  to: number;
  t: number;
  duration: number;
  dir0: THREE.Vector3;
  view?: THREE.Vector3;
  then?: () => void;
}

export class Cosmos {
  /** Scale with the larger share of the screen. */
  realm: RealmId = 'solar';
  /** Stop the zoom is at (the breadcrumbs). */
  private level: Stop = 'solar';
  /** Time of the last wheel or pinch input, and whether the zoom has settled since. */
  private inputAt = 0;
  private settled = true;
  private L = 2;
  private goal = 2;
  private anim: Anim | null = null;
  private wasFree = false;
  /** Zoom height to return to when a selected object is left. */
  private focusL = 0;
  /** Object whose panel is open (beyond the planets). */
  private panelId: string | null = null;
  private liveTimer = 0;
  private hinted = false;
  private readonly dir = new THREE.Vector3(0, 0.5, 1).normalize();
  /** Share of the way to turn toward the Galaxy's standard view this frame. */
  private turnToward = 0;
  private readonly tmp = new THREE.Vector3();
  private readonly pinch = new Map<number, { x: number; y: number }>();

  constructor(
    private readonly solar: SolarSide,
    private readonly local: LocalRealm,
    private readonly galaxy: GalaxyRealm,
    private readonly ui: UI,
    private readonly clock: SimClock,
    canvas: HTMLCanvasElement,
  ) {
    this.bindPinch(canvas);
  }

  // ── Scale geometry ──────────────────────────────────────────────────────────
  /** AU per Solar System scene unit near the meeting point (exact at true scale). */
  private solarAu() {
    return 400 / helioDistance(400);
  }

  /** Camera distance in a realm's own units for zoom height L. */
  private distanceIn(id: RealmId, L: number) {
    const au = 10 ** L;
    return id === 'solar' ? au / this.solarAu() : id === 'local' ? au : au / AU_PER_LY;
  }

  private weight(id: RealmId, L = this.L) {
    const toLocal = smooth(L, L_SOLAR - FADE, L_SOLAR + FADE);
    const toGalaxy = smooth(L, L_GALAXY - FADE, L_GALAXY + FADE);
    return id === 'solar' ? 1 - toLocal : id === 'local' ? toLocal * (1 - toGalaxy) : toGalaxy;
  }

  private realmOf(id: RealmId): Realm | null {
    return id === 'local' ? this.local : id === 'galaxy' ? this.galaxy : null;
  }

  private viewOf(id: RealmId): LabeledView {
    return this.realmOf(id) ?? this.solar.view;
  }

  private cameraOf(id: RealmId) {
    return this.viewOf(id).camera;
  }

  private controlsOf(id: RealmId) {
    return id === 'solar' ? this.solar.controls : this.realmOf(id)!.controls;
  }

  private pathTarget(id: RealmId, d: number, out: THREE.Vector3) {
    const r = this.realmOf(id);
    return r ? r.pathTarget(d, out) : out.set(0, 0, 0);
  }

  /** Is the camera of this scale driven by the zoom (overview, nothing selected, not flying)? */
  private free(id: RealmId) {
    if (id === 'solar') return this.solar.nav.mode === 'system' && !this.solar.director.flying;
    const r = this.realmOf(id)!;
    return r.focusId === null && !r.director.flying;
  }

  private stopL(s: Stop) {
    return s === 'solar' ? Math.log10(this.solar.nav.overviewDistance * this.solarAu()) : STOP_L[s];
  }

  private levelAt(L: number): Stop {
    return L < L_SOLAR ? 'solar' : L < L_STARS_FROM ? 'helio' : L < L_GALAXY ? 'stars' : 'galaxy';
  }

  get transitioning() {
    return this.anim !== null || (this.weight(this.realm) < 0.999 && this.weight(this.realm) > 0.001);
  }

  /** Is this scale on screen (alone or cross-fading)? */
  visible(id: RealmId) {
    return this.weight(id) > 0.001;
  }

  /** What to draw this frame. */
  views(): { a: LabeledView; b: LabeledView | null; mix: number } {
    const order: RealmId[] = ['solar', 'local', 'galaxy'];
    const shown = order.filter((id) => this.visible(id));
    if (shown.length < 2) return { a: this.viewOf(shown[0] ?? this.realm), b: null, mix: 0 };
    return { a: this.viewOf(shown[0]), b: this.viewOf(shown[1]), mix: this.weight(shown[1]) };
  }

  // ── Requests ──────────────────────────────────────────────────────────────────
  /** Zoom to a stop (through the ones between), then run `then`. */
  go(to: Stop, then?: () => void) {
    this.zoomTo(this.stopL(to), to === 'galaxy' ? this.galaxy.standardView : undefined, then);
  }

  /** Back to the Solar System overview, from anywhere. */
  home() {
    if (this.realm === 'solar' && this.solar.nav.mode !== 'system') this.solar.nav.goSystem();
    else this.go('solar');
  }

  /** A level beyond the planets (breadcrumbs, back buttons): zoom there and describe it. */
  goRealm(level: Level) {
    this.go(level, () => this.showPanel(LEVEL_PANEL[level], true));
  }

  /** The Sun's label in a wider view: one stop toward the Solar System. */
  sunClicked() {
    const i = ORDER.indexOf(this.level);
    const next = ORDER[Math.max(0, i - 1)];
    if (next === 'solar') this.home();
    else this.goRealm(next);
  }

  /** An object beyond the planets: a deep id, or `star:<Gliese id>`. */
  select(id: string) {
    const level = levelOf(id);
    if (LEVEL_PANEL[level] === id) return this.goRealm(level);
    const realm: DeepRealm = level === 'galaxy' ? 'galaxy' : 'local';
    const view = realm === 'galaxy' ? this.galaxy.standardView : undefined;
    if (id === 'oort') return this.zoomTo(L_OORT, view, () => this.showPanel(id, true));
    // Seen from their level's stop: spacecraft from the heliosphere's, stars from the neighbourhood's.
    this.zoomTo(STOP_L[level], view, () => this.focus(realm, id));
  }

  /** One step back: a selected object → its level → the next stop toward the Solar System. */
  back() {
    if (this.anim) return;
    if (this.realm === 'solar') return this.solar.nav.back();
    const r = this.realmOf(this.realm)!;
    if (r.focusId) return this.leaveFocus();
    const level = this.level as Level;
    if (this.panelId && this.panelId !== LEVEL_PANEL[level]) {
      this.panelId = null;
      this.ui.showRealm(level);
      return;
    }
    this.sunClicked();
  }

  /** Animate the zoom to height `to` (turning the view toward `view`), leaving any selection first. */
  private zoomTo(to: number, view?: THREE.Vector3, then?: () => void) {
    const start = () => {
      this.anim = { from: this.L, to, t: 0, duration: THREE.MathUtils.clamp(1.2 + 0.55 * Math.abs(to - this.L), 1.2, 5.5), dir0: this.dir.clone(), view, then };
    };
    if (this.realm === 'solar' && !this.free('solar')) {
      // From a planet: back to the overview first, then out.
      this.solar.nav.goSystem(() => {
        this.syncFromCamera('solar');
        start();
      });
      return;
    }
    const r = this.realmOf(this.realm);
    if (r && r.focusId) return this.leaveFocus(start);
    start();
  }

  private focus(realm: DeepRealm, id: string) {
    const r = this.realmOf(realm)!;
    const f = r.focusOf(id);
    if (!f) return;
    this.focusL = this.L;
    r.focusId = id;
    r.flyTo(f, 0.2);
    this.showPanel(id, true);
  }

  /** Fly back from a selected object to the zoom path at the height it was left. */
  private leaveFocus(then?: () => void) {
    const id = this.realm;
    const r = this.realmOf(id)!;
    r.focusId = null;
    this.L = this.goal = this.focusL;
    const d = this.distanceIn(id, this.L);
    const target = this.pathTarget(id, d, new THREE.Vector3());
    const dir = r.camera.position.clone().sub(target).normalize();
    r.director.flyTo({
      anchor: null, position: target.clone().addScaledVector(dir, d), target,
      minDistance: 0, maxDistance: Infinity,
      onArrive: () => {
        this.dir.copy(dir);
        then?.();
      },
    });
    this.panelId = null;
    if (this.level !== 'solar') this.ui.showRealm(this.level);
  }

  private showPanel(id: string, animate: boolean) {
    this.panelId = id;
    const star = this.local.star(id);
    if (star) {
      const info = starInfoL(star.gl);
      const d: DeepDef = {
        id, realm: 'local', name: info?.name ?? star.catalogue, latin: star.catalogue, color: '#ffe0a8',
        kind: t('starKind', star.spect || '—'),
        description: info?.note ?? t('starAbout', fmtNum(star.ly, { maximumFractionDigits: 1 })),
        facts: [[t('starCatalogue'), [star.catalogue, star.gl].filter((x, i, a) => x && a.indexOf(x) === i).join(' · ')]],
      };
      this.ui.showDeep(d, 'star', animate);
    } else {
      const d = deepL(id);
      this.ui.showDeep(d, (PROBE_IDS as readonly string[]).includes(id) ? 'probe' : d.realm === 'galaxy' ? 'galaxy' : 'region', animate);
    }
    this.liveTimer = 0;
  }

  relang() {
    this.local.relang();
    this.galaxy.relang();
    if (this.level === 'solar') return;
    if (this.panelId) this.showPanel(this.panelId, false);
    else this.ui.showRealm(this.level);
  }

  // ── Input ─────────────────────────────────────────────────────────────────────
  /** Wheel over the map: in overview mode it moves along the zoom. */
  onWheel(e: WheelEvent) {
    if (!this.free(this.realm)) return;
    const px = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
    this.nudge(THREE.MathUtils.clamp(px, -300, 300) * WHEEL_RATE);
  }

  private nudge(decades: number) {
    this.anim = null;
    this.inputAt = performance.now();
    this.settled = false;
    this.goal = THREE.MathUtils.clamp(this.goal + decades, this.minL(), L_MAX);
  }

  private minL() {
    return Math.log10(this.solar.nav.overviewMinDistance * this.solarAu());
  }

  /** Two-finger pinch on touch screens, the same as the wheel. */
  private bindPinch(canvas: HTMLCanvasElement) {
    let last = 0;
    const spread = () => {
      const [a, b] = [...this.pinch.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch.size === 2) last = spread();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.pinch.has(e.pointerId)) return;
      this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch.size !== 2 || !this.free(this.realm)) return;
      const s = spread();
      if (last > 0 && s > 0) this.nudge(-Math.log10(s / last));
      last = s;
    });
    const end = (e: PointerEvent) => {
      this.pinch.delete(e.pointerId);
      last = 0;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  // ── Frame ─────────────────────────────────────────────────────────────────────
  /** Take the zoom height from where a scale's camera actually is (after a flight). */
  private syncFromCamera(id: RealmId) {
    const cam = this.cameraOf(id), c = this.controlsOf(id);
    const d = cam.position.distanceTo(c.target);
    const au = id === 'solar' ? d * this.solarAu() : id === 'local' ? d : d * AU_PER_LY;
    this.L = this.goal = THREE.MathUtils.clamp(Math.log10(Math.max(au, 1e-6)), this.minL(), L_MAX);
    this.dir.copy(cam.position).sub(c.target).normalize();
  }

  update(dt: number) {
    // Outside overview mode the ordinary zoom of the controls applies.
    for (const id of ['solar', 'local', 'galaxy'] as RealmId[]) if (!this.free(id)) this.controlsOf(id).enableZoom = true;
    const free = this.free(this.realm);
    if (free && !this.wasFree) this.syncFromCamera(this.realm);
    this.wasFree = free;

    if (free) this.zoomStep(dt);
    else {
      // A selected object's scale updates itself; the others stay idle.
      const r = this.realmOf(this.realm);
      if (r) r.update(dt, this.clock.days, false);
    }

    // Live numbers of a selected spacecraft or star.
    this.liveTimer -= dt;
    if (this.liveTimer <= 0 && this.realm === 'local' && this.panelId) {
      this.liveTimer = 0.25;
      this.ui.setLive(this.local.stats(this.panelId, this.clock.days));
    }
  }

  private zoomStep(dt: number) {
    // Move along the zoom: a timed animation, or easing toward the wheel's goal.
    let turn = 0;
    if (this.anim) {
      const a = this.anim;
      a.t += dt;
      const p = smoother(Math.min(1, a.t / a.duration));
      this.L = this.goal = a.from + (a.to - a.from) * p;
      turn = p;
    } else {
      // A released wheel settles on a nearby stop (stops are where the views are framed).
      if (!this.settled && performance.now() - this.inputAt > 350 && Math.abs(this.goal - this.L) < 0.03) {
        this.settled = true;
        const near = ORDER.map((s) => this.stopL(s)).reduce((a, b) => (Math.abs(b - this.L) < Math.abs(a - this.L) ? b : a));
        if (Math.abs(near - this.L) < SNAP) this.goal = near;
      }
      const before = this.L;
      this.L += (this.goal - this.L) * Math.min(1, dt * 7);
      // Zooming out past the neighbourhood turns the view gently toward the standard one from
      // above the disc (seen edge-on, the Galaxy is a streak); the viewer can still rotate.
      const out = this.L - before;
      if (out > 0 && this.L > L_GALAXY) {
        const k = Math.min(1, out / (L_GALAXY_VIEW - L_GALAXY));
        this.turnToward = k;
      }
    }
    if (!this.hinted && this.realm === 'solar' && this.L > L_SOLAR - 0.35) {
      this.ui.hint(t('hintBeyond'));
      this.hinted = true;
    }

    // The scale with the larger share owns the controls (rotation; the zoom is ours).
    const lead = (['solar', 'local', 'galaxy'] as RealmId[]).reduce((a, b) => (this.weight(b) > this.weight(a) ? b : a));
    if (lead !== this.realm) this.changeRealm(this.realm, lead);
    const level = this.levelAt(this.L);
    if (level !== this.level) this.changeLevel(this.level, level);
    for (const id of ['solar', 'local', 'galaxy'] as RealmId[]) {
      const c = this.controlsOf(id);
      const mine = id === lead && !this.anim;
      c.enabled = mine;
      c.enableZoom = false;
      c.minDistance = 0;
      c.maxDistance = Infinity;
    }
    // The Solar System's controls are updated by its own director in the frame loop.
    if (lead !== 'solar') this.controlsOf(lead).update(dt);
    const leadCam = this.cameraOf(lead), leadCtl = this.controlsOf(lead);
    if (this.anim?.view) this.dir.copy(this.anim.dir0).lerp(this.anim.view, turn).normalize();
    else if (!this.anim) {
      this.dir.copy(leadCam.position).sub(leadCtl.target).normalize();
      if (this.turnToward > 0) this.dir.lerp(this.galaxy.standardView, this.turnToward).normalize();
    }
    this.turnToward = 0;

    // Every scale on screen sees the same distance along the same direction.
    for (const id of ['solar', 'local', 'galaxy'] as RealmId[]) {
      if (!this.visible(id)) continue;
      const d = this.distanceIn(id, this.L);
      const target = this.pathTarget(id, d, this.tmp);
      const cam = this.cameraOf(id);
      const c = this.controlsOf(id);
      c.target.copy(target);
      cam.position.copy(target).addScaledVector(this.dir, d);
      cam.lookAt(target);
      cam.updateMatrixWorld();
      const r = this.realmOf(id);
      if (r) r.update(dt, this.clock.days, true);
    }

    if (this.anim && this.anim.t >= this.anim.duration) {
      const then = this.anim.then;
      this.anim = null;
      then?.();
    }
  }

  /** The leading scale changed while zooming: selections in the scale left behind are dropped. */
  private changeRealm(from: RealmId, to: RealmId) {
    this.realm = to;
    if (from !== 'solar') this.realmOf(from)!.focusId = null;
    if (to !== 'solar') this.ui.hint(t(to === 'local' ? 'hintLocal' : 'hintGalaxy'));
  }

  /** The zoom passed into another stop's band: breadcrumbs and panels follow. */
  private changeLevel(from: Stop, to: Stop) {
    this.level = to;
    if (from === 'solar') this.solar.nav.leave();
    if (to === 'solar') {
      this.panelId = null;
      this.solar.nav.arriveSystem();
      this.ui.hint(t('hintSystem'));
      return;
    }
    // A panel about something at another stop no longer applies.
    if (this.panelId && levelOf(this.panelId) !== to) this.panelId = null;
    if (!this.panelId) this.ui.showRealm(to);
  }

  /** Bloom for the scene on screen (the Solar System sets its own from the Sun's size). */
  bloomStrength() {
    return this.realm === 'galaxy' ? 0.3 : 0.6;
  }

  /** The Solar System's camera is placed by the zoom (its frame loop must not fight it). */
  get drivesSolar() {
    return this.realm === 'solar' ? this.free('solar') : this.visible('solar');
  }
}
