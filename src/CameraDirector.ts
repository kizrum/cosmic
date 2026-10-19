import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

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
  onArrive?: () => void;
}

interface Flight {
  anchor: THREE.Object3D | null;
  startPos: THREE.Vector3;
  startTarget: THREE.Vector3;
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
    const toLocal = (v: THREE.Vector3) => {
      const out = v.clone();
      if (opts.anchor) {
        opts.anchor.updateWorldMatrix(true, false);
        out.applyMatrix4(this.tmpM.copy(opts.anchor.matrixWorld).invert());
      }
      return out;
    };
    const dist = this.camera.position.distanceTo(opts.position);
    this.flight = {
      anchor: opts.anchor,
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      endPosLocal: toLocal(opts.position),
      endTargetLocal: toLocal(opts.target),
      t: 0,
      duration: opts.duration ?? THREE.MathUtils.clamp(1.6 + Math.log10(dist + 1) * 0.55, 1.8, 3.6),
      lift: Math.min(dist * 0.22, 120),
      opts,
    };
    this.anchor = null;
    this.controls.enabled = false;
  }

  update(dt: number) {
    const f = this.flight;
    if (f) {
      f.t = Math.min(1, f.t + dt / f.duration);
      const world = (local: THREE.Vector3) => {
        const v = local.clone();
        if (f.anchor) {
          f.anchor.updateWorldMatrix(true, false);
          v.applyMatrix4(f.anchor.matrixWorld);
        }
        return v;
      };
      const endPos = world(f.endPosLocal);
      const endTarget = world(f.endTargetLocal);
      const p = easeInOutCubic(f.t);
      // Quadratic Bézier with the control point lifted above the ecliptic.
      const ctrl = f.startPos.clone().lerp(endPos, 0.5).add(new THREE.Vector3(0, f.lift, 0));
      const a = f.startPos.clone().lerp(ctrl, p);
      const b = ctrl.lerp(endPos, p);
      this.camera.position.copy(a.lerp(b, p));
      // Look ahead: the camera swings toward the destination before it gets there.
      const look = easeOutQuart(Math.min(1, f.t * 1.5));
      this.controls.target.copy(f.startTarget).lerp(endTarget, look);
      this.camera.lookAt(this.controls.target);
      this.camera.fov = this.baseFov + Math.sin(Math.PI * p) * 10;
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
