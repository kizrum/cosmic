import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Spherical interpolation between unit vectors, into `out`. */
function slerpDir(a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  const om = Math.acos(dot);
  if (om < 1e-5) return out.copy(b);
  const s = Math.sin(om);
  if (s < 1e-5) return out.copy(t < 0.5 ? a : b);
  const ka = Math.sin((1 - t) * om) / s, kb = Math.sin(t * om) / s;
  return out.copy(a).multiplyScalar(ka).addScaledVector(b, kb);
}

/** Point on the quadratic Bézier start → ctrl → end at parameter p, into `out`. */
function bezier(start: THREE.Vector3, ctrl: THREE.Vector3, end: THREE.Vector3, p: number, out: THREE.Vector3) {
  const q = 1 - p;
  return out.copy(start).multiplyScalar(q * q).addScaledVector(ctrl, 2 * q * p).addScaledVector(end, p * p);
}

/** Point given in an object's frame (or in world space without one), into world space. */
function toWorld(local: THREE.Vector3, obj: THREE.Object3D | null, out: THREE.Vector3) {
  out.copy(local);
  if (obj) {
    obj.updateWorldMatrix(true, false);
    out.applyMatrix4(obj.matrixWorld);
  }
  return out;
}

/** A sphere the camera must stay out of; `center` writes its current position into `out`. */
export interface Obstacle {
  center: (out: THREE.Vector3) => THREE.Vector3;
  radius: number;
}

/**
 * The straight arc would cut through this body: fly around it instead, interpolating the
 * direction from its centre over the sphere and the distance from start to end.
 */
interface Detour {
  around: Obstacle;
  /** Near-opposite sides: pass over this direction (perpendicular, towards ecliptic north). */
  waypoint: THREE.Vector3 | null;
  /** Extra height at mid-flight, so the camera rises over the body rather than skimming it. */
  bump: number;
}

export interface FlightOptions {
  /** Object the destination is expressed relative to; camera follows it afterwards. */
  anchor: THREE.Object3D | null;
  /** Destination camera position and look target in world space (as of now). */
  position: THREE.Vector3;
  target: THREE.Vector3;
  minDistance: number;
  maxDistance: number;
  /** Body the camera must never enter after arrival. */
  avoid?: Obstacle;
  duration?: number;
  /**
   * Pull-back flights (back to an overview) keep the current subject in view and turn the
   * gaze gradually; default fly-to flights swing toward the destination first.
   */
  pullBack?: boolean;
  onArrive?: () => void;
}

interface Flight {
  anchor: THREE.Object3D | null;
  /** Where the flight started from; the start point moves with it (orbits keep going). */
  from: THREE.Object3D | null;
  startPosLocal: THREE.Vector3;
  startTargetLocal: THREE.Vector3;
  /** FOV widening at mid-flight: a sense of speed on long hops, none on short ones. */
  fovKick: number;
  /** The destination is behind the camera: turn over the whole flight along a raised arc. */
  swing: boolean;
  endPosLocal: THREE.Vector3;
  endTargetLocal: THREE.Vector3;
  t: number;
  duration: number;
  lift: number;
  detour: Detour | null;
  /** Every body, with the radius cut down to the endpoints' distance where they start or end closer. */
  obstacles: Obstacle[];
  opts: FlightOptions;
}

/**
 * Cinematic camera: arcing fly-to between anchors, then rigid follow of the anchor
 * (translation + rotation), with OrbitControls for free look in between.
 */
export class CameraDirector {
  private flight: Flight | null = null;
  private anchor: THREE.Object3D | null = null;
  private readonly lastAnchor = new THREE.Matrix4();
  private readonly tmpM = new THREE.Matrix4();
  // Scratch vectors: update() runs every frame and allocates nothing.
  private readonly v = Array.from({ length: 12 }, () => new THREE.Vector3());
  private readonly baseFov: number;
  private avoid?: FlightOptions['avoid'];

  constructor(private readonly camera: THREE.PerspectiveCamera, private readonly controls: OrbitControls) {
    this.baseFov = camera.fov;
  }

  /** Bodies flights must not pass through, collected when a flight starts. */
  obstacles?: () => Obstacle[];

  /** Called when a flight starts (duration in seconds) — used for the flight sound. */
  onFlight?: (duration: number) => void;

  get flying() {
    return this.flight !== null;
  }

  flyTo(opts: FlightOptions) {
    // Flush any leftover drag inertia now, so it cannot kick in when the flight ends.
    const damping = this.controls.dampingFactor;
    this.controls.dampingFactor = 1;
    this.controls.update();
    this.controls.dampingFactor = damping;

    const toLocal = (v: THREE.Vector3, obj: THREE.Object3D | null) => {
      const out = v.clone();
      if (obj) {
        obj.updateWorldMatrix(true, false);
        out.applyMatrix4(this.tmpM.copy(obj.matrixWorld).invert());
      }
      return out;
    };
    const from = this.anchor ?? this.flight?.anchor ?? null;
    const dist = this.camera.position.distanceTo(opts.position);
    const gaze = this.controls.target.clone().sub(this.camera.position).normalize();
    const toTarget = opts.target.clone().sub(this.camera.position).normalize();
    const swing = !opts.pullBack && gaze.dot(toTarget) < -0.2;
    const lift = dist * (swing ? 0.5 : 0.18);
    const obstacles = this.collectObstacles(opts.position);
    this.flight = {
      anchor: opts.anchor,
      from,
      startPosLocal: toLocal(this.camera.position, from),
      startTargetLocal: toLocal(this.controls.target, from),
      endPosLocal: toLocal(opts.position, opts.anchor),
      endTargetLocal: toLocal(opts.target, opts.anchor),
      t: 0,
      duration: opts.duration ?? THREE.MathUtils.clamp(1.9 + Math.log10(dist + 1) * 0.5, 2.1, 3.6),
      lift,
      detour: this.planDetour(opts.position, lift, obstacles),
      obstacles,
      swing,
      fovKick: 10 * THREE.MathUtils.smoothstep(dist, 30, 400),
      opts,
    };
    this.anchor = null;
    this.controls.enabled = false;
    this.onFlight?.(this.flight.duration);
  }

  /** Obstacles for a flight from the camera to `end`; an endpoint inside one shrinks it to fit. */
  private collectObstacles(end: THREE.Vector3): Obstacle[] {
    const c = new THREE.Vector3();
    return (this.obstacles?.() ?? []).map((o) => {
      o.center(c);
      const radius = Math.min(o.radius, 0.999 * this.camera.position.distanceTo(c), 0.999 * end.distanceTo(c));
      return { center: o.center, radius };
    });
  }

  /** Detour around the body the arc would cut deepest into, or null when the arc is clear. */
  private planDetour(end: THREE.Vector3, lift: number, obstacles: Obstacle[]): Detour | null {
    const start = this.camera.position;
    const ctrl = start.clone().lerp(end, 0.5);
    ctrl.y += lift;
    const c = new THREE.Vector3(), pt = new THREE.Vector3();
    let around: Obstacle | null = null;
    let worst = 1;
    for (const o of obstacles) {
      if (o.radius <= 0) continue;
      o.center(c);
      for (let k = 1; k < 32; k++) {
        const depth = bezier(start, ctrl, end, k / 32, pt).distanceTo(c) / o.radius;
        if (depth < worst) {
          worst = depth;
          around = o;
        }
      }
    }
    if (!around) return null;
    around.center(c);
    const a = start.clone().sub(c), b = end.clone().sub(c);
    const angle = a.angleTo(b);
    let waypoint: THREE.Vector3 | null = null;
    if (angle > THREE.MathUtils.degToRad(170)) {
      const dirA = a.clone().normalize();
      waypoint = new THREE.Vector3(0, 1, 0).addScaledVector(dirA, -dirA.y);
      if (waypoint.lengthSq() < 1e-6) waypoint.set(1, 0, 0).addScaledVector(dirA, -dirA.x);
      waypoint.normalize();
    }
    return { around, waypoint, bump: 0.6 * Math.min(a.length(), b.length()) * (angle / Math.PI) };
  }

  /** Camera position on a detour at eased progress p, into `out`. */
  private detourPoint(d: Detour, start: THREE.Vector3, end: THREE.Vector3, p: number, out: THREE.Vector3) {
    const [, , , , , , , , , c, a, b] = this.v;
    d.around.center(c);
    a.copy(start).sub(c);
    b.copy(end).sub(c);
    const ra = a.length(), rb = b.length();
    a.divideScalar(ra || 1);
    b.divideScalar(rb || 1);
    if (!d.waypoint) slerpDir(a, b, p, out);
    else if (p < 0.5) slerpDir(a, d.waypoint, p * 2, out);
    else slerpDir(d.waypoint, b, p * 2 - 1, out);
    return out.multiplyScalar(THREE.MathUtils.lerp(ra, rb, p) + d.bump * Math.sin(Math.PI * p)).add(c);
  }

  update(dt: number) {
    const f = this.flight;
    if (f) {
      f.t = Math.min(1, f.t + dt / f.duration);
      const [startPos, startTarget, endPos, endTarget, ctrl, a, d0, d1, dir] = this.v;
      toWorld(f.startPosLocal, f.from, startPos);
      toWorld(f.startTargetLocal, f.from, startTarget);
      toWorld(f.endPosLocal, f.anchor, endPos);
      toWorld(f.endTargetLocal, f.anchor, endTarget);
      const p = easeInOutCubic(f.t);
      const cam = this.camera.position;
      if (f.detour) this.detourPoint(f.detour, startPos, endPos, p, cam);
      else {
        // Quadratic Bézier with the control point lifted above the ecliptic.
        ctrl.copy(startPos).lerp(endPos, 0.5);
        ctrl.y += f.lift;
        bezier(startPos, ctrl, endPos, p, cam);
      }
      // Safety net: a second body in the way (the detour handles only one) pushes the camera out.
      for (const o of f.obstacles) {
        o.center(a);
        const off = d0.copy(cam).sub(a);
        const l = off.length();
        if (l < o.radius && l > 1e-9) cam.copy(a).addScaledVector(off, o.radius / l);
      }
      // Look ahead: the gaze turns toward the destination a little before the camera
      // arrives; pull-backs keep the current subject in view and turn late.
      const look = f.opts.pullBack
        ? THREE.MathUtils.smootherstep(f.t, 0.1, 0.95)
        : f.swing
          ? THREE.MathUtils.smootherstep(f.t, 0, 0.9)
          : THREE.MathUtils.smootherstep(f.t, 0, 0.7);
      // Turn the gaze direction itself (constant angular speed), rather than sliding the look
      // point between the two bodies: that swings violently when the path passes close by.
      d0.copy(startTarget).sub(cam);
      d1.copy(endTarget).sub(cam);
      const l0 = d0.length(), l1 = d1.length();
      slerpDir(d0.divideScalar(l0 || 1), d1.divideScalar(l1 || 1), look, dir);
      this.controls.target.copy(cam).addScaledVector(dir, THREE.MathUtils.lerp(l0, l1, look));
      this.camera.lookAt(this.controls.target);
      this.camera.fov = this.baseFov + Math.sin(Math.PI * p) * f.fovKick;
      this.camera.updateProjectionMatrix();
      if (f.t >= 1) {
        this.flight = null;
        this.camera.fov = this.baseFov;
        this.camera.updateProjectionMatrix();
        this.controls.minDistance = f.opts.minDistance;
        this.controls.maxDistance = f.opts.maxDistance;
        this.controls.enabled = true;
        this.avoid = f.opts.avoid;
        this.setAnchor(f.anchor);
        f.opts.onArrive?.();
      }
      return;
    }

    if (this.anchor) {
      this.anchor.updateWorldMatrix(true, false);
      // Rigid transform the anchor underwent since last frame, applied to camera + target.
      this.tmpM.copy(this.lastAnchor).invert().premultiply(this.anchor.matrixWorld);
      this.camera.position.applyMatrix4(this.tmpM);
      this.controls.target.applyMatrix4(this.tmpM);
      this.lastAnchor.copy(this.anchor.matrixWorld);
    }
    this.controls.update(dt);
    if (this.avoid) {
      const [c, off] = this.v;
      this.avoid.center(c);
      const min = this.avoid.radius;
      off.copy(this.camera.position).sub(c);
      if (off.length() < min) {
        this.camera.position.copy(c).add(off.setLength(min));
        this.camera.lookAt(this.controls.target);
      }
    }
  }

  private setAnchor(anchor: THREE.Object3D | null) {
    this.anchor = anchor;
    if (anchor) {
      anchor.updateWorldMatrix(true, false);
      this.lastAnchor.copy(anchor.matrixWorld);
    }
  }
}
