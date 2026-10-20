/**
 * Quiet interface sounds, synthesised with Web Audio (no audio files).
 * The context is created lazily on the first user gesture, as browsers require.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lastTick = 0;

const STORE_KEY = 'cosmic.sound';
export let soundOn = (() => {
  try {
    return localStorage.getItem(STORE_KEY) !== '0';
  } catch {
    return true;
  }
})();

export function setSound(on: boolean) {
  soundOn = on;
  try {
    localStorage.setItem(STORE_KEY, on ? '1' : '0');
  } catch {
    /* keep in memory */
  }
}

function audio() {
  if (!soundOn) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** A short sine/triangle blip with a fast attack and exponential decay. */
function blip(freq: number, dur: number, vol: number, type: OscillatorType = 'sine', delay = 0, glide?: number) {
  const ac = audio();
  if (!ac || !master) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Hover over an interactive element. Throttled so sweeping the mouse is not noisy. */
export function tick() {
  const now = performance.now();
  if (now - lastTick < 60) return;
  lastTick = now;
  blip(2400, 0.035, 0.12, 'sine');
}

/** Button press / selection. */
export function select() {
  blip(880, 0.07, 0.35, 'triangle');
  blip(1320, 0.09, 0.25, 'triangle', 0.045);
}

/** Camera flight: a filtered noise swell. */
export function whoosh(duration = 2) {
  const ac = audio();
  if (!ac || !master) return;
  const t = ac.currentTime;
  const len = Math.max(0.6, Math.min(3.5, duration));
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * len), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(240, t);
  filter.frequency.exponentialRampToValueAtTime(1400, t + len * 0.45);
  filter.frequency.exponentialRampToValueAtTime(300, t + len);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.32, t + len * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(filter).connect(g).connect(master);
  src.start(t);
  src.stop(t + len);
}

/** Surface scan: a rising series of short pings. */
export function scan() {
  for (let i = 0; i < 4; i++) blip(1100 + i * 220, 0.06, 0.18, 'sine', i * 0.11);
  blip(1980, 0.22, 0.14, 'sine', 0.52, 2200);
}
