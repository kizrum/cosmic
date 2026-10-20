import type { Renderer } from './renderer';

/**
 * Adaptive quality: weak GPUs (laptop integrated graphics, large browser windows) get a
 * lower render resolution and, if still slow, no bloom — instead of a stuttering page.
 */
export class AdaptiveQuality {
  private frames = 0;
  private time = 0;
  private slowStreak = 0;
  private fastStreak = 0;

  constructor(private readonly r: Renderer) {}

  update(dt: number) {
    this.frames++;
    this.time += dt;
    if (this.time < 1.5) return;
    const fps = this.frames / this.time;
    this.frames = 0;
    this.time = 0;
    if (fps < 38) { this.slowStreak++; this.fastStreak = 0; } else if (fps > 56) { this.fastStreak++; this.slowStreak = 0; } else { this.slowStreak = this.fastStreak = 0; }
    const { scenePass, bloom } = this.r;
    const ratio = this.r.pixelRatio, max = this.r.maxPixelRatio;
    let next = ratio;
    // Order of sacrifices: 4× → 2× anti-aliasing first, then resolution; restored in reverse.
    if (this.slowStreak >= 1 && scenePass.samples > 2) { scenePass.samples = 2; return; }
    if (this.slowStreak >= 1 && ratio > 0.75) next = Math.max(0.75, ratio * 0.85);
    else if (this.fastStreak >= 3 && ratio < max) next = Math.min(max, ratio * 1.15);
    else if (this.fastStreak >= 3 && scenePass.samples < 4) { scenePass.samples = 4; this.fastStreak = 0; return; }
    if (fps < 28 && ratio <= 0.76) bloom.enabled = false;
    if (this.fastStreak >= 3) bloom.enabled = true;
    if (next !== ratio) {
      this.r.pixelRatio = next;
      this.fastStreak = 0;
    }
  }
}

/** Chrome with hardware acceleration off renders WebGL on the CPU: say so once. */
export function detectSoftwareGL(r: Renderer) {
  const gl = r.gl.getContext();
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  if (/swiftshader|llvmpipe|software|basic render/i.test(name)) {
    const el = document.querySelector<HTMLElement>('#gpu-warning');
    if (el) el.hidden = false;
  }
}
