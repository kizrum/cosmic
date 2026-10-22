/**
 * Texture streaming: every map starts on its 512 px tier (all of them together are well
 * under a megabyte, so the app opens fast) and moves to a larger tier when its body grows
 * on screen. Tiers are produced by scripts/build-textures.ts (list: data/textureTiers.ts).
 *
 * A first approach to a body must not stutter, so each step of a larger tier is spread out:
 *  - a worker fetches and decodes the image into plain bytes (textureWorker.ts);
 *  - the bytes are copied into a GPU texture in horizontal bands, a few milliseconds per
 *    frame; the materials switch to it once it is complete;
 *  - the first write into freshly allocated video memory costs the driver 25–150 ms
 *    (2K–8K), so textures of the common sizes are allocated behind the loading screen and
 *    recycled, and a fresh allocation larger than 2K waits until the camera is not flying;
 *  - large maps stay resident until a video-memory budget is exceeded, so going back to a
 *    body costs nothing; navigation announces where a flight is heading (expect), and that
 *    body's maps start loading at take-off rather than on arrival.
 */
import * as THREE from 'three';
import { AVIF_FROM, TEXTURE_TIERS } from '../data/textureTiers';

interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

interface Upload {
  width: number;
  /** The target is new video memory, not a recycled texture (see `calm`). */
  fresh: boolean;
  /** CPU-side holder of the decoded bytes, never uploaded itself: the source of the band copies. */
  source: THREE.DataTexture;
  target: THREE.DataTexture;
  row: number;
}

interface Entry {
  name: string;
  tiers: readonly number[];
  /** Texture the materials use now. */
  texture: THREE.Texture;
  group: string;
  /** Width of the resident image; of the one being fetched; of the one being copied in. */
  width: number;
  loading: number | null;
  upload: Upload | null;
  /** Streamer clock when this map last needed its current detail (for eviction). */
  usedAt: number;
}

/** A larger tier is loaded when the screen needs at least this share of its texels. */
const UPGRADE_AT = 0.7;
const MAX_PARALLEL = 2;
/** Bytes copied to the GPU per frame (a few ms on integrated graphics). */
const UPLOAD_BYTES_PER_FRAME = 2 << 20;

const tierUrl = (name: string, width: number) => {
  const dot = name.lastIndexOf('.');
  const ext = name.slice(dot + 1);
  return `textures/${name.slice(0, dot)}.${width}.${ext === 'jpg' && width >= AVIF_FROM ? 'avif' : ext}`;
};

/** Recycled textures kept per size and colour space. */
const POOL_KEEP = 3;
/** Allocated and touched behind the loading screen: [width, sRGB, count]. */
const PREWARM: [number, boolean, number][] = [[4096, true, 3], [4096, false, 1], [2048, true, 2]];

/** GPU memory of a 2:1 tier with its mipmaps (strips are negligible). */
const tierBytes = (w: number) => (w * (w / 2) * 4 * 4) / 3;

export class TextureStreamer {
  /** Screen pixels per radian at the centre of the view; set by the frame loop. */
  pxPerRad = 1000;
  /** The camera is not flying: a good moment for a stall that cannot be avoided. */
  calm = true;
  private readonly pool = new Map<string, THREE.DataTexture[]>();
  private readonly entries: Entry[] = [];
  private readonly need = new Map<string, number>();
  private readonly expected = new Map<string, { width: number; until: number }>();
  private readonly scenes: THREE.Object3D[] = [];
  private readonly cap: number;
  private readonly budget: number;
  private readonly anisotropy: number;
  private active = 0;
  private clock = 0;
  private readonly region = new THREE.Box2();
  private readonly at = new THREE.Vector2();
  private worker: Worker | null | undefined;
  private readonly pending = new Map<number, (p: Pixels | null) => void>();
  private nextId = 0;

  constructor(private readonly manager: THREE.LoadingManager, private readonly renderer: THREE.WebGLRenderer) {
    // Phones and low-memory machines stop at 4096 px and keep a smaller resident set.
    const nav = navigator as Navigator & { deviceMemory?: number };
    const small = (nav.deviceMemory ?? 8) < 4 || matchMedia('(pointer: coarse)').matches;
    this.cap = Math.min(renderer.capabilities.maxTextureSize, small ? 4096 : 8192);
    // An 8K map takes ~180 MB with its mipmaps: machines with 8 GB or more keep a larger set.
    this.budget = (small ? 256 : (nav.deviceMemory ?? 4) >= 8 ? 1024 : 640) << 20;
    this.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  /** Scenes whose materials get the new texture when a larger tier is in place. */
  addScene(scene: THREE.Object3D) {
    this.scenes.push(scene);
  }

  /**
   * Texture for a map; its detail follows the need set for `group` (a body id, or 'sky').
   * `startNeed`: detail already known to be needed (the sky's depends only on the screen), so
   * the right tier loads behind the loading screen instead of being streamed in later.
   */
  get(name: string, group: string, srgb = true, startNeed = 0) {
    const shared = this.entries.find((e) => e.name === name && e.group === group);
    if (shared) return shared.texture;
    const tiers = TEXTURE_TIERS[name];
    if (!tiers) throw new Error(`no tiers for ${name}`);
    const texture = new THREE.Texture();
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = this.anisotropy;
    const entry: Entry = { name, tiers, texture, group, width: 0, loading: null, upload: null, usedAt: 0 };
    this.entries.push(entry);
    this.need.set(group, Math.max(this.need.get(group) ?? 0, startNeed));
    // The first tier counts toward the loading screen and is uploaded whole.
    const width = this.wanted(entry);
    entry.loading = width;
    new THREE.ImageLoader(this.manager).load(tierUrl(name, width), (img) => {
      entry.loading = null;
      texture.image = img;
      texture.needsUpdate = true;
      entry.width = width;
    }, undefined, () => (entry.loading = null));
    return texture;
  }

  /** Texels across the full map width that the current view of `group` can show. */
  setNeed(group: string, width: number) {
    this.need.set(group, width);
  }

  /**
   * A flight is heading to `group`: load the detail it will need at `distance` from a
   * sphere of `radius` now, and hold it for `seconds` (the flight's length and a margin).
   */
  expect(group: string, radius: number, distance: number, seconds: number) {
    this.expected.set(group, { width: sphereNeed(radius, distance, this.pxPerRad), until: this.clock + seconds });
  }

  /** Largest tier the device and the view call for. */
  private wanted(e: Entry) {
    const exp = this.expected.get(e.group);
    const need = Math.max(this.need.get(e.group) ?? 0, exp && exp.until > this.clock ? exp.width : 0);
    let pick = e.tiers[0];
    for (const w of e.tiers) {
      if (w > this.cap) break;
      pick = w;
      if (w * UPGRADE_AT >= need) break;
    }
    return pick;
  }

  update(dt: number) {
    this.clock += dt;
    this.copyBands();
    if (!this.decoder()) return;
    let resident = 0;
    for (const e of this.entries) {
      resident += tierBytes(e.width);
      if (e.width === 0) continue;
      const want = this.wanted(e);
      if (want >= e.width) e.usedAt = this.clock;
      if (want > e.width && e.loading === null && !e.upload && this.active < MAX_PARALLEL) this.fetch(e, want);
    }
    // Over budget: the maps unused for longest drop back to what they need now.
    if (resident > this.budget) {
      const idle = this.entries
        .filter((e) => e.loading === null && !e.upload && this.wanted(e) < e.width)
        .sort((a, b) => a.usedAt - b.usedAt);
      for (const e of idle) {
        if (resident <= this.budget || this.active >= MAX_PARALLEL) break;
        resident -= tierBytes(e.width) - tierBytes(this.wanted(e));
        this.fetch(e, this.wanted(e));
      }
    }
  }

  /** The decoding worker, started on first use; null where it cannot run (no streaming then). */
  private decoder() {
    if (this.worker !== undefined) return this.worker;
    try {
      this.worker = new Worker(new URL('./textureWorker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (ev: MessageEvent<Partial<Pixels> & { id: number }>) => {
        const cb = this.pending.get(ev.data.id);
        this.pending.delete(ev.data.id);
        const { width, height, data } = ev.data;
        cb?.(data && width && height ? { width, height, data } : null);
      };
    } catch {
      this.worker = null;
    }
    return this.worker;
  }

  private fetch(e: Entry, width: number) {
    e.loading = width;
    this.active++;
    const id = this.nextId++;
    this.pending.set(id, (pixels) => {
      this.active--;
      e.loading = null;
      if (pixels) this.startBands(e, pixels, width);
    });
    this.worker!.postMessage({ id, url: new URL(tierUrl(e.name, width), document.baseURI).href });
  }

  /** Allocate the GPU texture for a new tier; its pixels arrive in bands (copyBands). */
  private startBands(e: Entry, pixels: Pixels, width: number) {
    const key = poolKey(pixels.width, pixels.height, e.texture.colorSpace);
    const recycled = this.pool.get(key)?.pop();
    const target = recycled ?? this.allocate(e.texture.colorSpace, pixels.width, pixels.height);
    target.anisotropy = this.anisotropy;
    target.wrapS = e.texture.wrapS;
    target.wrapT = e.texture.wrapT;
    const source = new THREE.DataTexture(pixels.data, pixels.width, pixels.height);
    e.upload = { width, fresh: !recycled, source, target, row: 0 };
  }

  /** Empty mipmapped GPU texture; storage only, nothing uploaded. */
  private allocate(colorSpace: string, width: number, height: number) {
    const target = new THREE.DataTexture(null, width, height);
    target.colorSpace = colorSpace;
    target.anisotropy = this.anisotropy;
    target.magFilter = THREE.LinearFilter;
    target.minFilter = THREE.LinearMipmapLinearFilter;
    target.generateMipmaps = true;
    target.source.dataReady = false;
    target.needsUpdate = true;
    this.renderer.initTexture(target);
    return target;
  }

  /** Allocate the common sizes and make the driver commit their memory (one small band each). */
  prewarm() {
    for (const [w, srgb, count] of PREWARM) {
      if (w > this.cap) continue;
      const colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      const touch = new THREE.DataTexture(new Uint8Array(w * 16 * 4), w, 16);
      for (let i = 0; i < count; i++) {
        const t = this.allocate(colorSpace, w, w / 2);
        this.band(touch, t, 0, 16, false);
        this.recycle(t);
      }
    }
  }

  /** Keep a texture for the next upload of its size, or free it. */
  private recycle(t: THREE.Texture) {
    if (!(t instanceof THREE.DataTexture)) return t.dispose();
    const key = poolKey(t.image.width, t.image.height, t.colorSpace);
    const list = this.pool.get(key) ?? [];
    if (list.length >= POOL_KEEP) return t.dispose();
    list.push(t);
    this.pool.set(key, list);
  }

  /** Copy rows [from, to) of the source into the target; mipmaps are built with the last band. */
  private band(source: THREE.DataTexture, target: THREE.DataTexture, from: number, to: number, mips = to === source.image.height) {
    target.generateMipmaps = mips;
    this.region.min.set(0, from);
    this.region.max.set(source.image.width, to);
    this.renderer.copyTextureToTexture(source, target, this.region, this.at.set(0, from));
  }

  private copyBands() {
    let budget = UPLOAD_BYTES_PER_FRAME;
    for (const e of this.entries) {
      const up = e.upload;
      if (!up) continue;
      // New video memory larger than 2K stalls on its first write: wait until the camera is still.
      if (up.fresh && up.row === 0 && up.source.image.width > 2048 && !this.calm) continue;
      const { width: w, height: h } = up.source.image;
      const end = Math.min(h, up.row + Math.max(16, Math.floor(budget / (w * 4))));
      this.band(up.source, up.target, up.row, end);
      budget -= (end - up.row) * w * 4;
      up.row = end;
      if (end === h) this.finish(e, up);
      if (budget <= 0) break;
    }
  }

  /** The new tier is complete: every material switches to it, the old one is freed. */
  private finish(e: Entry, up: Upload) {
    const old = e.texture;
    up.target.generateMipmaps = true;
    this.replaceEverywhere(old, up.target);
    e.texture = up.target;
    e.width = up.width;
    e.upload = null;
    this.recycle(old);
  }

  private replaceEverywhere(old: THREE.Texture, next: THREE.Texture) {
    for (const scene of this.scenes) scene.traverse((o) => {
      const mats = (o as THREE.Mesh).material;
      if (mats) for (const m of Array.isArray(mats) ? mats : [mats]) replaceIn(m, old, next);
    });
  }

  /**
   * Run the band-upload path once, behind the loading screen: the first copy into a fresh
   * mipmapped texture (and the first draw with it) sets up driver-side state that would
   * otherwise stall the first approach to a body.
   */
  warmUp(draw: () => void) {
    const e = this.entries.find((x) => x.width > 0 && x.texture.colorSpace === THREE.SRGBColorSpace);
    if (!e) return;
    const w = 256, h = 128;
    const source = new THREE.DataTexture(new Uint8Array(w * h * 4).fill(128), w, h);
    const target = this.allocate(e.texture.colorSpace, w, h);
    this.band(source, target, 0, h / 2);
    this.band(source, target, h / 2, h);
    // Draw one frame with the copy in place of the original, then put the original back.
    const original = e.texture;
    this.replaceEverywhere(original, target);
    draw();
    this.replaceEverywhere(target, original);
    target.dispose();
  }

  /** Resident tier of each map (for debugging). */
  stats() {
    return this.entries.map((e) => `${e.name}@${e.width}`);
  }
}

const poolKey = (w: number, h: number, colorSpace: string) => `${w}x${h}:${colorSpace}`;

/** Point every texture slot and uniform of a material that holds `old` at `next`. */
function replaceIn(m: THREE.Material, old: THREE.Texture, next: THREE.Texture) {
  const rec = m as unknown as Record<string, unknown>;
  for (const key of Object.keys(rec)) if (rec[key] === old) rec[key] = next;
  const uniforms = (m as THREE.ShaderMaterial).uniforms;
  if (uniforms) for (const u of Object.values(uniforms)) if (u.value === old) u.value = next;
}

/**
 * Map width a sphere needs on screen: one texel per pixel at the point nearest the camera.
 * `pxPerRad` is the screen's pixels per radian (focal length in pixels).
 */
export function sphereNeed(radius: number, distance: number, pxPerRad: number) {
  const gap = Math.max(distance - radius, radius * 1e-3);
  // A pixel covers gap / pxPerRad on the surface; the map spans the circumference 2πR.
  return (2 * Math.PI * radius * pxPerRad) / gap;
}
