import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { SiteOutline } from './SiteOutlines';
import { BODIES, type BodyDef, type Site } from '../data/bodies';
import {
  DEG, basisFromPole, elementsAt, equToScene, keplerPosition, latLonToLocal, moonPosition, orbitNormal,
  periodDays, satelliteDistance, scenePosition,
} from '../astro';
import {
  atmosphereFragment, atmosphereVertex, coronaFragment, coronaVertex, earthFragment,
  ringFragment, ringShadowChunk, ringVertex, sunFragment, worldVertex,
} from './shaders';

const SUN_RADIUS = 12;
/** Earth–Moon distance in scene units (Earth radius = 1). */
const MOON_DISTANCE = 4.2;
const SUN_POS = new THREE.Vector3(0, 0, 0);

/** Radii are compressed (power 0.55) so that small worlds stay visible next to giants. */
export const visualRadius = (def: BodyDef) =>
  def.id === 'sun' ? SUN_RADIUS : Math.max(0.045, Math.pow(def.radiusKm / 6371, 0.55));

interface AtmosphereStyle {
  scale: number; color: [number, number, number]; sunset: [number, number, number];
  intensity: number; falloff: number; mie: number;
}

const ATMOSPHERES: Record<string, AtmosphereStyle> = {
  earth: { scale: 1.035, color: [0.28, 0.55, 1.0], sunset: [1.0, 0.45, 0.2], intensity: 1.1, falloff: 4.5, mie: 1.2 },
  venus: { scale: 1.05, color: [1.0, 0.85, 0.55], sunset: [1.0, 0.55, 0.25], intensity: 0.75, falloff: 3.0, mie: 0.8 },
  mars: { scale: 1.022, color: [0.95, 0.68, 0.48], sunset: [0.45, 0.6, 0.95], intensity: 0.45, falloff: 4.0, mie: 1.0 },
  jupiter: { scale: 1.02, color: [0.95, 0.85, 0.7], sunset: [0.9, 0.6, 0.4], intensity: 0.45, falloff: 3.5, mie: 0.6 },
  saturn: { scale: 1.02, color: [0.95, 0.88, 0.65], sunset: [0.9, 0.65, 0.4], intensity: 0.4, falloff: 3.5, mie: 0.6 },
  uranus: { scale: 1.03, color: [0.6, 0.9, 0.95], sunset: [0.5, 0.8, 0.85], intensity: 0.7, falloff: 3.0, mie: 0.5 },
  neptune: { scale: 1.03, color: [0.45, 0.65, 1.0], sunset: [0.4, 0.6, 0.9], intensity: 0.7, falloff: 3.0, mie: 0.5 },
  // Titan: thick tholin haze extending hundreds of km; Pluto: thin blue haze layers (New Horizons).
  titan: { scale: 1.12, color: [0.95, 0.6, 0.28], sunset: [0.6, 0.3, 0.1], intensity: 0.4, falloff: 3.0, mie: 1.2 },
  pluto: { scale: 1.05, color: [0.45, 0.65, 1.0], sunset: [0.4, 0.55, 0.9], intensity: 0.1, falloff: 4.0, mie: 1.2 },
};

/** Thin ring systems: [radius km, width km, opacity]. */
const THIN_RINGS: Record<string, { rings: [number, number, number][]; color: number }> = {
  // Uranus: rings 6, 5, 4, α, β, η, γ, δ, ε (Voyager 2 / ground occultations).
  uranus: {
    color: 0x9a9a9a,
    rings: [[41837, 2, 0.3], [42234, 2, 0.3], [42571, 2, 0.3], [44718, 8, 0.45], [45661, 9, 0.45], [47176, 2, 0.3], [47627, 3, 0.4], [48300, 6, 0.45], [51149, 58, 0.7]],
  },
  // Neptune: Galle, Le Verrier, Lassell, Arago, Adams.
  neptune: {
    color: 0x8a8a8a,
    rings: [[41900, 2000, 0.025], [53200, 113, 0.25], [55200, 4000, 0.018], [57200, 100, 0.1], [62932, 50, 0.35]],
  },
  haumea: { color: 0xbfbfbf, rings: [[2287, 70, 0.55]] },
};

/** Opaque haze/cloud decks that hide the surface (removed in surface-inspection mode). */
const HAZE: Record<string, { color?: number; texture?: string; scale: number; spinDays?: number }> = {
  venus: { texture: 'venus_atmosphere.jpg', scale: 1.012, spinDays: -4 },
  titan: { color: 0xa8742e, scale: 1.02 },
};

export class Body {
  readonly radius: number;
  /** Radius of the (unscaled) sphere geometry. */
  readonly geoRadius: number;
  parent?: Body;
  readonly root = new THREE.Group();
  readonly tilt = new THREE.Group();
  readonly spin = new THREE.Group();
  surface!: THREE.Mesh;
  label!: CSS2DObject;
  orbitLine?: THREE.Line;
  readonly siteAnchors = new Map<string, THREE.Object3D>();
  readonly siteMarkers = new Map<string, CSS2DObject>();
  readonly siteOutlines = new Map<string, SiteOutline>();
  readonly uniforms: { [k: string]: THREE.IUniform }[] = [];
  clouds?: THREE.Mesh;
  cloudOpacityTarget = 1;
  cloudOpacityBase = 1;
  hazeSpin = 0;
  atmosphere?: { uniforms: { [k: string]: THREE.IUniform }; base: number };
  earthUniforms?: { [k: string]: THREE.IUniform };
  private readonly worldPos = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();
  private readonly basis = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();

  constructor(readonly def: BodyDef) {
    this.geoRadius = visualRadius(def);
    let maxScale = 1;
    if (def.shape) {
      const [a, b, c] = def.shape;
      const m = Math.cbrt(a * b * c);
      this.spin.scale.set(a / m, c / m, b / m);
      maxScale = a / m;
    } else if (def.flattening) {
      this.spin.scale.y = 1 - def.flattening;
    }
    this.radius = this.geoRadius * maxScale;
    this.root.name = def.id;
    this.root.add(this.tilt);
    this.tilt.add(this.spin);
  }

  getWorldPosition(out = new THREE.Vector3()) {
    return this.root.getWorldPosition(out);
  }

  /** Radius (body-fixed units) at which surface overlays are drawn: just above clouds/haze. */
  overlayRadius() {
    const cloudR = this.clouds ? (this.clouds.geometry as THREE.SphereGeometry).parameters.radius : this.geoRadius;
    return Math.max(cloudR, this.geoRadius) * 1.004;
  }

  addSite(site: Site) {
    const anchor = new THREE.Object3D();
    anchor.position.copy(latLonToLocal(site.lat, site.lon)).multiplyScalar(this.geoRadius * (site.elevation ?? 1));
    this.spin.add(anchor);
    this.siteAnchors.set(site.id, anchor);
  }

  /** Scene position relative to the parent body (or the Sun). */
  orbitPoint(d: number, out: THREE.Vector3) {
    const def = this.def;
    if (def.id === 'moon') {
      const km = moonPosition(d, out);
      return out.multiplyScalar(MOON_DISTANCE * (km / 384_400));
    }
    if (!def.orbit) return out.set(0, 0, 0);
    if (!this.parent || this.parent.def.id === 'sun' || def.group !== 'moon') return scenePosition(def.orbit, d, out);
    const km = keplerPosition(elementsAt(def.orbit, d), out);
    return out.multiplyScalar((this.parent.geoRadius * satelliteDistance(km / this.parent.def.radiusKm)) / km);
  }

  private poleAt(d: number, out: THREE.Vector3) {
    const def = this.def;
    const T = d / 36525;
    if (def.id === 'moon') {
      // IAU lunar pole with the main nutation term (E1 = lunar node).
      const E1 = (125.045 - 0.0529921 * d) * DEG;
      return equToScene(269.9949 + 0.0031 * T - 3.8787 * Math.sin(E1), 66.5392 + 0.013 * T + 1.5419 * Math.cos(E1), out);
    }
    if (def.id === 'neptune') {
      const N = (357.85 + 52.316 * T) * DEG;
      return equToScene(299.36 + 0.7 * Math.sin(N), 43.46 - 0.51 * Math.cos(N), out);
    }
    if (def.pole) return equToScene(def.pole.ra + (def.pole.raRate ?? 0) * T, def.pole.dec + (def.pole.decRate ?? 0) * T, out);
    // Unknown pole: assume it is perpendicular to the orbit (true for synchronous moons).
    return def.orbit ? orbitNormal(elementsAt(def.orbit, d), out) : out.set(0, 1, 0);
  }

  update(d: number, spinDays: number, dt: number) {
    const def = this.def;
    this.orbitPoint(d, this.root.position);
    this.tilt.quaternion.setFromRotationMatrix(basisFromPole(this.poleAt(d, this.tmp), this.basis));

    if (def.locked) {
      // Synchronous rotation: prime meridian (local +X) faces the parent.
      const toParent = this.tmp.copy(this.root.position).negate().applyQuaternion(this.q.copy(this.tilt.quaternion).invert());
      this.spin.rotation.y = Math.atan2(-toParent.z, toParent.x);
    } else {
      this.spin.rotation.y = (((def.W0 ?? 0) + (def.Wdot ?? 0) * spinDays) % 360) * DEG;
    }

    if (this.clouds) {
      const m = this.clouds.material as THREE.MeshStandardMaterial;
      m.opacity += (this.cloudOpacityTarget * this.cloudOpacityBase - m.opacity) * Math.min(1, dt * 3);
      this.clouds.visible = m.opacity > 0.01;
      if (def.id === 'earth') {
        const shift = spinDays * 0.04 * Math.PI * 2;
        this.clouds.rotation.y = shift;
        if (this.earthUniforms) this.earthUniforms.uCloudShift.value = shift / (Math.PI * 2);
      } else if (this.hazeSpin) {
        this.clouds.rotation.y = (spinDays / this.hazeSpin) * Math.PI * 2;
      }
      // Surface view: thin the haze together with the cloud deck.
      if (this.atmosphere && def.id !== 'earth') {
        this.atmosphere.uniforms.uIntensity.value = this.atmosphere.base * (0.15 + 0.85 * (m.opacity / this.cloudOpacityBase));
      }
    }
  }

  syncUniforms(time: number) {
    this.getWorldPosition(this.worldPos);
    const pole = this.tmp.set(0, 1, 0).applyQuaternion(this.tilt.getWorldQuaternion(this.q));
    for (const u of this.uniforms) {
      if (u.uCenter) u.uCenter.value.copy(this.worldPos);
      if (u.uRingCenter) u.uRingCenter.value.copy(this.worldPos);
      if (u.uTime) u.uTime.value = time;
      if (u.uNormal) u.uNormal.value.copy(pole);
      if (u.uRingNormal) u.uRingNormal.value.copy(pole);
    }
  }
}

export class SolarSystem {
  readonly group = new THREE.Group();
  readonly bodies: Body[] = [];
  private corona!: THREE.Mesh;
  private readonly loader: THREE.TextureLoader;
  private readonly anisotropy: number;
  private orbitClock = 0;

  constructor(manager: THREE.LoadingManager, anisotropy: number, d: number) {
    this.loader = new THREE.TextureLoader(manager);
    this.anisotropy = anisotropy;
    for (const def of BODIES) this.bodies.push(this.build(def));
    for (const b of this.bodies) {
      b.parent = b.def.parent ? this.get(b.def.parent) : this.get('sun');
      if (b.def.id === 'sun') b.parent = undefined;
      if (b.def.group === 'moon') b.parent!.root.add(b.root);
      else this.group.add(b.root);
    }
    this.buildOrbits(d);
  }

  get(id: string) {
    return this.bodies.find((b) => b.def.id === id)!;
  }

  private tex(name: string, srgb = true) {
    const t = this.loader.load(`textures/${name}`);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = this.anisotropy;
    return t;
  }

  private build(def: BodyDef) {
    const body = new Body(def);
    const r = body.geoRadius;
    const segs = def.group === 'moon' || def.group === 'dwarf' ? 96 : def.id === 'sun' ? 96 : 160;
    const geo = new THREE.SphereGeometry(r, segs, segs / 2);
    let material: THREE.Material;

    if (def.id === 'sun') {
      const u = { uMap: { value: this.tex('sun.jpg') }, uTime: { value: 0 } };
      body.uniforms.push(u);
      material = new THREE.ShaderMaterial({ vertexShader: worldVertex, fragmentShader: sunFragment, uniforms: u });
      this.buildCorona(body);
    } else if (def.id === 'earth') {
      const clouds = this.tex('earth_clouds.jpg', false);
      const u = {
        uDay: { value: this.tex('earth_day.jpg') },
        uNight: { value: this.tex('earth_night.jpg') },
        uSpec: { value: this.tex('earth_specular.jpg', false) },
        uClouds: { value: clouds },
        uSunPos: { value: SUN_POS },
        uCloudShift: { value: 0 },
        uAmbient: { value: 0.012 },
      };
      body.earthUniforms = u;
      body.uniforms.push(u);
      material = new THREE.ShaderMaterial({ vertexShader: worldVertex, fragmentShader: earthFragment, uniforms: u });
      body.clouds = new THREE.Mesh(
        new THREE.SphereGeometry(r * 1.008, 160, 80),
        new THREE.MeshStandardMaterial({ color: 0xdfe6ee, alphaMap: clouds, transparent: true, depthWrite: false, roughness: 1, opacity: 1 }),
      );
    } else {
      const map = this.tex(def.texture!);
      const gaseous = ['jupiter', 'saturn', 'uranus', 'neptune', 'venus'].includes(def.id);
      const mat = new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0 });
      // Solid surfaces: derive relief shading from the albedo map.
      // Low-resolution or partly filled-in maps would turn noise into fake relief.
      const smoothMap = def.note !== undefined || ['europa', 'callisto', 'titan'].includes(def.id);
      if (!gaseous && !smoothMap) {
        mat.bumpMap = map;
        mat.bumpScale = def.id === 'mars' ? 1.2 : def.group === 'planet' || def.id === 'moon' ? 1.6 : 0.7;
      }
      material = mat;
      if (def.id === 'saturn') this.buildSaturnRings(body, mat);
    }

    const haze = HAZE[def.id];
    if (haze) {
      body.clouds = new THREE.Mesh(
        new THREE.SphereGeometry(r * haze.scale, 128, 64),
        new THREE.MeshStandardMaterial({
          map: haze.texture ? this.tex(haze.texture) : null,
          color: haze.color ?? 0xffffff, transparent: true, roughness: 1, opacity: 1,
        }),
      );
      body.hazeSpin = haze.spinDays ?? 0;
    }
    if (THIN_RINGS[def.id]) this.buildThinRings(body, THIN_RINGS[def.id]);

    body.surface = new THREE.Mesh(geo, material);
    body.surface.name = `${def.id}-surface`;
    body.spin.add(body.surface);
    if (body.clouds) body.spin.add(body.clouds);

    const atm = ATMOSPHERES[def.id];
    if (atm) this.buildAtmosphere(body, atm);

    for (const site of def.sites) body.addSite(site);

    const el = document.createElement('div');
    el.className = `body-label g-${def.group}`;
    el.dataset.body = def.id;
    el.innerHTML = `<span class="dot" style="--c:${def.color}"></span><span class="name">${def.name}</span>`;
    body.label = new CSS2DObject(el);
    body.root.add(body.label);
    return body;
  }

  private buildAtmosphere(body: Body, s: AtmosphereStyle) {
    const r = body.geoRadius;
    const u = {
      uCenter: { value: new THREE.Vector3() },
      uSunPos: { value: SUN_POS },
      uRp: { value: r * 0.998 },
      uRa: { value: r * s.scale },
      uColor: { value: new THREE.Vector3(...s.color) },
      uSunset: { value: new THREE.Vector3(...s.sunset) },
      uIntensity: { value: s.intensity },
      uFalloff: { value: s.falloff },
      uMie: { value: s.mie },
    };
    body.uniforms.push(u);
    body.atmosphere = { uniforms: u, base: s.intensity };
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r * s.scale, 96, 48),
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex, fragmentShader: atmosphereFragment, uniforms: u,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
      }),
    );
    mesh.name = 'atmosphere';
    mesh.scale.y = body.spin.scale.y;
    mesh.renderOrder = 2;
    body.tilt.add(mesh);
    // When the camera dips inside the shell, render back faces so the sky stays visible.
    mesh.onBeforeRender = (_r, _s, camera) => {
      const inside = camera.position.distanceTo(u.uCenter.value) < u.uRa.value;
      (mesh.material as THREE.ShaderMaterial).side = inside ? THREE.BackSide : THREE.FrontSide;
    };
  }

  private buildSaturnRings(body: Body, planetMat: THREE.MeshStandardMaterial) {
    // Ring radii in Saturn equatorial radii: C ring inner edge → A ring outer edge.
    const inner = body.radius * 1.239;
    const outer = body.radius * 2.27;
    const map = this.tex('saturn_ring.png');
    const u = {
      uMap: { value: map },
      uSunPos: { value: SUN_POS },
      uCenter: { value: new THREE.Vector3() },
      uNormal: { value: new THREE.Vector3(0, 1, 0) },
      uPlanetR: { value: body.radius },
      uAmbient: { value: 0.03 },
      uInner: { value: inner },
      uOuter: { value: outer },
    };
    body.uniforms.push(u);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 256, 4),
      new THREE.ShaderMaterial({
        vertexShader: ringVertex, fragmentShader: ringFragment, uniforms: u,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 1;
    ring.name = 'rings';
    body.tilt.add(ring);

    const su = {
      uSunPos: { value: SUN_POS },
      uRingCenter: { value: new THREE.Vector3() },
      uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
      uRingInner: { value: inner },
      uRingOuter: { value: outer },
      uRingMap: { value: map },
    };
    body.uniforms.push(su);
    planetMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, su);
      shader.vertexShader = 'varying vec3 vRingWorld;\n' + shader.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvRingWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );
      shader.fragmentShader =
        'uniform vec3 uSunPos;\nuniform vec3 uRingCenter;\nuniform vec3 uRingNormal;\nuniform float uRingInner;\nuniform float uRingOuter;\nuniform sampler2D uRingMap;\nvarying vec3 vRingWorld;\n' +
        shader.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + ringShadowChunk);
    };
  }

  /** Narrow, dark rings (Uranus, Neptune, Haumea) drawn as thin annuli in the equatorial plane. */
  private buildThinRings(body: Body, spec: { rings: [number, number, number][]; color: number }) {
    const kmToScene = body.geoRadius / body.def.radiusKm;
    const group = new THREE.Group();
    for (const [rKm, wKm, opacity] of spec.rings) {
      const r = rKm * kmToScene;
      // Narrow rings would vanish at screen scale: give them a minimum visual width.
      const w = Math.max(wKm * kmToScene, body.geoRadius * 0.006);
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(r - w / 2, r + w / 2, 256, 1),
        new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }),
      );
      group.add(mesh);
    }
    group.rotation.x = -Math.PI / 2;
    group.renderOrder = 1;
    body.tilt.add(group);
  }

  private buildCorona(body: Body) {
    const scale = 7;
    const u = { uTime: { value: 0 }, uScale: { value: scale } };
    body.uniforms.push(u);
    this.corona = new THREE.Mesh(
      new THREE.PlaneGeometry(SUN_RADIUS * scale * 2, SUN_RADIUS * scale * 2),
      new THREE.ShaderMaterial({
        vertexShader: coronaVertex, fragmentShader: coronaFragment, uniforms: u,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    );
    this.corona.renderOrder = 3;
    body.root.add(this.corona);
  }

  private buildOrbits(d: number) {
    for (const b of this.bodies) {
      if (b.def.id === 'sun') continue;
      if (!b.def.orbit && b.def.id !== 'moon') continue;
      const N = b.def.group === 'moon' ? 256 : 720;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(Array.from({ length: N + 1 }, () => new THREE.Vector3())),
        new THREE.LineBasicMaterial({ color: b.def.color, transparent: true, opacity: 0.22, depthWrite: false }),
      );
      line.frustumCulled = false;
      b.orbitLine = line;
      (b.def.group === 'moon' ? b.parent!.root : this.group).add(line);
      this.sampleOrbit(b, d);
    }
  }

  /** Re-sample an orbit polyline around day d (elements and lunar nodes drift slowly). */
  private sampleOrbit(b: Body, d: number) {
    const line = b.orbitLine!;
    const pos = line.geometry.attributes.position as THREE.BufferAttribute;
    const N = pos.count - 1;
    const period = b.def.id === 'moon' ? 27.321661 : periodDays(b.def.orbit!);
    const v = new THREE.Vector3();
    for (let k = 0; k <= N; k++) {
      b.orbitPoint(d + (period * k) / N, v);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
    if (b.def.id === 'moon') pos.copyAt(N, pos, 0); // perturbations leave the loop slightly open
    pos.needsUpdate = true;
  }

  update(d: number, spinDays: number, dt: number) {
    for (const b of this.bodies) b.update(d, spinDays, dt);
    // Moon orbits precess quickly (nodes, apsides): refresh them a couple of times per second.
    this.orbitClock -= dt;
    if (this.orbitClock <= 0) {
      this.orbitClock = 0.5;
      for (const b of this.bodies) if (b.def.group === 'moon' && b.orbitLine) this.sampleOrbit(b, d);
    }
  }

  /** Fill light for custom shaders (Earth, Saturn's rings), matching the scene's ambient light. */
  setAmbient(intensity: number) {
    for (const b of this.bodies) {
      for (const u of b.uniforms) {
        if (!u.uAmbient) continue;
        u.uAmbient.value = b.def.id === 'earth' ? intensity * 0.32 : Math.max(0.03, intensity * 0.4);
      }
    }
  }

  syncUniforms(time: number, camera: THREE.Camera) {
    for (const b of this.bodies) b.syncUniforms(time);
    this.corona.quaternion.copy(camera.quaternion);
  }
}
