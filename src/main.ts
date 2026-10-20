import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SolarSystem } from './scene/SolarSystem';
import { AsteroidBelt, KuiperBelt, createSky } from './scene/Environment';
import { Renderer } from './scene/renderer';
import { AdaptiveQuality, detectSoftwareGL } from './scene/quality';
import { Markers } from './scene/markers';
import { scale, stepScale } from './scene/scale';
import { CameraDirector } from './CameraDirector';
import { SimClock } from './clock';
import { Display } from './display';
import { Navigation } from './navigation';
import { Picker } from './picking';
import { bindInput } from './input';
import { UI } from './ui/UI';
import * as sound from './ui/sound';
import { REGIONS } from './data/regions';
import { accuracyAt } from './data/validity';
import { applyStatic, onLangChange } from './i18n';

// ── Renderer & scene ────────────────────────────────────────────────────────────
const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const labelLayer = document.querySelector<HTMLElement>('#labels')!;
const scene = new THREE.Scene();
// Far plane covers true-scale distances (Eris at aphelion ≈ 2.3 million Earth radii).
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.0005, 5e7);
camera.position.set(0, 2200, 3600);
const r = new Renderer(canvas, labelLayer, scene, camera);
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
const system = new SolarSystem(manager, r.gl.capabilities.getMaxAnisotropy(), clock.days);
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
director.onFlight = (duration) => sound.whoosh(duration);

// ── Interface & navigation ──────────────────────────────────────────────────────
const ui = new UI({
  selectBody: (id) => nav.focusBody(system.get(id)),
  selectSite: (bodyId, siteId) => {
    const b = system.get(bodyId);
    const s = b.def.sites.find((x) => x.id === siteId);
    if (s) nav.focusSite(b, s);
  },
  selectRegion: (id) => nav.focusRegion(REGIONS.find((reg) => reg.id === id)!),
  hoverSite: (id) => (markers.hover.panel = id),
  goSystem: () => nav.goSystem(),
  goBody: () => nav.focused && nav.focusBody(nav.focused),
  setSpeed: (i) => clock.setSpeed(i),
  setDate: (ms) => clock.setDate(ms),
  resetNow: () => clock.resetNow(),
  toggleLight: () => display.toggleLight(),
  setScale: (real) => display.setScale(real),
  toggleOrbits: () => display.toggleOrbits(),
});
ui.setSpeedIndex(clock.speedIndex);
const display = new Display(ui);

const markers = new Markers(scene, system, camera, {
  body: (b) => nav.focusBody(b),
  site: (b, s) => nav.focusSite(b, s),
  region: (reg) => nav.focusRegion(reg),
});
const nav = new Navigation({ system, director, camera, controls, ui, clock, display, markers });
const input = bindInput({ canvas, labelLayer, nav, picker: new Picker(camera, system), markers, director, display, ui });

function applyLanguage() {
  markers.relang();
  ui.relang();
  nav.refreshPanel();
}

window.addEventListener('resize', () => r.resize());

// ── Main loop ───────────────────────────────────────────────────────────────────
const timer = new THREE.Timer();
timer.connect(document);
let started = false;

function frame(now: number) {
  timer.update(now);
  const dt = Math.min(timer.getDelta(), 0.1);
  clock.step(dt);

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
  // Screen-space bloom would flood the frame when the Sun is large; fade it with apparent size.
  const sunAngular = system.get('sun').radius / camera.position.length();
  r.bloom.strength = THREE.MathUtils.lerp(0.75, 0.12, THREE.MathUtils.smoothstep(sunAngular, 0.04, 0.25));
  nav.frameFreeArea(dt);
  markers.update({
    mode: nav.mode, focused: nav.focused, focusedSite: nav.focusedSite, hovered: input.hovered(),
    showOrbits: display.showOrbits, flying: director.flying,
  });
  nav.refreshLive(dt);
  const date = clock.date;
  ui.setDate(date);
  ui.setRealtime(clock.live);
  ui.setAccuracy(accuracyAt(date));

  quality.update(dt);
  r.render();
  requestAnimationFrame(frame);
}

applyStatic();
applyLanguage();
detectSoftwareGL(r);
onLangChange(applyLanguage);

ui.loading(0);
manager.onProgress = (_url, loaded, total) => ui.loading(loaded / total);
manager.onLoad = () => {
  ui.ready();
  started = true;
  camera.lookAt(0, 0, 0);
  nav.goSystem();
};
requestAnimationFrame(frame);

// Dev-only handle for debugging from the browser console / automated checks.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__cosmic = {
    system, camera, controls, scale, scene, belt, kuiper, nav, clock,
    renderer: r.gl, composer: r.composer, bloom: r.bloom, scenePass: r.scenePass,
  };
}
