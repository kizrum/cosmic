/**
 * The Solar neighbourhood, in astronomical units with the Sun at the origin: the planets'
 * orbits, the heliosphere, the spacecraft that have left it, the Oort cloud and the stars
 * within 26 light years at their true positions.
 */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { BODIES } from '../data/bodies';
import { STARS } from '../data/stars';
import { deepL, starInfoL } from '../data/localize';
import { elementsAt, keplerPosition } from '../astro';
import { fmtNum, t } from '../i18n';
import type { LiveStat } from '../ui/UI';
import { fmtKm, fmtLight } from '../liveStats';
import { createSky } from '../scene/Environment';
import type { TextureStreamer } from '../scene/textures';
import { AU_PER_LY, eclipticDir } from './frames';
import { makeLabel, relabel, type Label } from './labels';
import { glowPoints, rimShell, starColor, trackLine } from './materials';
import { PROBE_IDS, probePosition, probeSpeed, trackPoints, type ProbeId } from './probes';
import { Realm, type Focus } from './realm';

/** Upstream direction of the interstellar wind (ecliptic λ 255.4°, β 5.2°): the heliosphere's nose. */
const NOSE = eclipticDir(255.4, 5.2);
const ORIGIN = new THREE.Vector3();
const MAX_DISTANCE = 6.5e6;
const RINGS: [number, string][] = [[100, 'au'], [1000, 'au'], [10_000, 'au'], [AU_PER_LY, 'ly'], [10 * AU_PER_LY, 'ly'], [20 * AU_PER_LY, 'ly']];

interface Probe {
  id: ProbeId;
  object: THREE.Object3D;
  label: Label;
  line: THREE.Line;
  material: THREE.ShaderMaterial;
}

interface Star {
  gl: string;
  object: THREE.Object3D;
  label: Label | null;
  ly: number;
  absmag: number;
  mag: number;
  spect: string;
  catalogue: string;
}

export interface LocalEvents {
  select(id: string): void;
  /** The Sun's label: back into the Solar System. */
  sun(): void;
}

const smooth = THREE.MathUtils.smoothstep;

export class LocalRealm extends Realm {
  private readonly sunLabel: Label;
  private readonly probes: Probe[] = [];
  private readonly stars: Star[] = [];
  private readonly glow: THREE.ShaderMaterial[] = [];
  private readonly orbits: THREE.LineBasicMaterial;
  private readonly shells: THREE.ShaderMaterial[] = [];
  private readonly shellLabel: Label;
  private readonly oort: THREE.ShaderMaterial;
  private readonly oortLabel: Label;
  private readonly rings: { r: number; material: THREE.LineBasicMaterial; label: CSS2DObject }[] = [];
  private readonly probeDots: THREE.Points;

  constructor(canvas: HTMLCanvasElement, layer: HTMLElement, textures: TextureStreamer, pxPerRad: number, on: LocalEvents) {
    super(canvas, layer, 0.05, 1e8);
    this.scene.add(createSky(textures, pxPerRad));

    // The Sun: a point of light (it is 0.005 AU across), bright enough to bloom.
    const sun = this.points([ORIGIN], [new THREE.Color(1.6, 1.3, 0.9)], [26]);
    this.scene.add(sun);
    this.sunLabel = this.label(sun, t('sunName'), '#ffb347', () => on.sun(), 'g-star', 10);

    // Planet orbits at their true size, faint, for scale.
    this.orbits = new THREE.LineBasicMaterial({ color: 0x8fb6d8, transparent: true, opacity: 0.35, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    const d0 = 9800;
    for (const b of BODIES) {
      if (b.group !== 'planet' || !b.orbit) continue;
      const k = { ...elementsAt(b.orbit, d0) };
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 180; i++) {
        const kk = { ...k, L: k.peri + i * 2 };
        const v = new THREE.Vector3();
        keplerPosition(kk, v);
        pts.push(v);
      }
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.orbits));
    }

    // Heliosphere: termination shock (~90 AU) and heliopause (~120 AU) around the nose.
    const shellLabelAnchor = new THREE.Object3D();
    for (const [r0, color, strength, tail] of [[90, 0xffb36b, 0.6, 3], [121, 0x7fb8ff, 1, 4]] as const) {
      const material = rimShell(color, strength);
      this.shells.push(material);
      this.scene.add(new THREE.Mesh(heliosphereShell(r0, tail), material));
    }
    shellLabelAnchor.position.copy(NOSE).multiplyScalar(121);
    this.scene.add(shellLabelAnchor);
    this.shellLabel = this.label(shellLabelAnchor, deepL('heliosphere').name, '#7fb8ff', () => on.select('heliosphere'), 'region', 7);

    // Spacecraft: the whole track from Horizons, bright up to the current date.
    const dots: THREE.Vector3[] = [];
    for (const id of PROBE_IDS) {
      const def = deepL(id);
      const { pts, days } = trackPoints(id);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setAttribute('aDay', new THREE.Float32BufferAttribute(days, 1));
      const material = trackLine(def.color);
      const line = new THREE.Line(geo, material);
      line.frustumCulled = false;
      this.scene.add(line);
      const object = new THREE.Object3D();
      this.scene.add(object);
      const label = this.label(object, def.name, def.color, () => on.select(id), 'probe', 6);
      this.probes.push({ id, object, label, line, material });
      dots.push(new THREE.Vector3());
    }
    this.probeDots = this.points(dots, this.probes.map((p) => new THREE.Color(deepL(p.id).color)), this.probes.map(() => 7));
    this.scene.add(this.probeDots);

    // Oort cloud: the flattened inner (Hills) cloud and the spherical outer cloud. Schematic.
    const oortPts: THREE.Vector3[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i < 26_000; i++) {
      const inner = i < 9000;
      const r = inner ? 2000 * Math.pow(10, Math.random()) : 20_000 * Math.pow(5, Math.random());
      v.randomDirection();
      if (inner) v.y *= 0.35;
      oortPts.push(v.clone().setLength(r));
    }
    const oortObj = this.points(oortPts, oortPts.map(() => new THREE.Color(0.45, 0.55, 0.7)), oortPts.map(() => 1.6), 0.5);
    this.oort = oortObj.material as THREE.ShaderMaterial;
    this.scene.add(oortObj);
    const oortAnchor = new THREE.Object3D();
    oortAnchor.position.copy(eclipticDir(120, 25)).multiplyScalar(45_000);
    this.scene.add(oortAnchor);
    this.oortLabel = this.label(oortAnchor, deepL('oort').name, '#9fb4cc', () => on.select('oort'), 'region', 5);

    // Stars within 26 ly (and bright landmarks within 60), at their true positions.
    const pos: THREE.Vector3[] = [], col: THREE.Color[] = [], size: number[] = [];
    for (const [x, y, z, absmag, mag, bv, spect, catalogue, gl] of STARS) {
      const p = new THREE.Vector3(x, y, z).multiplyScalar(AU_PER_LY);
      pos.push(p);
      col.push(starColor(bv).multiplyScalar(1.4));
      // Size from luminosity in visible light (Sun: absolute magnitude 4.83).
      const logL = (4.83 - absmag) / 2.5;
      size.push(THREE.MathUtils.clamp(4.5 + 2.2 * logL, 2, 13));
      const object = new THREE.Object3D();
      object.position.copy(p);
      this.scene.add(object);
      const info = starInfoL(gl);
      const label = info ? this.label(object, info.name, `#${starColor(bv).getHexString()}`, () => on.select(`star:${gl}`), 'star', 3 - mag / 6) : null;
      this.stars.push({ gl, object, label, ly: Math.hypot(x, y, z), absmag, mag, spect: spect.replace(/\.+$/, '').trim(), catalogue });
    }
    this.scene.add(this.points(pos, col, size));

    // Scale rings in the plane of the planets.
    for (const [r, unit] of RINGS) {
      const material = new THREE.LineBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: 0.25, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 256 }, (_, i) => new THREE.Vector3(Math.cos((i / 256) * Math.PI * 2) * r, 0, Math.sin((i / 256) * Math.PI * 2) * r)),
      ), material);
      this.scene.add(ring);
      const el = document.createElement('div');
      el.className = 'scale-ring';
      el.dataset.r = String(r);
      el.dataset.unit = unit;
      const label = new CSS2DObject(el);
      label.position.set(r * Math.SQRT1_2, 0, r * Math.SQRT1_2);
      this.scene.add(label);
      this.rings.push({ r, material, label });
    }
    this.relang();
  }

  private points(pts: THREE.Vector3[], colors: THREE.Color[], sizes: number[], opacity = 1) {
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors.flatMap((c) => [c.r, c.g, c.b]), 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const material = glowPoints(opacity);
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

  overview(): Focus {
    return { anchor: null, target: ORIGIN.clone(), distance: 1.6e6, minDistance: 25, maxDistance: MAX_DISTANCE };
  }

  focusOf(id: string): Focus | null {
    const base = { minDistance: 25, maxDistance: MAX_DISTANCE };
    if (id === 'heliosphere') return { ...base, anchor: null, target: ORIGIN.clone(), distance: 700 };
    if (id === 'oort') return { ...base, anchor: null, target: ORIGIN.clone(), distance: 300_000 };
    if (id === 'neighbourhood') return this.overview();
    const probe = this.probes.find((p) => p.id === id);
    if (probe) return { anchor: probe.object, target: probe.object.position.clone(), distance: 45, minDistance: 2, maxDistance: MAX_DISTANCE };
    const star = id.startsWith('star:') ? this.stars.find((s) => s.gl === id.slice(5)) : undefined;
    if (star) return { anchor: star.object, target: star.object.position.clone(), distance: 1.2e5, minDistance: 500, maxDistance: MAX_DISTANCE };
    return null;
  }

  /** Live numbers for the panel. */
  stats(id: string, days: number): LiveStat[] {
    if ((PROBE_IDS as readonly string[]).includes(id)) {
      const p = probePosition(id as ProbeId, days);
      if (!p) return [{ label: t('status'), value: t('notLaunched') }];
      const au = p.length();
      const speed = probeSpeed(id as ProbeId, days);
      return [
        { label: t('distSunNow'), value: `${fmtKm(au * 149_597_870.7)} (${fmtNum(au, { maximumFractionDigits: 1 })} ${t('au')})` },
        { label: t('signalFromEarth'), value: fmtLight(au * 149_597_870.7) },
        ...(speed ? [{ label: t('speedSun'), value: `${fmtNum(speed, { maximumFractionDigits: 1 })} ${t('kms')}` }] : []),
      ];
    }
    const star = id.startsWith('star:') ? this.stars.find((s) => s.gl === id.slice(5)) : undefined;
    if (star) {
      const year = new Date(Date.UTC(2000, 0, 1) + days * 86_400_000).getUTCFullYear();
      const lum = Math.pow(10, (4.83 - star.absmag) / 2.5);
      return [
        { label: t('distFromSun'), value: `${fmtNum(star.ly, { maximumFractionDigits: 2 })} ${t('ly')}` },
        { label: t('lightLeft'), value: t('inYear', Math.round(year - star.ly)) },
        { label: t('spectral'), value: star.spect || '—' },
        { label: t('apparentMag'), value: fmtNum(star.mag, { maximumFractionDigits: 2 }) },
        { label: t('luminosity'), value: t('timesSun', fmtNum(lum, { maximumSignificantDigits: lum < 0.01 ? 1 : 2 })) },
      ];
    }
    return [];
  }

  /** Catalogue entry of a nearby star for the panel (null: not a star id). */
  star(id: string) {
    return id.startsWith('star:') ? this.stars.find((s) => s.gl === id.slice(5)) ?? null : null;
  }

  update(dt: number, days: number, free: boolean) {
    if (!free) this.director.update(dt);
    const dSun = this.camera.position.length();
    const ratio = Math.min(window.devicePixelRatio, 1.5);
    for (const m of this.glow) m.uniforms.uPixelRatio.value = ratio;

    // Spacecraft positions on the current date.
    const dotPos = this.probeDots.geometry.attributes.position as THREE.BufferAttribute;
    this.probes.forEach((p, i) => {
      const at = probePosition(p.id, days, p.object.position);
      p.object.visible = !!at;
      if (!at) p.object.position.set(0, 0, 0);
      dotPos.setXYZ(i, p.object.position.x, p.object.position.y, p.object.position.z);
      p.material.uniforms.uDays.value = days;
      p.material.uniforms.uOpacity.value = 1 - smooth(dSun, 4000, 40_000);
      p.label.object.visible = !!at && (dSun < 4000 || this.focusId === p.id);
    });
    dotPos.needsUpdate = true;

    this.orbits.opacity = 0.35 * (1 - smooth(dSun, 400, 4000));
    for (const s of this.shells) s.uniforms.uOpacity.value = 1 - smooth(dSun, 6000, 80_000) * 0.85;
    this.shellLabel.object.visible = dSun < 15_000;
    // The cloud fades in past the heliosphere and back out at the scale of the stars.
    this.oort.uniforms.uOpacity.value = 0.45 * smooth(dSun, 1500, 15_000) * (1 - 0.85 * smooth(dSun, 4e5, 1.5e6));
    this.oortLabel.object.visible = dSun > 8000 && dSun < 2.5e6;
    for (const s of this.stars) if (s.label) s.label.object.visible = dSun > 25_000 || this.focusId === `star:${s.gl}`;
    for (const ring of this.rings) {
      const a = smooth(dSun, ring.r * 0.15, ring.r * 0.6) * (1 - smooth(dSun, ring.r * 8, ring.r * 30));
      ring.material.opacity = 0.22 * a;
      ring.label.visible = a > 0.3;
    }
    this.layout();
  }

  relang() {
    relabel(this.sunLabel, t('sunName'));
    relabel(this.shellLabel, deepL('heliosphere').name);
    relabel(this.oortLabel, deepL('oort').name);
    for (const p of this.probes) relabel(p.label, deepL(p.id).name);
    for (const s of this.stars) if (s.label) relabel(s.label, starInfoL(s.gl)?.name ?? s.catalogue);
    for (const ring of this.rings) {
      const el = ring.label.element;
      const r = Number(el.dataset.r);
      el.textContent = el.dataset.unit === 'au' ? `${fmtNum(r)} ${t('au')}` : `${fmtNum(Math.round(r / AU_PER_LY))} ${t('ly')}`;
    }
  }
}

/**
 * Comet-like boundary: radius r0 at the nose, growing toward the tail as
 * r = r0·√(2 / (1 + cos θ)), capped at `tail`·r0; it fades out along the tail.
 */
function heliosphereShell(r0: number, tail: number) {
  const geo = new THREE.SphereGeometry(1, 96, 64);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const fade = new Float32Array(pos.count);
  // Local +Y of the sphere is mapped onto the nose direction.
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), NOSE);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const cos = v.y;
    const r = r0 * Math.min(tail, Math.sqrt(2 / Math.max(1 + cos, 1e-3)));
    fade[i] = 1 - smooth(r / r0, 1.6, tail);
    v.multiplyScalar(r).applyQuaternion(q);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.setAttribute('aFade', new THREE.BufferAttribute(fade, 1));
  geo.computeVertexNormals();
  return geo;
}
