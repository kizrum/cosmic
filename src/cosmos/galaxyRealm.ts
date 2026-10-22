/**
 * The Milky Way seen from outside, in light years with the Sun at the origin and the axes
 * of the scene frame, so the disc lines up with the Milky Way band of the sky panorama.
 *
 * The face-on look is NASA/JPL-Caltech/R. Hurt's reconstruction (PIA10748), laid in the
 * Galactic plane; thickness comes from points sampled from the same image and spread
 * vertically like the real disc (thin disc ~1,000 ly, a thicker bulge at the centre).
 */
import * as THREE from 'three';
import { deepL } from '../data/localize';
import { t } from '../i18n';
import { createSky } from '../scene/Environment';
import type { TextureStreamer } from '../scene/textures';
import { GALACTIC_BASIS, IMAGE, R0_LY, equatorial, galacticToScene, imageToGalactic } from './frames';
import { makeLabel, relabel, type Label } from './labels';
import { glowPoints } from './materials';
import { Realm, type Focus } from './realm';

export interface GalaxyEvents {
  select(id: string): void;
  /** The Sun's label: down into the neighbourhood. */
  sun(): void;
}

/** Label positions on the face-on image (u right, v down; picked on the arms near the Sun). */
const ARM_LABELS: [string, number, number][] = [
  ['perseusArm', 0.5818, 0.7491],
  ['sagittariusArm', 0.4273, 0.6473],
  ['orionArm', 0.5455, 0.7045],
  ['scutumArm', 0.35, 0.5818],
];

const MAX_DISTANCE = 4e5;
/** Views of the Galaxy: from above the north Galactic pole, tilted 35° toward the Sun's side. */
const VIEW = galacticToScene(-Math.sin((35 * Math.PI) / 180), 0, Math.cos((35 * Math.PI) / 180)).normalize();
const smooth = THREE.MathUtils.smoothstep;

export class GalaxyRealm extends Realm {
  /** Galactic Sun-centred frame (light years). */
  private readonly galaxy = new THREE.Group();
  private readonly disc: THREE.ShaderMaterial;
  private readonly glow: THREE.ShaderMaterial[] = [];
  private readonly sky: THREE.Mesh;
  private readonly anchors = new Map<string, THREE.Object3D>();
  private readonly named: { id: string; label: Label }[] = [];
  private readonly sunLabel: Label;
  private particles: THREE.Points | null = null;

  constructor(canvas: HTMLCanvasElement, layer: HTMLElement, private readonly textures: TextureStreamer, pxPerRad: number, on: GalaxyEvents) {
    super(canvas, layer, 0.5, 1e7);
    this.sky = createSky(textures, pxPerRad);
    this.scene.add(this.sky);
    this.galaxy.quaternion.setFromRotationMatrix(GALACTIC_BASIS);
    this.scene.add(this.galaxy);

    // The disc: the face-on image in the Galactic plane, centred on the Galactic centre.
    const map = textures.get('milky_way.jpg', 'galaxy');
    this.disc = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map }, uOpacity: { value: 1 } },
      vertexShader: `
varying vec2 vUv;
varying float vFacing;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFacing = abs(dot(normalize(normalMatrix * vec3(0.0, 0.0, 1.0)), normalize(-mv.xyz)));
  gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: `
uniform sampler2D uMap;
uniform float uOpacity;
varying vec2 vUv;
varying float vFacing;
void main() {
  vec3 c = texture2D(uMap, vUv).rgb;
  // Seen edge-on the image would smear into a line: fade it, the points carry the shape.
  // Kept well below white: the image is drawn additively with the points and then bloomed.
  gl_FragColor = vec4(c * 0.62 * uOpacity * smoothstep(0.03, 0.4, vFacing), 1.0);
}`,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    const disc = new THREE.Mesh(new THREE.PlaneGeometry(IMAGE.widthLy, IMAGE.widthLy), this.disc);
    // Plane x → image right (−y galactic), plane y → image up (+x galactic), normal → north pole.
    disc.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)));
    const centre = imageToGalactic(0.5, 0.5);
    disc.position.set(centre.x, centre.y, 0);
    disc.frustumCulled = false;
    this.galaxy.add(disc);

    // The Sun's orbit around the centre.
    const orbit = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: 256 }, (_, i) => {
        const a = (i / 256) * Math.PI * 2;
        return new THREE.Vector3(centre.x - Math.cos(a) * R0_LY, centre.y - Math.sin(a) * R0_LY, 0);
      })),
      new THREE.LineBasicMaterial({ color: 0xffd27f, transparent: true, opacity: 0.35, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.galaxy.add(orbit);

    // The Sun, the centre and the arms.
    const sun = this.points([new THREE.Vector3()], [new THREE.Color(1.6, 1.3, 0.8)], [9]);
    this.galaxy.add(sun);
    this.sunLabel = this.label(sun, t('sunHere'), '#ffb347', () => on.sun(), 'g-star', 10);
    this.place2('galacticCentre', centre.x, centre.y, 0, on, 8);
    for (const [id, u, v] of ARM_LABELS) {
      const g = imageToGalactic(u, v);
      this.place2(id, g.x, g.y, 0, on, 4);
    }

    // Magellanic Clouds at their true positions (RA/Dec/distance), as fuzzy star clouds.
    for (const [id, ra, dec, dist, radius, n] of [['lmc', 80.894, -69.756, 160_000, 9000, 6000], ['smc', 13.187, -72.829, 200_000, 5500, 3500]] as const) {
      const c = equatorial(ra, dec, dist);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < n; i++) pts.push(new THREE.Vector3().randomDirection().multiplyScalar(radius * Math.pow(Math.random(), 1.6)).multiply(new THREE.Vector3(1, 0.55, 1)).add(c));
      const cloud = this.points(pts, pts.map(() => new THREE.Color(0.55, 0.62, 0.85)), pts.map(() => 1.3), 0.25);
      this.scene.add(cloud);
      const anchor = new THREE.Object3D();
      anchor.position.copy(c);
      this.scene.add(anchor);
      this.anchors.set(id, anchor);
      this.named.push({ id, label: this.label(anchor, deepL(id).name, deepL(id).color, () => on.select(id), 'region', 3) });
    }
    this.relang();
  }

  /** Label for a selectable place given in galactic coordinates (light years). */
  private place2(id: string, x: number, y: number, z: number, on: GalaxyEvents, priority: number) {
    const anchor = new THREE.Object3D();
    anchor.position.set(x, y, z);
    this.galaxy.add(anchor);
    this.anchors.set(id, anchor);
    const d = deepL(id);
    this.named.push({ id, label: this.label(anchor, d.name, d.color, () => on.select(id), id === 'galacticCentre' ? '' : 'region', priority) });
  }

  private points(pts: THREE.Vector3[], colors: THREE.Color[], sizes: number[], opacity = 1, attenuate = false) {
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors.flatMap((c) => [c.r, c.g, c.b]), 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const material = glowPoints(opacity, attenuate);
    this.glow.push(material);
    const p = new THREE.Points(geo, material);
    p.frustumCulled = false;
    return p;
  }

  private label(anchor: THREE.Object3D, text: string, color: string, onClick: () => void, cls: string, priority: number) {
    const l = makeLabel(text, color, onClick, cls, priority);
    anchor.add(l.object);
    this.labelList.push(l);
    return l;
  }

  /**
   * Points for the disc's thickness, sampled from the image (brighter regions get more),
   * built once the image is in memory — the first time the Galaxy is shown.
   */
  private buildParticles() {
    const img = (this.disc.uniforms.uMap.value as THREE.Texture).image as (CanvasImageSource & { width: number; height: number }) | undefined;
    if (!img || !img.width) return;
    const S = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = S;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, S, S);
    const data = ctx.getImageData(0, 0, S, S).data;
    // Images streamed as raw bytes come bottom-up (WebGL order); ImageLoader images top-down.
    const bottomUp = !(img instanceof HTMLImageElement);
    const pts: THREE.Vector3[] = [], col: THREE.Color[] = [], size: number[] = [];
    const N = 140_000;
    for (let tries = 0; pts.length < N && tries < N * 30; tries++) {
      const px = Math.floor(Math.random() * S), py = Math.floor(Math.random() * S);
      const o = (py * S + px) * 4;
      const r = data[o] / 255, g = data[o + 1] / 255, b = data[o + 2] / 255;
      const lum = 0.3 * r + 0.55 * g + 0.15 * b;
      if (Math.random() > lum * lum * 1.6) continue;
      const u = (px + Math.random()) / S, v = bottomUp ? 1 - (py + Math.random()) / S : (py + Math.random()) / S;
      const p = imageToGalactic(u, v);
      const fromCentre = Math.hypot(p.x - R0_LY, p.y);
      // Thin disc (σ ≈ 350 ly) thickening into the bulge near the centre.
      const sigma = 350 + 2600 * Math.exp(-((fromCentre / 7000) ** 2));
      const gauss = Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random());
      pts.push(new THREE.Vector3(p.x, p.y, gauss * sigma));
      col.push(new THREE.Color(r, g, b));
      size.push(70 + Math.random() * 90);
    }
    this.particles = this.points(pts, col, size, 0.12, true);
    this.galaxy.add(this.particles);
  }

  overview(): Focus {
    return { anchor: null, target: this.anchors.get('galacticCentre')!.getWorldPosition(new THREE.Vector3()), distance: 150_000, minDistance: 2000, maxDistance: MAX_DISTANCE, view: VIEW };
  }

  focusOf(id: string): Focus | null {
    if (id === 'milkyway') return this.overview();
    if (id === 'sunHere') return { anchor: null, target: new THREE.Vector3(), distance: 6000, minDistance: 40, maxDistance: MAX_DISTANCE };
    const a = this.anchors.get(id);
    if (!a) return null;
    const distance = id === 'galacticCentre' ? 14_000 : id === 'lmc' ? 70_000 : id === 'smc' ? 50_000 : 30_000;
    const inDisc = id !== 'lmc' && id !== 'smc';
    return { anchor: null, target: a.getWorldPosition(new THREE.Vector3()), distance, minDistance: 1000, maxDistance: MAX_DISTANCE, view: inDisc ? VIEW : undefined };
  }

  /** Pivot of the overview: the Sun up close, the Galactic centre from afar. */
  pathTarget(d: number, out: THREE.Vector3) {
    const w = smooth(Math.log10(d), Math.log10(1500), Math.log10(60_000));
    return this.anchors.get('galacticCentre')!.getWorldPosition(out).multiplyScalar(w);
  }

  /** Direction of the standard view from above the disc. */
  get standardView() {
    return VIEW;
  }

  update(dt: number, _days: number, free: boolean) {
    if (!free) this.director.update(dt);
    if (!this.particles) this.buildParticles();
    const dSun = this.camera.position.length();
    const ratio = Math.min(window.devicePixelRatio, 1.5);
    for (const m of this.glow) {
      m.uniforms.uPixelRatio.value = ratio;
      // Attenuated points: size in light years → pixels.
      m.uniforms.uScale.value = window.innerHeight / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    }
    // The sky panorama is the view from the Sun: it fades as the camera leaves the neighbourhood.
    const skyMat = this.sky.material as THREE.MeshBasicMaterial;
    skyMat.transparent = true;
    skyMat.opacity = 1 - smooth(dSun, 300, 3000);
    this.sky.visible = skyMat.opacity > 0.01;
    // Near the Sun the image's coarse texels would fill the view: fade the disc in with distance.
    this.disc.uniforms.uOpacity.value = smooth(dSun, 800, 8000);
    // The image needs about as many texels as the disc spans pixels.
    const pxPerRad = this.textures.pxPerRad;
    const target = this.anchors.get('galacticCentre')!.getWorldPosition(new THREE.Vector3());
    this.textures.setNeed('galaxy', (IMAGE.widthLy / Math.max(1, this.camera.position.distanceTo(target))) * pxPerRad);
    this.layout();
  }

  relang() {
    relabel(this.sunLabel, t('sunHere'));
    for (const n of this.named) relabel(n.label, deepL(n.id).name);
  }
}
