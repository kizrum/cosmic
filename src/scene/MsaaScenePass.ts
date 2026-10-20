import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';

/**
 * Renders the scene into its own multisampled target and copies the resolved image into
 * the composer's buffer. Only the scene geometry needs anti-aliasing; the post-processing
 * passes after it (bloom, output) then run on plain single-sample buffers, which is far
 * cheaper than multisampling the whole chain.
 */
export class MsaaScenePass extends Pass {
  private readonly target: THREE.WebGLRenderTarget;
  private readonly copy: FullScreenQuad;
  private readonly material: THREE.ShaderMaterial;

  constructor(private readonly scene: THREE.Scene, private readonly camera: THREE.Camera, samples = 4) {
    super();
    this.needsSwap = false;
    this.target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples });
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.copy = new FullScreenQuad(this.material);
  }

  get samples() {
    return this.target.samples;
  }

  set samples(n: number) {
    if (n === this.target.samples) return;
    this.target.dispose();
    this.target.samples = n;
  }

  setSize(width: number, height: number) {
    this.target.setSize(width, height);
  }

  render(renderer: THREE.WebGLRenderer, _writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    this.material.uniforms.tDiffuse.value = this.target.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    this.copy.render(renderer);
  }

  dispose() {
    this.target.dispose();
    this.material.dispose();
    this.copy.dispose();
  }
}
