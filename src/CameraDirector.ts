import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Spherical interpolation between unit vectors. */
function slerpDir(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  const om = Math.acos(dot);
  if (om < 1e-5) return b.clone();
  const s = Math.sin(om);
  if (s < 1e-5) return (t < 0.5 ? a : b).clone();
  return a.clone().multiplyScalar(Math.sin((1 - t) * om) / s).addScaledVector(b, Math.sin(t * om) / s);
}

export interface FlightOptions {
  /** Object the destination is expressed relative to; camera follows it afterwards. */
  anchor: THREE.Object3D | null;
  /** Destination camera position and look target in world space (as of now). */
  position: THREE.Vector3;
  target: THREE.Vector3;
  minDistance: number;
  maxDistance: number;
  /** Body the camera must never enter. */
  avoid?: { center: () => THREE.Vector3; radius: number };
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
  private readonly baseFov: number;
  private avoid?: FlightOptions['avoid'];

  constructor(private readonly camera: THREE.PerspectiveCamera, private readonly controls: OrbitControls) {
    this.baseFov = camera.fov;
  }

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
    this.flight = {
      anchor: opts.anchor,
      from,
      startPosLocal: toLocal(this.camera.position, from),
      startTargetLocal: toLocal(this.controls.target, from),
      endPosLocal: toLocal(opts.position, opts.anchor),
      endTargetLocal: toLocal(opts.target, opts.anchor),
      t: 0,
      duration: opts.duration ?? THREE.MathUtils.clamp(1.9 + Math.log10(dist + 1) * 0.5, 2.1, 3.6),
      lift: swing ? Math.min(dist * 0.55, 160) : Math.min(dist * 0.18, 120),
      swing,
      fovKick: 10 * THREE.MathUtils.smoothstep(dist, 30, 400),
      opts,
    };
    this.anchor = null;
    this.controls.enabled = false;
  }

  update(dt: number) {
    const f = this.flight;
    if (f) {
      f.t = Math.min(1, f.t + dt / f.duration);
      const world = (local: THREE.Vector3, obj: THREE.Object3D | null) => {
        const v = local.clone();
        if (obj) {
          obj.updateWorldMatrix(true, false);
          v.applyMatrix4(obj.matrixWorld);
        }
        return v;
      };
      const startPos = world(f.startPosLocal, f.from);
      const startTarget = world(f.startTargetLocal, f.from);
      const endPos = world(f.endPosLocal, f.anchor);
      const endTarget = world(f.endTargetLocal, f.anchor);
      const p = easeInOutCubic(f.t);
      // Quadratic Bézier with the control point lifted above the ecliptic.
      const ctrl = startPos.clone().lerp(endPos, 0.5).add(new THREE.Vector3(0, f.lift, 0));
      const a = startPos.clone().lerp(ctrl, p);
      const b = ctrl.lerp(endPos, p);
      this.camera.position.copy(a.lerp(b, p));
      // Look ahead: the gaze turns toward the destination a little before the camera
      // arrives; pull-backs keep the current subject in view and turn late.
      const look = f.opts.pullBack
        ? THREE.MathUtils.smootherstep(f.t, 0.1, 0.95)
        : f.swing
          ? THREE.MathUtils.smootherstep(f.t, 0, 0.9)
          : THREE.MathUtils.smootherstep(f.t, 0, 0.7);
      // Turn the gaze direction itself (constant angular speed), rather than sliding the look
      // point between the two bodies: that swings violently when the path passes close by.
      const cam = this.camera.position;
      const d0 = startTarget.clone().sub(cam), d1 = endTarget.clone().sub(cam);
      const l0 = d0.length(), l1 = d1.length();
      const dir = slerpDir(d0.divideScalar(l0 || 1), d1.divideScalar(l1 || 1), look);
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
      const c = this.avoid.center();
      const min = this.avoid.radius;
      const off = this.camera.position.clone().sub(c);
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
