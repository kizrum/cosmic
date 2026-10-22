import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

/** A scene and the camera that looks at it. */
export interface View {
  scene: THREE.Scene;
  camera: THREE.Camera;
}

/**
 * Renders the scene into its own multisampled target and copies the resolved image into
 * the composer's buffer. Only the scene geometry needs anti-aliasing; the post-processing
 * passes after it (bloom, output) then run on plain single-sample buffers, which is far
 * cheaper than multisampling the whole chain.
 *
 * During a change of scale (Solar System ↔ neighbourhood ↔ Galaxy) a second view is drawn
 * into another target and the two are cross-faded; otherwise only one is rendered.
 */
export class MsaaScenePass extends Pass {
  private readonly target: THREE.WebGLRenderTarget;
  private readonly targetB: THREE.WebGLRenderTarget;
  private readonly quad: FullScreenQuad;
  private readonly material: THREE.ShaderMaterial;
  private second: View | null = null;
  private mix = 0;

  constructor(private view: View, samples = 4) {
    super();
    this.needsSwap = false;
    this.target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples });
    this.targetB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples });
    this.material = new THREE.ShaderMaterial({
      uniforms: { tA: { value: null }, tB: { value: null }, uMix: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
uniform sampler2D tA;
uniform sampler2D tB;
uniform float uMix;
varying vec2 vUv;
void main() {
  vec4 a = texture2D(tA, vUv);
  gl_FragColor = uMix > 0.0 ? mix(a, texture2D(tB, vUv), uMix) : a;
}`,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
  }

  /** Show `view`, optionally cross-faded toward `second` (mix 0 → 1). */
  setViews(view: View, second: View | null = null, mix = 0) {
    this.view = view;
    this.second = mix > 0 ? second : null;
    this.mix = this.second ? mix : 0;
  }

  get samples() {
    return this.target.samples;
  }

  set samples(n: number) {
    if (n === this.target.samples) return;
    for (const t of [this.target, this.targetB]) {
      t.dispose();
      t.samples = n;
    }
  }

  /**
   * Run `fn` with this pass's target bound: shaders compiled there get the same variant as
   * when the scene is rendered (linear output into the half-float target, no tone mapping).
   */
  withTarget(renderer: THREE.WebGLRenderer, fn: () => void) {
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.target);
    fn();
    renderer.setRenderTarget(prev);
  }

  setSize(width: number, height: number) {
    this.target.setSize(width, height);
    this.targetB.setSize(width, height);
  }

  render(renderer: THREE.WebGLRenderer, _writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(this.view.scene, this.view.camera);
    this.material.uniforms.tA.value = this.target.texture;
    this.material.uniforms.uMix.value = this.mix;
    if (this.second) {
      renderer.setRenderTarget(this.targetB);
      renderer.clear();
      renderer.render(this.second.scene, this.second.camera);
      this.material.uniforms.tB.value = this.targetB.texture;
    }
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    this.quad.render(renderer);
  }

  dispose() {
    this.target.dispose();
    this.targetB.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}
