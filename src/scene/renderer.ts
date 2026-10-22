import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MsaaScenePass } from './MsaaScenePass';

/** A scene with its camera and its layer of HTML labels (one per scale of the cosmos). */
export interface LabeledView {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  labels: CSS2DRenderer;
}

/** WebGL renderer, post-processing chain (MSAA scene → bloom → output) and HTML labels. */
export class Renderer {
  readonly gl: THREE.WebGLRenderer;
  readonly composer: EffectComposer;
  readonly scenePass: MsaaScenePass;
  readonly bloom: UnrealBloomPass;
  /** Start at up to 1.5× device pixels; adaptive quality lowers it if needed. */
  readonly maxPixelRatio = Math.min(window.devicePixelRatio, 1.5);
  private ratio = this.maxPixelRatio;
  private readonly views: LabeledView[] = [];

  constructor(canvas: HTMLCanvasElement, main: LabeledView) {
    const w = window.innerWidth, h = window.innerHeight;
    // The scene is drawn into the post-processing target below, so anti-aliasing belongs there
    // (multisampled render target); the default framebuffer only receives a full-screen quad.
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: false, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
    this.gl.setPixelRatio(this.ratio);
    this.gl.setSize(w, h);
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.05;

    this.composer = new EffectComposer(this.gl);
    this.composer.setPixelRatio(this.ratio);
    this.composer.setSize(w, h);
    // Anti-aliasing lives in the scene pass only (see MsaaScenePass).
    this.scenePass = new MsaaScenePass(main, 4);
    this.composer.addPass(this.scenePass);
    // High threshold: only HDR sources (the Sun, city lights, glints) bloom, not sunlit clouds.
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.45, 1.15);
    // Bloom is a wide blur: computing it at half resolution looks the same and costs a quarter.
    const bloomSetSize = this.bloom.setSize.bind(this.bloom);
    this.bloom.setSize = (bw: number, bh: number) => bloomSetSize(Math.max(1, Math.round(bw / 2)), Math.max(1, Math.round(bh / 2)));
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.addView(main);
  }

  /** Register a view so it follows window resizes. */
  addView(view: LabeledView) {
    this.views.push(view);
    view.labels.setSize(window.innerWidth, window.innerHeight);
  }

  get pixelRatio() {
    return this.ratio;
  }

  set pixelRatio(r: number) {
    this.ratio = r;
    this.gl.setPixelRatio(r);
    this.composer.setPixelRatio(r);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    for (const v of this.views) {
      v.camera.aspect = w / h;
      v.camera.updateProjectionMatrix();
      v.labels.setSize(w, h);
    }
    this.gl.setSize(w, h);
    this.composer.setPixelRatio(this.ratio);
    this.composer.setSize(w, h);
  }

  /** Draw `view`, cross-faded toward `second` by `mix` (labels fade with their scene). */
  render(view: LabeledView, second: LabeledView | null = null, mix = 0) {
    this.scenePass.setViews(view, second, mix);
    this.composer.render();
    for (const v of this.views) {
      const weight = v === view ? 1 - (second ? mix : 0) : v === second ? mix : 0;
      const el = v.labels.domElement;
      el.style.display = weight > 0.02 ? '' : 'none';
      el.style.opacity = weight < 0.98 ? weight.toFixed(2) : '';
      if (weight > 0.02) v.labels.render(v.scene, v.camera);
    }
  }
}
