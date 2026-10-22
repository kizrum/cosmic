import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { SolarSystem } from './scene/SolarSystem';
import { AsteroidBelt, KuiperBelt, createSky } from './scene/Environment';
import { Renderer, type LabeledView } from './scene/renderer';
import { AdaptiveQuality, detectSoftwareGL } from './scene/quality';
import { Markers } from './scene/markers';
import { TextureStreamer } from './scene/textures';
import { scale, stepScale } from './scene/scale';
import { CameraDirector } from './CameraDirector';
import { SimClock } from './clock';
import { Display } from './display';
import { Navigation } from './navigation';
import { Picker } from './picking';
import { bindInput } from './input';
import { Cosmos } from './cosmos/cosmos';
import { LocalRealm } from './cosmos/localRealm';
import { GalaxyRealm } from './cosmos/galaxyRealm';
import { UI } from './ui/UI';
import * as sound from './ui/sound';
import { REGIONS } from './data/regions';
import { accuracyAt } from './data/validity';
import { applyStatic, onLangChange } from './i18n';

// ── Renderer & scene ────────────────────────────────────────────────────────────
const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const layer = (id: string) => document.querySelector<HTMLElement>(id)!;
const scene = new THREE.Scene();
// Far plane covers true-scale distances (Eris at aphelion ≈ 2.3 million Earth radii).
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.0005, 5e7);
camera.position.set(0, 2200, 3600);
const solarView: LabeledView = { scene, camera, labels: new CSS2DRenderer({ element: layer('#labels') }) };
const r = new Renderer(canvas, solarView);
// Checking every shader for errors on first use makes the driver finish compiling there and
// then; shaders are known-good in production builds.
r.gl.debug.checkShaderErrors = import.meta.env.DEV;
const quality = new AdaptiveQuality(r);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.rotateSpeed = 0.45;
controls.zoomSpeed = 0.9;
controls.enabled = false;

const clock = new SimClock((i) => ui.setSpeedIndex(i));

const manager = new THREE.LoadingManager();
const textures = new TextureStreamer(manager, r.gl);
textures.addScene(scene);
/** Screen pixels per radian at the centre of the view (focal length in device pixels). */
const pxPerRad = () => (window.innerHeight * r.pixelRatio) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
const system = new SolarSystem(textures, clock.days);
scene.add(system.group);
scene.add(createSky(textures, pxPerRad()));
const belt = new AsteroidBelt();
scene.add(belt.mesh);
const kuiper = new KuiperBelt();
scene.add(kuiper.points);

const sunLight = new THREE.PointLight(0xfff5ea, Math.PI, 0, 0);
scene.add(sunLight);
const ambient = new THREE.AmbientLight(0xb8c8ff, 0.05);
scene.add(ambient);

const director = new CameraDirector(camera, controls);
director.onFlight = (duration) => sound.whoosh(duration);

// ── Beyond the planets ──────────────────────────────────────────────────────────
// The Sun's label in a wider view goes one stop toward the Solar System.
const local = new LocalRealm(canvas, layer('#labels-local'), textures, pxPerRad(), {
  select: (id) => cosmos.select(id),
  sun: () => cosmos.sunClicked(),
});
const galaxy = new GalaxyRealm(canvas, layer('#labels-galaxy'), textures, pxPerRad(), {
  select: (id) => cosmos.select(id),
  sun: () => cosmos.sunClicked(),
});
for (const realm of [local, galaxy]) {
  r.addView(realm);
  textures.addScene(realm.scene);
}

// ── Interface & navigation ──────────────────────────────────────────────────────
/** Run a Solar System action, flying back into the system first if needed. */
const inSolar = (action: () => void) => (cosmos.realm === 'solar' && !cosmos.transitioning ? action() : cosmos.go('solar', action));

const ui = new UI({
  selectBody: (id) => inSolar(() => nav.focusBody(system.get(id))),
  selectSite: (bodyId, siteId) => {
    const b = system.get(bodyId);
    const s = b.def.sites.find((x) => x.id === siteId);
    if (s) inSolar(() => nav.focusSite(b, s));
  },
  selectRegion: (id) => inSolar(() => nav.focusRegion(REGIONS.find((reg) => reg.id === id)!)),
  hoverSite: (id) => (markers.hover.panel = id),
  goSystem: () => cosmos.home(),
  goBody: () => nav.focused && nav.focusBody(nav.focused),
  setSpeed: (i) => clock.setSpeed(i),
  setDate: (ms) => clock.setDate(ms),
  resetNow: () => clock.resetNow(),
  toggleLight: () => display.toggleLight(),
  setScale: (real) => display.setScale(real),
  toggleOrbits: () => display.toggleOrbits(),
  selectDeep: (id) => cosmos.select(id),
  goRealm: (realm) => cosmos.goRealm(realm),
});
ui.setSpeedIndex(clock.speedIndex);
const display = new Display(ui);

const markers = new Markers(scene, system, camera, {
  body: (b) => nav.focusBody(b),
  site: (b, s) => nav.focusSite(b, s),
  region: (reg) => nav.focusRegion(reg),
});
const nav = new Navigation({ system, director, camera, controls, ui, clock, display, markers });
const cosmos = new Cosmos({ view: solarView, director, controls, nav }, local, galaxy, ui, clock, canvas);
const input = bindInput({
  canvas, labelLayers: [layer('#labels'), layer('#labels-local'), layer('#labels-galaxy')], cosmos,
  nav, picker: new Picker(camera, system), markers, director, display, ui,
});

function applyLanguage() {
  markers.relang();
  ui.relang();
  if (cosmos.realm === 'solar') nav.refreshPanel();
  cosmos.relang();
}

window.addEventListener('resize', () => r.resize());

/** Map detail follows what the screen can show: re-evaluated five times a second. */
let streamTimer = 0;
function streamTextures(dt: number, solarShown: boolean) {
  streamTimer -= dt;
  if (streamTimer <= 0) {
    streamTimer = 0.2;
    textures.pxPerRad = pxPerRad();
    textures.calm = !director.flying && !cosmos.transitioning;
    if (solarShown) system.streamTextures(camera, textures.pxPerRad);
    textures.setNeed('sky', 2 * Math.PI * textures.pxPerRad);
  }
  textures.update(dt);
}

// ── Main loop ───────────────────────────────────────────────────────────────────
const timer = new THREE.Timer();
timer.connect(document);
let started = false;

function frame(now: number) {
  timer.update(now);
  const dt = Math.min(timer.getDelta(), 0.1);
  clock.step(dt);

  // The Solar System is simulated only while it is on screen.
  const solarShown = cosmos.visible('solar');
  if (solarShown) {
    if (stepScale(dt)) markers.placeRegions();
    system.focus = nav.focused;
    system.update(clock.days, clock.spinDays, dt);
    belt.update(clock.days);
    kuiper.update(clock.days);
    ambient.intensity += ((display.lightBoost ? 0.9 : 0.05) - ambient.intensity) * Math.min(1, dt * 4);
    system.setAmbient(ambient.intensity);
    scene.updateMatrixWorld();
    if (started) director.update(dt);
    nav.followScale();
    system.syncUniforms(timer.getElapsed(), camera);
    nav.frameFreeArea(dt);
    markers.update({
      mode: nav.mode, focused: nav.focused, focusedSite: nav.focusedSite, hovered: input.hovered(),
      showOrbits: display.showOrbits, flying: director.flying,
    });
    if (cosmos.realm === 'solar') nav.refreshLive(dt);
  }
  if (started) cosmos.update(dt);
  if (cosmos.realm === 'solar' && !cosmos.transitioning) {
    // Screen-space bloom would flood the frame when the Sun is large; fade it with apparent size.
    const sunAngular = system.get('sun').radius / camera.position.length();
    r.bloom.strength = THREE.MathUtils.lerp(0.75, 0.12, THREE.MathUtils.smoothstep(sunAngular, 0.04, 0.25));
  } else {
    r.bloom.strength = cosmos.bloomStrength();
  }
  const date = clock.date;
  ui.setDate(date);
  ui.setRealtime(clock.live);
  ui.setAccuracy(accuracyAt(date));

  quality.update(dt);
  streamTextures(dt, solarShown);
  const v = cosmos.views();
  r.render(v.a, v.b, v.mix);
  requestAnimationFrame(frame);
}

applyStatic();
applyLanguage();
detectSoftwareGL(r);
onLangChange(applyLanguage);

ui.loading(0);
manager.onProgress = (_url, loaded, total) => ui.loading(loaded / total);
manager.onLoad = () => {
  let compiled: Promise<unknown> = Promise.resolve();
  r.scenePass.withTarget(r.gl, () => {
    compiled = Promise.all([
      system.precompile(r.gl, scene, camera),
      // The wider views compile now too, not on the first trip out of the Solar System.
      r.gl.compileAsync(local.scene, local.camera),
      r.gl.compileAsync(galaxy.scene, galaxy.camera),
    ]);
  });
  textures.warmUp(() => r.render(solarView));
  textures.prewarm();
  compiled.finally(() => {
    ui.ready();
    started = true;
    camera.lookAt(0, 0, 0);
    nav.goSystem();
  });
};
requestAnimationFrame(frame);

// Dev-only handle for debugging from the browser console / automated checks.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__cosmic = {
    THREE, system, camera, controls, scale, scene, belt, kuiper, nav, clock, textures, cosmos, local, galaxy,
    renderer: r.gl, composer: r.composer, bloom: r.bloom, scenePass: r.scenePass,
  };
}
