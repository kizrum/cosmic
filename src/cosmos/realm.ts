/** A scale of the cosmos beyond the planets: its own scene, camera, controls and labels. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CameraDirector } from '../CameraDirector';
import type { LabeledView } from '../scene/renderer';
import { layoutLabels, type Label } from './labels';

/** Where to look for a selectable object: the camera flies there and follows `anchor`. */
export interface Focus {
  anchor: THREE.Object3D | null;
  /** Look target, world position now. */
  target: THREE.Vector3;
  distance: number;
  minDistance: number;
  maxDistance: number;
  /** Preferred direction from the target to the camera (unit); default: keep the current one. */
  view?: THREE.Vector3;
}

export abstract class Realm implements LabeledView {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly director: CameraDirector;
  readonly labels: CSS2DRenderer;
  protected readonly labelList: Label[] = [];
  /** Id of the object being looked at (null: the overview). */
  focusId: string | null = null;

  constructor(canvas: HTMLCanvasElement, layer: HTMLElement, near: number, far: number) {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, near, far);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.45;
    this.controls.zoomSpeed = 1.1;
    this.controls.enabled = false;
    this.director = new CameraDirector(this.camera, this.controls);
    this.labels = new CSS2DRenderer({ element: layer });
  }

  /** Focus for a selectable id of this realm, or null. */
  abstract focusOf(id: string): Focus | null;

  /** The realm's default view. */
  abstract overview(): Focus;

  /**
   * Per-frame update while visible; `days` from J2000. `free`: the cosmic zoom places the
   * camera itself (overview mode), so the flight director stays idle.
   */
  abstract update(dt: number, days: number, free: boolean): void;

  /** Point the camera pivots around in overview mode, at camera distance `d` (realm units). */
  pathTarget(_d: number, out: THREE.Vector3) {
    return out.set(0, 0, 0);
  }

  /** Texts changed language. */
  abstract relang(): void;

  /** Fly to `f`, keeping the current direction of view (raised by `lift`, 0…1). */
  flyTo(f: Focus, lift = 0.25, duration?: number) {
    let dir: THREE.Vector3;
    if (f.view) dir = f.view.clone();
    else {
      dir = this.camera.position.clone().sub(f.target);
      if (dir.lengthSq() < 1e-12) dir.set(0, 1, 1);
      dir.normalize();
      dir.y += lift;
      dir.normalize();
    }
    this.director.flyTo({
      anchor: f.anchor,
      position: f.target.clone().addScaledVector(dir, f.distance),
      target: f.target,
      minDistance: f.minDistance,
      maxDistance: f.maxDistance,
      duration,
    });
  }

  /** Put the camera somewhere instantly (start of a cross-fade from another realm). */
  place(position: THREE.Vector3, target: THREE.Vector3) {
    this.director.halt();
    this.camera.position.copy(position);
    this.controls.target.copy(target);
    this.camera.lookAt(target);
    this.camera.updateMatrixWorld();
  }

  /** Camera distance from its look target. */
  get distance() {
    return this.camera.position.distanceTo(this.controls.target);
  }

  protected layout() {
    layoutLabels(this.labelList, this.camera);
  }
}
