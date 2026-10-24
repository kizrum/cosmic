/** Building blocks of the info panel: live grid, headline tiles, grouped figures, timeline. */
import type { BodyDef } from '../data/bodies';
import type { Milestone } from '../data/profiles';
import type { Science } from '../data/science';
import { fmtNum, t } from '../i18n';

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const num = (n: number, digits = 2) => fmtNum(n, { maximumFractionDigits: n < 0.1 ? 4 : n < 10 ? digits : 0 });

const EARTH_R = 6371;
const EARTH_G = 9.81;

// ── Live values ────────────────────────────────────────────────────────────────

export type LiveIcon = 'dist' | 'signal' | 'sun' | 'phase' | 'sky' | 'ring' | 'clock' | 'speed' | 'star' | 'light' | 'info';

export interface LiveStat {
  label: string;
  value: string;
  /** Secondary detail shown after the label (units in other terms, a clarification). */
  sub?: string;
  icon?: LiveIcon;
}

const svg = (body: string) =>
  `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const ICONS: Record<LiveIcon, string> = {
  dist: svg('<path d="M1.5 8h13M4.5 5 1.5 8l3 3M11.5 5l3 3-3 3"/>'),
  signal: svg('<path d="M8 9.5V15M5.5 15h5"/><circle cx="8" cy="7.5" r="1.2"/><path d="M5.2 4.8a3.9 3.9 0 0 0 0 5.4M10.8 4.8a3.9 3.9 0 0 1 0 5.4M3 2.6a7 7 0 0 0 0 9.8M13 2.6a7 7 0 0 1 0 9.8"/>'),
  sun: svg('<circle cx="8" cy="8" r="2.8"/><path d="M8 1.2v1.8M8 13v1.8M1.2 8H3M13 8h1.8M3.2 3.2l1.3 1.3M11.5 11.5l1.3 1.3M3.2 12.8l1.3-1.3M11.5 4.5l1.3-1.3"/>'),
  phase: svg('<circle cx="8" cy="8" r="6.3"/><path d="M8 1.7a6.3 6.3 0 0 1 0 12.6 3.6 6.3 0 0 0 0-12.6z" fill="currentColor"/>'),
  sky: svg('<path d="M1.2 8S3.8 3.2 8 3.2 14.8 8 14.8 8 12.2 12.8 8 12.8 1.2 8 1.2 8z"/><circle cx="8" cy="8" r="2.1"/>'),
  ring: svg('<circle cx="8" cy="8" r="3.2"/><ellipse cx="8" cy="8" rx="7" ry="2.4" transform="rotate(-18 8 8)"/>'),
  clock: svg('<circle cx="8" cy="8" r="6.3"/><path d="M8 4.2V8l2.6 1.6"/>'),
  speed: svg('<path d="M2 11.5a6 6 0 1 1 12 0"/><path d="M8 11.5l3-4"/>'),
  star: svg('<path d="M8 1.5l1.9 4.2 4.6.5-3.4 3.1 1 4.5L8 11.5 3.9 13.8l1-4.5L1.5 6.2l4.6-.5z"/>'),
  light: svg('<path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3"/><circle cx="8" cy="8" r="2"/>'),
  info: svg('<circle cx="8" cy="8" r="6.3"/><path d="M8 7.2v4M8 4.8v.1"/>'),
};

const liveCell = (s: LiveStat) =>
  `<div class="nc">${ICONS[s.icon ?? 'info']}<div><div class="nv">${esc(s.value)}</div><div class="nl">${esc(liveLabel(s))}</div></div></div>`;

export const liveLabel = (s: LiveStat) => (s.sub ? `${s.label} · ${s.sub}` : s.label);

/** "Now" block: values in a 2-column grid; an odd last cell spans the row. */
export function liveGrid(stats: LiveStat[]) {
  if (!stats.length) return '';
  return `<div class="now-head"><span><i></i>${t('nowTitle')}</span></div><div class="now${stats.length % 2 ? ' odd' : ''}">${stats.map(liveCell).join('')}</div>`;
}

// ── Header ─────────────────────────────────────────────────────────────────────

export function panelHeader(o: { kind: string; color: string; place?: string; title: string; latin?: string; tagline?: string; coord?: string }) {
  const latin = o.latin && o.latin.toLowerCase() !== o.title.toLowerCase() ? `<small>${esc(o.latin)}</small>` : '';
  return `<div class="kind" style="--c:${o.color}">${esc(o.kind)}${o.place ? `<span class="place">${esc(o.place[0].toUpperCase() + o.place.slice(1))}</span>` : ''}</div>
    <h2>${esc(o.title)}${latin}</h2>
    ${o.coord ? `<div class="coord">${o.coord}</div>` : ''}
    ${o.tagline ? `<p class="tagline">${esc(o.tagline)}</p>` : ''}`;
}

// ── Description: a short lead, the rest behind "More" ──────────────────────────

const SENTENCE = /(?<=[.!?…])\s+(?=[«"(A-ZА-ЯЁ0-9])/u;

export function leadText(text: string, note?: string) {
  const parts = text.split(SENTENCE);
  const lead = parts.slice(0, 2).join(' ');
  const rest = parts.slice(2).join(' ');
  const noteHtml = note ? `<p class="note-data">${esc(note)}</p>` : '';
  if (!rest) return `<p class="desc">${esc(lead)}</p>${noteHtml}`;
  return `<p class="desc">${esc(lead)}</p>
    <p class="desc desc-more">${esc(rest)}</p>
    <button class="more" data-more><span class="m-open">${t('more')} ▾</span><span class="m-close">${t('less')} ▴</span></button>
    ${noteHtml}`;
}

export const funCard = (text?: string) =>
  text ? `<div class="fun"><span class="caps">${t('curious')}</span><p>${esc(text)}</p></div>` : '';

// ── Headline tiles ─────────────────────────────────────────────────────────────

/** Log scale centred on Earth: ×0.01 … ×100 → 0 … 100 %, Earth in the middle. */
const logPos = (ratio: number) => Math.max(2, Math.min(100, 50 + 25 * Math.log10(Math.max(ratio, 1e-6))));

const bar = (ratio: number) =>
  `<i class="meter"><u style="width:${logPos(ratio).toFixed(1)}%"></u><s style="left:50%"><b>⊕</b></s></i>`;

/** Temperature → colour: deep blue (−270 °C) through white (≈0 °C) to orange-red (hot). */
function tempColor(c: number) {
  const stops: [number, [number, number, number]][] = [
    [-270, [70, 110, 255]], [-150, [110, 190, 255]], [0, [235, 245, 255]], [100, [255, 205, 120]], [500, [255, 110, 60]],
  ];
  const v = Math.max(-270, Math.min(500, c));
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    const [t0, c0] = stops[i - 1];
    if (v <= t1) {
      const k = (v - t0) / (t1 - t0);
      return `rgb(${c0.map((x, j) => Math.round(x + (c1[j] - x) * k)).join(',')})`;
    }
  }
  return 'rgb(255,110,60)';
}
const tempPos = (c: number) => Math.max(0, Math.min(100, ((c + 273) / 773) * 100));
const signed = (c: number) => `${c > 0 ? '+' : ''}${num(c, 0)}`;

const sig2 = (n: number) => fmtNum(n, { maximumSignificantDigits: 2 });

function sizeLine(ratio: number) {
  if (ratio > 0.8 && ratio < 1.25) return t('aboutEarthSize');
  return ratio > 1 ? t('holdsEarths', sig2(ratio ** 3)) : t('earthHolds', sig2(1 / ratio ** 3));
}

function weightLine(g: number) {
  const kg = (70 * g) / EARTH_G;
  if (kg >= 1) return t('weighKg', fmtNum(kg, { maximumFractionDigits: kg < 10 ? 1 : 0 }));
  return t('weighG', fmtNum(Math.max(1, Math.round(kg * 1000))));
}

/** Four headline numbers, each compared with Earth. */
export function overviewTiles(b: BodyDef, sci: Science) {
  const tiles: string[] = [];
  const ratio = b.radiusKm / EARTH_R;
  if (b.id !== 'earth') {
    tiles.push(`<div class="stat"><span class="sl">${t('size')}</span>
      <b>${fmtNum(Math.round(b.radiusKm))}<small> ${t('km')}</small></b>
      <span class="cmp">${t('timesEarth', ratio >= 0.1 ? num(ratio) : num(ratio, 3))}</span>
      ${bar(ratio)}<em>${sizeLine(ratio)}</em></div>`);
  } else {
    tiles.push(`<div class="stat"><span class="sl">${t('size')}</span>
      <b>${fmtNum(Math.round(b.radiusKm))}<small> ${t('km')}</small></b><span class="cmp">${t('radiusWord')}</span>
      ${bar(1)}<em>${t('earthIsScale')}</em></div>`);
  }

  const gRatio = sci.gravity / EARTH_G;
  tiles.push(`<div class="stat"><span class="sl">${t('gravity')}</span>
    <b>${num(sci.gravity)}<small> ${t('ms2')}</small></b>
    <span class="cmp">${gRatio >= 0.01 ? num(gRatio) : num(gRatio, 4)} g</span>
    ${bar(gRatio)}<em>${weightLine(sci.gravity)}</em></div>`);

  const [tMin, tMax] = Array.isArray(sci.temp) ? sci.temp : [sci.temp, sci.temp];
  const tLabel = tMin === tMax ? signed(tMin) : `${signed(tMin)} … ${signed(tMax)}`;
  const left = tempPos(tMin), right = tempPos(tMax);
  tiles.push(`<div class="stat"><span class="sl">${t('temperature')}</span>
    <b style="color:${tempColor((tMin + tMax) / 2)}">${tLabel}<small> °C</small></b>
    <span class="cmp">${t('earthTemp')}</span>
    <i class="meter temp"><u style="left:${left.toFixed(1)}%;width:${Math.max(2, right - left).toFixed(1)}%"></u><s style="left:${tempPos(15).toFixed(1)}%"><b>⊕</b></s></i>
    ${sci.tempNote ? `<em>${esc(sci.tempNote)}</em>` : ''}</div>`);

  if (sci.day || sci.year) {
    const yearLabel = b.group === 'moon' ? t('orbitLen') : t('yearLen');
    tiles.push(`<div class="stat"><span class="sl">${sci.day && sci.year ? `${t('dayLen')} · ${yearLabel}` : sci.day ? t('dayLen') : yearLabel}</span>
      ${sci.day ? `<b class="two">${esc(sci.day)}</b>` : ''}
      ${sci.year ? `<b class="two">${esc(sci.year)}</b>` : ''}</div>`);
  }
  if (tiles.length % 2) tiles[tiles.length - 1] = tiles[tiles.length - 1].replace('class="stat"', 'class="stat wide"');
  return `<div class="stats">${tiles.join('')}</div><p class="tiles-note">${t('earthMark')}</p>`;
}

// ── Grouped figures ────────────────────────────────────────────────────────────

type Group = 'size' | 'orbit' | 'spin' | 'surface' | 'other';
const GROUPS: Group[] = ['size', 'orbit', 'spin', 'surface', 'other'];
const GROUP_KEY = { size: 'grpSize', orbit: 'grpOrbit', spin: 'grpSpin', surface: 'grpSurface', other: 'grpOther' } as const;

const RULES: [Group, RegExp][] = [
  ['spin', /сутк|вращен|наклон оси|\bday\b|rotation|axial/i],
  ['orbit', /\bгод\b|^год|обращен|расстоян|орбит|\byear|orbit|distance/i],
  ['size', /радиус|масс|размер|плотн|radius|mass|size|dimension|densit/i],
  ['surface', /температур|атмосфер|давлен|состав|ветр|ускорен|гравитац|вулкан|кор[аы]|океан|магнит|альбедо|temperat|atmosph|pressure|composit|wind|gravity|volcan|crust|ocean|magnet|albedo/i],
];
const groupOf = (label: string): Group => RULES.find(([, re]) => re.test(label))?.[0] ?? 'other';

/** "3 389,5 км (0,53 Земли)" → value + a quieter note under it. */
function splitValue(v: string): [string, string] {
  const m = /^(.+?)\s*\(([^()]+)\)$/.exec(v);
  return m ? [m[1], m[2]] : [v, ''];
}

const row = (k: string, v: string) => {
  const [main, note] = splitValue(v);
  return `<div><dt>${esc(k)}</dt><dd>${esc(main)}${note ? `<small>${esc(note)}</small>` : ''}</dd></div>`;
};

/** Plain table of figures, values split into number and note. */
export const factsList = (facts: [string, string][]) => (facts.length ? `<dl class="facts">${facts.map(([k, v]) => row(k, v)).join('')}</dl>` : '');

/** Figures of a body in thematic groups; adds density and escape velocity from the science data. */
export function groupedFacts(facts: [string, string][], sci?: Science) {
  const rows = new Map<Group, [string, string][]>();
  for (const f of facts) {
    const g = groupOf(f[0]);
    rows.set(g, [...(rows.get(g) ?? []), f]);
  }
  if (sci) {
    if (!facts.some(([k]) => /плотн|densit/i.test(k))) {
      const water = sci.density < 1 ? t('lighterWater') : t('denserWater', num(sci.density, 1));
      rows.set('size', [...(rows.get('size') ?? []), [t('density'), `${num(sci.density)} ${t('gcm3')} (${water})`]]);
    }
    const esc2 = sci.escape < 1 ? `${num(sci.escape * 1000, 0)} ${t('ms')}` : `${num(sci.escape, 2)} ${t('kms')}`;
    rows.set('surface', [[t('escape'), `${esc2} (${t('escapeNote')})`], ...(rows.get('surface') ?? [])]);
  }
  return GROUPS.filter((g) => rows.get(g)?.length)
    .map((g) => `<h3>${t(GROUP_KEY[g])}</h3><dl class="facts">${rows.get(g)!.map(([k, v]) => row(k, v)).join('')}</dl>`)
    .join('');
}

// ── Timeline ───────────────────────────────────────────────────────────────────

export const timeline = (items: Milestone[]) =>
  items.length
    ? `<ol class="timeline">${items
        .map((i) => `<li><span class="when">${esc(i.when)}</span><b>${esc(i.name)}</b>${i.note ? `<span>${esc(i.note)}</span>` : ''}</li>`)
        .join('')}</ol>`
    : '';

/** Probe facts are dated milestones ("Launch" → "5 September 1977"): show them as a timeline. */
export const factsTimeline = (facts: [string, string][]) => timeline(facts.map(([k, v]) => ({ when: v, name: k, note: '' })));
