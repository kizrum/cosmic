import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  AU_KM, DEG, LIGHT_KM_S, dateFromDays, daysFromDate, elementsAt, keplerPosition, localToLatLon, moonPosition,
  orbitalPosition, sceneDistance, surfaceDistanceKm,
} from './astro';
import { SolarSystem, type Body } from './scene/SolarSystem';
import { AsteroidBelt, KuiperBelt, createSky } from './scene/Environment';
import { CameraDirector } from './CameraDirector';
import { TIME_PRESETS, UI, type LiveStat } from './ui/UI';
import type { Site } from './data/bodies';
import { REGIONS, type RegionDef } from './data/regions';
import { categoryOf, shapeOf } from './data/siteShapes';
import { SiteOutline } from './scene/SiteOutlines';

// ── Renderer & scene ────────────────────────────────────────────────────────────
const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const labelRenderer = new CSS2DRenderer({ element: document.querySelector<HTMLElement>('#labels')! });
labelRenderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.0005, 20000);
camera.position.set(0, 2200, 3600);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.rotateSpeed = 0.45;
controls.zoomSpeed = 0.9;
controls.enabled = false;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// High threshold: only HDR sources (the Sun, city lights, glints) bloom, not sunlit clouds.
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.45, 1.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── Simulation state ────────────────────────────────────────────────────────────
/**
 * Rotation is exact (IAU) up to 1 hour/s. Faster time warps would strobe the surfaces,
 * so rotation then advances at 1 hour/s and snaps back to the exact value afterwards.
 */
const SPIN_EXACT_MAX = 1 / 24;
let simDays = daysFromDate(Date.now());
let spinDays = simDays;
let speedIndex = 1;
let speedBeforeSite: number | null = null;
let lightBoost = false;
let showOrbits = true;

const manager = new THREE.LoadingManager();
const system = new SolarSystem(manager, renderer.capabilities.getMaxAnisotropy(), simDays);
scene.add(system.group);
scene.add(createSky(new THREE.TextureLoader(manager)));
const belt = new AsteroidBelt();
scene.add(belt.mesh);
const kuiper = new KuiperBelt();
scene.add(kuiper.points);

const sunLight = new THREE.PointLight(0xfff5ea, Math.PI, 0, 0);
scene.add(sunLight);
const ambient = new THREE.AmbientLight(0xb8c8ff, 0.05);
scene.add(ambient);

const director = new CameraDirector(camera, controls);

type Mode = 'system' | 'region' | 'body' | 'site';
let mode: Mode = 'system';
let focused: Body | null = null;
let focusedSite: Site | null = null;
const probe = new THREE.Object3D();
let probeLatLon: { lat: number; lon: number } | null = null;

// ── UI ──────────────────────────────────────────────────────────────────────────
function setSpeed(i: number) {
  speedIndex = i;
  speedBeforeSite = null;
  ui.setSpeedIndex(i);
}

const ui = new UI({
  selectBody: (id) => focusBody(system.get(id)),
  selectSite: (bodyId, siteId) => {
    const b = system.get(bodyId);
    const s = b.def.sites.find((x) => x.id === siteId);
    if (s) focusSite(b, s);
  },
  selectRegion: (id) => focusRegion(REGIONS.find((r) => r.id === id)!),
  hoverSite: (id) => (panelHoverSite = id),
  goSystem,
  goBody: () => focused && focusBody(focused),
  setSpeed,
  setDate: (ms) => {
    simDays = daysFromDate(ms);
    spinDays = simDays;
  },
  resetNow: () => {
    simDays = daysFromDate(Date.now());
    spinDays = simDays;
    setSpeed(1);
  },
  toggleLight: () => {
    lightBoost = !lightBoost;
    lightAuto = false;
    ui.setToggle('light', lightBoost);
  },
  toggleOrbits: () => {
    showOrbits = !showOrbits;
    ui.setToggle('orbits', showOrbits);
  },
});
ui.setSpeedIndex(speedIndex);
ui.setToggle('orbits', showOrbits);

// Any click on the map (labels and markers included) hides the object list.
document.querySelector('#labels')!.addEventListener('click', () => ui.setNavOpen(false), { capture: true });

for (const b of system.bodies) {
  b.label.element.addEventListener('click', (e) => {
    e.stopPropagation();
    focusBody(b);
  });
  for (const site of b.def.sites) {
    const cat = categoryOf(site, b.def.id);
    const el = document.createElement('button');
    el.className = 'site-marker';
    el.style.setProperty('--mc', cat.color);
    el.innerHTML = `<i></i><span>${site.name}</span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      focusSite(b, site);
    });
    el.addEventListener('pointerenter', () => (mapHoverSite = site.id));
    el.addEventListener('pointerleave', () => (mapHoverSite = null));
    const shape = shapeOf(b.def.id, site.id);
    if (shape) {
      const outline = new SiteOutline(shape, [site.lat, site.lon], b.def.radiusKm, b.overlayRadius(), cat.color);
      b.spin.add(outline.group);
      b.siteOutlines.set(site.id, outline);
    }
    const marker = new CSS2DObject(el);
    marker.visible = false;
    b.siteAnchors.get(site.id)!.add(marker);
    b.siteMarkers.set(site.id, marker);
  }
}

const regionAnchors = new Map<string, THREE.Object3D>();
const regionLabels: CSS2DObject[] = [];
for (const r of REGIONS) {
  const anchor = new THREE.Object3D();
  const s = sceneDistance(r.au);
  anchor.position.set(Math.cos(r.lon * DEG) * s, 0, -Math.sin(r.lon * DEG) * s);
  const el = document.createElement('div');
  el.className = 'body-label region';
  el.innerHTML = `<span class="dot" style="--c:${r.color}"></span><span class="name">${r.name}</span>`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    focusRegion(r);
  });
  const label = new CSS2DObject(el);
  anchor.add(label);
  scene.add(anchor);
  regionAnchors.set(r.id, anchor);
  regionLabels.push(label);
}

const probeEl = document.createElement('div');
probeEl.className = 'probe-marker';
probeEl.innerHTML = '<i></i><i></i><i></i>';
const probeMarker = new CSS2DObject(probeEl);
probe.add(probeMarker);

// ── Navigation ──────────────────────────────────────────────────────────────────
const OVERVIEW = new THREE.Vector3(0, 300, 470);

function leaveSite() {
  clearAutoLight();
  // Restore the time warp that was active before inspecting a site.
  if (speedBeforeSite !== null) {
    speedIndex = speedBeforeSite;
    speedBeforeSite = null;
    ui.setSpeedIndex(speedIndex);
  }
}

function goSystem() {
  leaveSite();
  mode = 'system';
  focused = null;
  focusedSite = null;
  setSurfaceView(null);
  probe.removeFromParent();
  ui.showSystem();
  ui.hint('Выберите объект — кликом по нему, по метке или в списке «Объекты»');
  director.flyTo({
    anchor: null, position: OVERVIEW.clone(), target: new THREE.Vector3(), minDistance: 30, maxDistance: 3000,
    avoid: { center: () => new THREE.Vector3(), radius: system.get('sun').radius * 1.3 },
  });
}

function focusRegion(r: RegionDef) {
  leaveSite();
  mode = 'region';
  focused = null;
  focusedSite = null;
  setSurfaceView(null);
  probe.removeFromParent();
  ui.showRegion(r);
  ui.hint('Вращайте камеру мышью · колесо — приближение · Esc — назад');
  const target = regionAnchors.get(r.id)!.position.clone();
  const dir = target.clone().normalize();
  const position = dir.clone().multiplyScalar(sceneDistance(r.viewAu)).add(new THREE.Vector3(0, r.viewHeight, 0));
  director.flyTo({ anchor: null, position, target, minDistance: 5, maxDistance: 1500 });
}

function focusBody(b: Body) {
  const prev = focused;
  leaveSite();
  mode = 'body';
  focused = b;
  focusedSite = null;
  probe.removeFromParent();
  setSurfaceView(null);
  ui.showBody(b.def);
  ui.hint(b.def.id === 'sun' ? 'Esc — назад к системе' : 'Вращайте камеру мышью · колесо — приближение · клик по поверхности — сканирование · Esc — назад');

  const center = b.getWorldPosition();
  const R = b.radius;
  const fromCam = camera.position.clone().sub(center).normalize();
  const toSun = center.clone().negate().normalize();
  // Rings are only bright on the face the Sun shines on: view Saturn from that side.
  const pole = new THREE.Vector3(0, 1, 0).applyQuaternion(b.tilt.getWorldQuaternion(new THREE.Quaternion()));
  // Giant planets: look down on the moon system at an angle so the orbits are in frame.
  const moonSystem = ['jupiter', 'uranus', 'neptune'].includes(b.def.id);
  const up = b.def.id === 'saturn'
    ? pole.multiplyScalar(Math.sign(pole.dot(toSun)) * 0.45)
    : new THREE.Vector3(0, moonSystem ? 0.75 : 0.3, 0);
  let dir: THREE.Vector3;
  if (b.def.id === 'sun') dir = fromCam.add(new THREE.Vector3(0, 0.35, 0)).normalize();
  else if (prev === b) dir = fromCam;
  else dir = toSun.multiplyScalar(0.6).add(fromCam.multiplyScalar(0.5)).add(up).normalize();
  const framing: Record<string, number> = { saturn: 6.5, sun: 4.2, haumea: 6, jupiter: 11, uranus: 10, neptune: 8 };
  const dist = R * (framing[b.def.id] ?? 3.8);
  director.flyTo({
    anchor: b.root,
    position: center.clone().addScaledVector(dir, dist),
    target: center,
    minDistance: R * 1.2,
    maxDistance: R * (b.def.id === 'sun' ? 25 : b.def.group === 'planet' ? 40 : 60),
    avoid: { center: () => b.getWorldPosition(), radius: R * 1.08 },
  });
}

function enterSite(b: Body) {
  if (focused !== b) {
    focused = b;
    ui.setActiveBody(b.def.id);
  }
  mode = 'site';
  // Surface inspection runs in real time: fast warps would strobe day and night.
  if (TIME_PRESETS[speedIndex].days > SPIN_EXACT_MAX && speedBeforeSite === null) {
    speedBeforeSite = speedIndex;
    speedIndex = 1;
    ui.setSpeedIndex(speedIndex);
  }
  setSurfaceView(b);
}

function surfaceView(b: Body, anchor: THREE.Object3D, altitude: number) {
  const center = b.getWorldPosition();
  const p = anchor.getWorldPosition(new THREE.Vector3());
  const normal = p.clone().sub(center).normalize();
  // Approach at an angle from the side the camera is already on.
  const side = camera.position.clone().sub(p);
  side.addScaledVector(normal, -side.dot(normal));
  if (side.lengthSq() < 1e-8) side.set(0, 1, 0).addScaledVector(normal, -normal.y);
  side.normalize();
  const h = b.radius * altitude;
  director.flyTo({
    anchor,
    position: p.clone().addScaledVector(normal, h).addScaledVector(side, h * 0.55),
    target: p,
    minDistance: b.radius * 0.04,
    maxDistance: b.radius * 3,
    avoid: { center: () => b.getWorldPosition(), radius: b.radius * 1.012 },
  });
}

function focusSite(b: Body, s: Site) {
  enterSite(b);
  focusedSite = s;
  probe.removeFromParent();
  ui.showSite(b.def, s);
  ui.hint('Вращайте камеру вокруг района · колесо — высота · Esc — назад');
  surfaceView(b, b.siteAnchors.get(s.id)!, s.elevation ? 0.9 : 0.42);
  if (!s.elevation) autoLight(b, s);
}

/** Night-side sites would be black: switch the fill light on (and off again when leaving). */
let lightAuto = false;
function autoLight(b: Body, p: { lat: number; lon: number }) {
  const night = localConditions(b, p)[0].value === 'ночь' && b.def.id !== 'earth';
  if (night && !lightBoost) {
    lightBoost = lightAuto = true;
    ui.setToggle('light', true);
    ui.hint('Район на ночной стороне — включена подсветка (L) · Esc — назад');
  } else if (!night) clearAutoLight();
}
function clearAutoLight() {
  if (!lightAuto) return;
  lightAuto = lightBoost = false;
  ui.setToggle('light', false);
}

function scanPoint(b: Body, worldPoint: THREE.Vector3) {
  const local = b.spin.worldToLocal(worldPoint.clone());
  const { lat, lon } = localToLatLon(local);
  probe.position.copy(local);
  b.spin.add(probe);
  probe.updateWorldMatrix(true, false);
  enterSite(b);
  focusedSite = null;
  probeLatLon = { lat, lon };
  let nearest: { site: Site; km: number } | undefined;
  for (const s of b.def.sites) {
    if (s.elevation) continue;
    const km = surfaceDistanceKm(b.def.radiusKm, { lat, lon }, s);
    if (!nearest || km < nearest.km) nearest = { site: s, km };
  }
  ui.showPoint(b.def, { lat, lon, nearest, status: localConditions(b, { lat, lon }) });
  ui.hint('Esc — назад');
  surfaceView(b, probe, 0.42);
  autoLight(b, { lat, lon });
}

/**
 * Surface inspection: Venus and Titan drop their opaque haze (radar / infrared view),
 * Earth's clouds thin out so the terrain stays readable.
 */
function setSurfaceView(b: Body | null) {
  for (const body of system.bodies) {
    if (!body.clouds) continue;
    body.cloudOpacityTarget = body !== b ? 1 : body.def.id === 'earth' ? 0.45 : 0;
  }
}

// ── Live data ───────────────────────────────────────────────────────────────────
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function fmtKm(km: number) {
  if (km > 1e9) return `${(km / 1e9).toLocaleString('ru-RU', { maximumFractionDigits: 3 })} млрд км`;
  if (km > 1e6) return `${(km / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн км`;
  return `${Math.round(km).toLocaleString('ru-RU')} км`;
}

function fmtLight(km: number) {
  const s = km / LIGHT_KM_S;
  if (s < 60) return `${s.toFixed(1)} с`;
  if (s < 3600) return `${Math.floor(s / 60)} мин ${Math.round(s % 60)} с`;
  return `${Math.floor(s / 3600)} ч ${Math.round((s % 3600) / 60)} мин`;
}

/** Heliocentric position of a body (km is converted to AU for moons via the parent). */
function helioAu(b: Body, out: THREE.Vector3): THREE.Vector3 {
  const def = b.def;
  if (def.group === 'moon' && b.parent) {
    helioAu(b.parent, out);
    const rel = new THREE.Vector3();
    const km = def.id === 'moon' ? moonPosition(simDays, rel) : keplerPosition(elementsAt(def.orbit!, simDays), rel);
    if (def.id === 'moon') rel.multiplyScalar(km);
    return out.addScaledVector(rel, 1 / AU_KM);
  }
  if (def.orbit) orbitalPosition(def.orbit, simDays, out);
  else out.set(0, 0, 0);
  return out;
}

const GENITIVE: Record<string, string> = {
  earth: 'Земли', mars: 'Марса', jupiter: 'Юпитера', saturn: 'Сатурна', uranus: 'Урана', neptune: 'Нептуна', pluto: 'Плутона',
};

function bodyStats(b: Body): LiveStat[] {
  const def = b.def;
  const out: LiveStat[] = [];
  const earth = system.get('earth');
  if (def.id === 'sun') {
    const km = helioAu(earth, tmpA).length() * AU_KM;
    out.push({ label: 'Расстояние до Земли сейчас', value: fmtKm(km) });
    out.push({ label: 'Свет идёт до Земли', value: fmtLight(km) });
    return out;
  }
  if (def.group === 'moon' && b.parent) {
    const rel = new THREE.Vector3();
    const km = def.id === 'moon' ? moonPosition(simDays, rel) : keplerPosition(elementsAt(def.orbit!, simDays), rel);
    out.push({ label: `Расстояние до ${GENITIVE[b.parent.def.id] ?? b.parent.def.name}`, value: fmtKm(km) });
  }
  const helio = helioAu(b, tmpA);
  if (def.group !== 'moon') out.push({ label: 'Расстояние до Солнца сейчас', value: `${fmtKm(helio.length() * AU_KM)} (${helio.length().toFixed(3)} а.е.)` });
  if (def.id !== 'earth' && def.id !== 'moon') {
    const km = helio.distanceTo(helioAu(earth, tmpB)) * AU_KM;
    out.push({ label: 'Расстояние до Земли сейчас', value: fmtKm(km) });
    out.push({ label: 'Сигнал от Земли идёт', value: fmtLight(km) });
  }
  if (def.id === 'moon') out.push({ label: 'Фаза', value: moonPhase() });
  if (def.id === 'saturn') {
    // Solar elevation above the ring plane: which face of the rings is lit.
    const pole = new THREE.Vector3(0, 1, 0).applyQuaternion(b.tilt.getWorldQuaternion(new THREE.Quaternion()));
    const toSun = b.getWorldPosition(tmpA).negate().normalize();
    const el = (Math.asin(pole.dot(toSun)) * 180) / Math.PI;
    out.push({ label: 'Солнце над плоскостью колец', value: `${el.toFixed(1)}° (освещена ${el >= 0 ? 'северная' : 'южная'} сторона)` });
  }
  return out;
}

/** Phase from true geometry (the scene's compressed distances would distort it). */
function moonPhase() {
  const toSun = helioAu(system.get('earth'), tmpA).negate().normalize();
  const toMoon = new THREE.Vector3();
  moonPosition(simDays, toMoon);
  const illum = (1 - toSun.dot(toMoon)) / 2;
  // Waxing when the Moon is east of the Sun: Sun→Moon turns counter-clockwise about ecliptic north (+Y).
  const waxing = toSun.cross(toMoon).y > 0;
  const pct = Math.round(illum * 100);
  const name = pct < 3 ? 'новолуние' : pct > 97 ? 'полнолуние' : pct < 50 ? (waxing ? 'растущий серп' : 'убывающий серп') : waxing ? 'растущая Луна' : 'убывающая Луна';
  return `${name}, освещено ${pct} %`;
}

/** Day/night and local solar time at a surface point, from the actual sun direction. */
function localConditions(b: Body, p: { lat: number; lon: number }): LiveStat[] {
  const center = b.getWorldPosition(tmpA);
  const sunLocal = b.spin.worldToLocal(new THREE.Vector3()).sub(b.spin.worldToLocal(center.clone()));
  const sub = localToLatLon(sunLocal);
  const sign = (b.def.Wdot ?? 1) < 0 ? -1 : 1;
  let hour = 12 + (sign * ((p.lon - sub.lon + 540) % 360 - 180)) / 15;
  hour = (hour + 24) % 24;
  const lat = p.lat * DEG, slat = sub.lat * DEG;
  const cosZ = Math.sin(lat) * Math.sin(slat) + Math.cos(lat) * Math.cos(slat) * Math.cos((p.lon - sub.lon) * DEG);
  const elev = Math.asin(THREE.MathUtils.clamp(cosZ, -1, 1)) / DEG;
  const state = elev > 6 ? 'день' : elev > -6 ? 'сумерки, терминатор' : 'ночь';
  const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 60);
  const out: LiveStat[] = [
    { label: 'Освещение', value: state },
    { label: 'Высота Солнца над горизонтом', value: `${elev.toFixed(1)}°` },
    { label: 'Местное солнечное время', value: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` },
  ];
  if (b.def.locked && b.parent) {
    // Synchronous moons: the parent hangs motionless in the sky of the near side.
    const toParent = b.spin.worldToLocal(b.parent.getWorldPosition(new THREE.Vector3())).normalize();
    const sp = localToLatLon(toParent);
    const pl = sp.lat * DEG;
    const cosP = Math.sin(lat) * Math.sin(pl) + Math.cos(lat) * Math.cos(pl) * Math.cos((p.lon - sp.lon) * DEG);
    const pe = Math.asin(THREE.MathUtils.clamp(cosP, -1, 1)) / DEG;
    out.push({ label: `${b.parent.def.name} над горизонтом`, value: pe > 0 ? `${pe.toFixed(1)}°, всегда на месте` : 'не видна отсюда' });
  }
  return out;
}

let liveTimer = 0;
function refreshLive(dt: number) {
  liveTimer -= dt;
  if (liveTimer > 0 || !focused) return;
  liveTimer = 0.25;
  if (mode === 'body') ui.setLive(bodyStats(focused));
  else if (mode === 'site' && focusedSite && !focusedSite.elevation) ui.setLive(localConditions(focused, focusedSite));
  else if (mode === 'site' && probeLatLon && !focusedSite) ui.setLive(localConditions(focused, probeLatLon));
}

// ── Picking ─────────────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downAt: { x: number; y: number } | null = null;
let hovered: Body | null = null;
/** Site under the pointer on the map / in the panel list. */
let mapHoverSite: string | null = null;
let panelHoverSite: string | null = null;

/** Smallest outlined site containing a surface point of the focused body. */
function siteAtSurface(b: Body, worldPoint: THREE.Vector3): Site | null {
  const { lat, lon } = localToLatLon(b.spin.worldToLocal(worldPoint.clone()));
  let best: Site | null = null;
  let bestArea = Infinity;
  for (const site of b.def.sites) {
    const o = b.siteOutlines.get(site.id);
    if (o && o.area < bestArea && o.contains(lat, lon)) {
      best = site;
      bestArea = o.area;
    }
  }
  return best;
}

function pickBody(x: number, y: number): Body | null {
  let best: Body | null = null;
  let bestDepth = Infinity;
  const v = new THREE.Vector3();
  const halfH = window.innerHeight / 2;
  const focal = halfH / Math.tan((camera.fov * Math.PI) / 360);
  for (const b of system.bodies) {
    if (b === focused || !b.label.visible) continue;
    b.getWorldPosition(v);
    const depth = v.distanceTo(camera.position);
    v.project(camera);
    if (v.z > 1) continue;
    const sx = ((v.x + 1) * window.innerWidth) / 2;
    const sy = (1 - v.y) * halfH;
    const rpx = (b.radius / depth) * focal;
    const d = Math.hypot(sx - x, sy - y);
    if (d < Math.max(rpx * 1.1, 16) && depth < bestDepth) {
      best = b;
      bestDepth = depth;
    }
  }
  return best;
}

function pickSurface(x: number, y: number) {
  if (!focused || focused.def.id === 'sun') return null;
  ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObject(focused.surface, false)[0] ?? null;
}

renderer.domElement.addEventListener('pointerdown', (e) => (downAt = { x: e.clientX, y: e.clientY }));
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || director.flying) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 5) return;
  ui.setNavOpen(false);
  const hit = pickSurface(e.clientX, e.clientY);
  if (hit) {
    // Clicking inside an outlined region opens that region; elsewhere scans the point.
    const site = siteAtSurface(focused!, hit.point);
    if (site && site !== focusedSite) focusSite(focused!, site);
    else if (!site) scanPoint(focused!, hit.point);
    return;
  }
  const b = pickBody(e.clientX, e.clientY);
  if (b) focusBody(b);
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.buttons) return;
  const surf = pickSurface(e.clientX, e.clientY);
  mapHoverSite = surf && focused ? siteAtSurface(focused, surf.point)?.id ?? null : null;
  const b = surf ? focused : pickBody(e.clientX, e.clientY);
  if (b !== hovered) {
    hovered?.label.element.classList.remove('hover');
    hovered = b;
    hovered?.label.element.classList.add('hover');
  }
  renderer.domElement.style.cursor = b ? 'pointer' : 'grab';
});

window.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).tagName === 'INPUT') return;
  // Esc belongs to the credits dialog while it is open.
  if (document.querySelector<HTMLDialogElement>('#credits')!.open) return;
  if (e.key === 'Escape' && ui.navOpen) {
    ui.setNavOpen(false);
    return;
  }
  if (e.key === 'Escape' || e.key === 'Backspace') {
    if (mode === 'site' && focused) focusBody(focused);
    else if (mode === 'body' && focused?.def.group === 'moon' && focused.parent) focusBody(focused.parent);
    else if (mode === 'body' || mode === 'region') goSystem();
  } else if (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') {
    lightBoost = !lightBoost;
    lightAuto = false;
    ui.setToggle('light', lightBoost);
  } else if (e.key === 'i' || e.key === 'I' || e.key === 'ш' || e.key === 'Ш') {
    ui.toggleCollapsed();
  } else if (e.key === ' ') {
    document.querySelector<HTMLButtonElement>('#btn-play')!.click();
    e.preventDefault();
  } else if (e.key === ',' || e.key === 'б' || e.key === 'Б') {
    ui.stepSpeed(-1);
  } else if (e.key === '.' || e.key === 'ю' || e.key === 'Ю') {
    ui.stepSpeed(1);
  }
});

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  labelRenderer.setSize(w, h);
});

// ── Per-frame presentation ──────────────────────────────────────────────────────
const occluder = new THREE.Sphere();
const ray = new THREE.Ray();
const hitPt = new THREE.Vector3();

/** Moons are only labelled (and pickable) once the camera is in their planet's neighbourhood. */
function nearParent(b: Body) {
  if (!b.parent || b.def.group !== 'moon') return true;
  const p = b.parent;
  const dist = camera.position.distanceTo(p.getWorldPosition(tmpA));
  return dist < b.root.position.length() * 5 || focused === p || focused?.parent === p;
}

function updateMarkers() {
  for (const b of system.bodies) {
    const isFocused = b === focused;
    const near = nearParent(b);
    b.label.visible = !isFocused && near;
    b.label.element.classList.toggle('dim', mode !== 'system');
    if (b.orbitLine) {
      b.orbitLine.visible = showOrbits && near;
      const m = b.orbitLine.material as THREE.LineBasicMaterial;
      m.opacity = b === hovered || isFocused ? 0.6 : mode === 'system' ? 0.22 : b.def.group === 'moon' ? 0.18 : 0.1;
    }
    b.axis.visible = showOrbits && isFocused;
    const showSites = isFocused && !director.flying;
    for (const [id, outline] of b.siteOutlines) {
      const hot = id === mapHoverSite || id === panelHoverSite;
      outline.setState(!showSites ? 'hidden' : focusedSite?.id === id ? 'active' : hot ? 'hover' : 'idle');
    }
    for (const [id, marker] of b.siteMarkers) {
      marker.visible = showSites;
      if (!marker.visible) continue;
      marker.element.classList.toggle('current', focusedSite?.id === id);
      marker.element.classList.toggle('hot', id === mapHoverSite || id === panelHoverSite);
      // Hidden when the body is between the camera and the marker.
      const p = marker.parent!.getWorldPosition(tmpB);
      occluder.set(b.getWorldPosition(tmpA), b.geoRadius * 0.97 * Math.min(b.spin.scale.x, b.spin.scale.y, b.spin.scale.z));
      const toP = p.clone().sub(camera.position);
      const dist = toP.length();
      ray.set(camera.position, toP.normalize());
      const hit = ray.intersectSphere(occluder, hitPt);
      const hidden = hit !== null && hitPt.distanceTo(camera.position) < dist - b.radius * 0.01;
      marker.element.classList.toggle('occluded', hidden);
    }
  }
  probeMarker.visible = !!probe.parent && !director.flying;
  layoutLabels();
}

const LABEL_PRIORITY: Record<string, number> = { star: 0, planet: 1, dwarf: 2, moon: 4 };
const nameWidth = new WeakMap<HTMLElement, number>();
const labelPos = new THREE.Vector3();

/**
 * Rings hug each body: diameter = apparent disc + a constant margin, so every object gets
 * the same visual gap. Names that would overlap a higher-priority name are hidden.
 */
function layoutLabels() {
  const halfW = window.innerWidth / 2, halfH = window.innerHeight / 2;
  const focal = halfH / Math.tan((camera.fov * Math.PI) / 360);
  const items: { el: HTMLElement; x: number; y: number; s: number; prio: number; size: number }[] = [];
  const add = (obj: CSS2DObject, radius: number, prio: number) => {
    if (!obj.visible) return;
    obj.getWorldPosition(labelPos);
    const depth = labelPos.distanceTo(camera.position);
    labelPos.project(camera);
    if (labelPos.z > 1) return;
    const discPx = radius > 0 ? (2 * radius / depth) * focal : 0;
    const s = THREE.MathUtils.clamp(discPx + 10, 12, 96);
    const el = obj.element;
    el.style.setProperty('--s', `${s.toFixed(1)}px`);
    el.classList.toggle('big', discPx + 10 > 96);
    items.push({ el, x: (labelPos.x + 1) * halfW, y: (1 - labelPos.y) * halfH, s, prio, size: radius });
  };
  for (const b of system.bodies) add(b.label, b.radius, LABEL_PRIORITY[b.def.group] ?? 5);
  // Belt labels float in empty space: show them only in the overview, never over a planet.
  for (const l of regionLabels) {
    l.visible = mode === 'system' || mode === 'region';
    add(l, 0, 3);
  }

  items.sort((a, b) => a.prio - b.prio || b.size - a.size);
  const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
  for (const it of items) {
    const name = it.el.querySelector<HTMLElement>('.name')!;
    let w = nameWidth.get(name);
    if (!w) {
      w = name.offsetWidth;
      if (w) nameWidth.set(name, w);
    }
    const box = { x0: it.x + it.s / 2 + 6, x1: it.x + it.s / 2 + 10 + (w || 80), y0: it.y - 9, y1: it.y + 9 };
    const hit = placed.some((p) => box.x0 < p.x1 && box.x1 > p.x0 && box.y0 < p.y1 && box.y1 > p.y0);
    it.el.classList.toggle('crowded', hit);
    if (!hit) placed.push(box);
  }
}

/**
 * Keep the subject centred in the part of the screen the info panel leaves free:
 * the projection is shifted (setViewOffset), so camera flights and controls are unchanged.
 */
const viewShift = { x: 0, y: 0 };
function frameFreeArea(dt: number) {
  const W = window.innerWidth, H = window.innerHeight;
  let tx = 0, ty = 0;
  const occ = mode === 'system' ? null : ui.occlusion();
  if (occ) {
    const besideMiddle = occ.top < H * 0.6 && occ.bottom > H * 0.4;
    if (occ.left > W * 0.4 && besideMiddle) tx = (W - occ.left) / 2; // side panel
    else if (occ.top > H * 0.35 && occ.width > W * 0.6) ty = (H - occ.top) / 2; // bottom sheet
  }
  const k = Math.min(1, dt * 5);
  viewShift.x += (tx - viewShift.x) * k;
  viewShift.y += (ty - viewShift.y) * k;
  if (Math.abs(viewShift.x) < 0.5 && Math.abs(viewShift.y) < 0.5) {
    if (camera.view?.enabled) camera.clearViewOffset();
  } else {
    camera.setViewOffset(W, H, viewShift.x, viewShift.y, W, H);
  }
}

// ── Main loop ───────────────────────────────────────────────────────────────────
const timer = new THREE.Timer();
timer.connect(document);
let started = false;

function frame(now: number) {
  timer.update(now);
  const dt = Math.min(timer.getDelta(), 0.1);
  const speed = TIME_PRESETS[speedIndex].days;
  simDays += speed * dt;
  if (speed <= SPIN_EXACT_MAX) spinDays = simDays;
  else spinDays += SPIN_EXACT_MAX * dt;

  system.update(simDays, spinDays, dt);
  belt.update(simDays);
  kuiper.update(simDays);
  ambient.intensity += ((lightBoost ? 0.9 : 0.05) - ambient.intensity) * Math.min(1, dt * 4);
  system.setAmbient(ambient.intensity);
  scene.updateMatrixWorld();
  if (started) director.update(dt);
  system.syncUniforms(timer.getElapsed(), camera);
  // Screen-space bloom would flood the frame when the Sun is large; fade it with apparent size.
  const sunAngular = system.get('sun').radius / camera.position.length();
  bloom.strength = THREE.MathUtils.lerp(0.75, 0.12, THREE.MathUtils.smoothstep(sunAngular, 0.04, 0.25));
  frameFreeArea(dt);
  updateMarkers();
  refreshLive(dt);
  ui.setDate(dateFromDays(simDays));
  ui.setRealtime(speedIndex === 1 && Math.abs(simDays - daysFromDate(Date.now())) < 2 / 1440);

  composer.render();
  labelRenderer.render(scene, camera);
  requestAnimationFrame(frame);
}

manager.onProgress = (_url, loaded, total) => ui.loading(loaded / total);
manager.onLoad = () => {
  ui.ready();
  started = true;
  camera.lookAt(0, 0, 0);
  goSystem();
};
requestAnimationFrame(frame);
