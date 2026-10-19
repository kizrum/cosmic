import type { BodyDef } from '../data/bodies';
import { GAS_COLOR, MATERIAL_COLOR, type Science } from '../data/science';
import { fmtNum, t } from '../i18n';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const num = (n: number, digits = 2) =>
  fmtNum(n, { maximumFractionDigits: n < 0.1 ? 4 : n < 10 ? digits : 0 });

/** Percentages keep their meaningful decimals: 95,1 · 2,59 · 0,042. */
const pct = (p: number) => fmtNum(p, { maximumFractionDigits: p >= 10 ? 1 : p >= 1 ? 2 : 4 });

const EARTH_R = 6371;
const EARTH_G = 9.81;

/** Temperature → colour: deep blue (−270 °C) through white (≈0 °C) to orange-red (hot). */
function tempColor(t: number) {
  const stops: [number, [number, number, number]][] = [
    [-270, [70, 110, 255]], [-150, [110, 190, 255]], [0, [235, 245, 255]], [100, [255, 205, 120]], [500, [255, 110, 60]],
  ];
  const c = Math.max(-270, Math.min(500, t));
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    const [t0, c0] = stops[i - 1];
    if (c <= t1) {
      const k = (c - t0) / (t1 - t0);
      return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',')})`;
    }
  }
  return 'rgb(255,110,60)';
}

/** Position of a temperature on the −273…+500 °C scale, %. */
const tempPos = (t: number) => Math.max(0, Math.min(100, ((t + 273) / 773) * 100));

export function featureChips(sci: Science) {
  return `<ul class="chips">${sci.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`;
}

function meter(fraction: number, color: string, marks?: number) {
  const w = Math.max(2, Math.min(100, fraction * 100));
  const mark = marks !== undefined ? `<s style="left:${Math.min(100, marks * 100)}%"></s>` : '';
  return `<i class="meter"><u style="width:${w}%;background:${color}"></u>${mark}</i>`;
}

/** Headline numbers as tiles, each with a visual comparison scale. */
export function statTiles(b: BodyDef, sci: Science) {
  const tiles: string[] = [];
  const g = sci.gravity / EARTH_G;
  tiles.push(`<div class="stat">
    <span class="sl">${t('gravity')}</span><b>${num(sci.gravity)} ${t('ms2')}</b>
    ${meter(Math.sqrt(sci.gravity / 25), '#7fe3ff', Math.sqrt(EARTH_G / 25))}
    <em>${g >= 0.01 ? `${num(g)} g` : `${num(g * 1000, 1)} ${t('thousandthG')}`} · ${t('gEarthMark')}</em></div>`);

  const [tMin, tMax] = Array.isArray(sci.temp) ? sci.temp : [sci.temp, sci.temp];
  const tLabel = tMin === tMax ? `${tMin > 0 ? '+' : ''}${num(tMin, 0)} °C` : `${num(tMin, 0)} … ${tMax > 0 ? '+' : ''}${num(tMax, 0)} °C`;
  const left = tempPos(tMin), right = tempPos(tMax);
  tiles.push(`<div class="stat">
    <span class="sl">${t('temperature')}</span><b style="color:${tempColor((tMin + tMax) / 2)}">${tLabel}</b>
    <i class="meter temp"><u style="left:${left}%;width:${Math.max(2, right - left)}%"></u><s style="left:${tempPos(15)}%"></s></i>
    <em>${esc(sci.tempNote ?? t('tempScale'))}</em></div>`);

  const water = sci.density < 1 ? t('lighterWater') : t('denserWater', num(sci.density, 1));
  tiles.push(`<div class="stat">
    <span class="sl">${t('density')}</span><b>${num(sci.density)} ${t('gcm3')}</b>
    ${meter(sci.density / 5.6, '#ffc65c', 1 / 5.6)}
    <em>${water} · ${t('waterMark')}</em></div>`);

  const esc2 = sci.escape < 1 ? `${num(sci.escape * 1000, 0)} ${t('ms')}` : `${num(sci.escape, 2)} ${t('kms')}`;
  tiles.push(`<div class="stat">
    <span class="sl">${t('escape')}</span><b>${esc2}</b>
    ${meter(Math.sqrt(sci.escape / 62), '#c79bff', Math.sqrt(11.19 / 62))}
    <em>${t('escapeNote')}</em></div>`);

  if (sci.day) tiles.push(`<div class="stat"><span class="sl">${t('dayLen')}</span><b>${esc(sci.day)}</b></div>`);
  if (sci.year) tiles.push(`<div class="stat"><span class="sl">${b.group === 'moon' ? t('orbitLen') : t('yearLen')}</span><b>${esc(sci.year)}</b></div>`);
  // An odd tile stretches across the row so the grid has no empty cell.
  if (tiles.length % 2) tiles[tiles.length - 1] = tiles[tiles.length - 1].replace('class="stat"', 'class="stat wide"');
  return `<div class="stats">${tiles.join('')}</div>`;
}

/** Interior cross-section, size comparison with Earth and atmospheric composition. */
export function structureView(b: BodyDef, sci: Science) {
  const R = 64;
  const rings = [...sci.layers]
    .reverse()
    .map((l) => `<circle cx="70" cy="70" r="${(l.to * R).toFixed(1)}" fill="${MATERIAL_COLOR[l.m]}" />`)
    .join('');
  // Cut-away quarter showing the layers as bands.
  const section = `<svg viewBox="0 0 140 140" class="xsec" aria-hidden="true">
    <circle cx="70" cy="70" r="${R + 3}" fill="none" stroke="${b.color}" stroke-opacity=".35" />
    ${rings}
    <path d="M70 70 L${70 + R + 4} 70 A${R + 4} ${R + 4} 0 0 0 70 ${70 - R - 4} Z" fill="rgba(4,9,16,.55)" />
  </svg>`;

  let prev = 0;
  const legend = sci.layers
    .map((l, i) => {
      const km = (l.to - prev) * b.radiusKm;
      prev = l.to;
      const rounded = fmtNum(km >= 100 ? Math.round(km / 10) * 10 : Math.round(km));
      const thick = km >= 1 ? (i === 0 ? t('radiusAbout', rounded) : t('thickAbout', rounded)) : '';
      return `<li><span class="sw" style="background:${MATERIAL_COLOR[l.m]}"></span>
        <div><b>${esc(l.name)}</b>${thick ? `<em>${thick}</em>` : ''}${l.detail ? `<small>${esc(l.detail)}</small>` : ''}</div></li>`;
    })
    .reverse()
    .join('');

  const ratio = b.radiusKm / EARTH_R;
  const big = Math.max(ratio, 1);
  const cmp = `<div class="compare">
    <svg viewBox="0 0 120 64" aria-hidden="true">
      <circle cx="${30}" cy="32" r="${Math.max(0.8, (28 * 1) / big)}" fill="#5aa9ff" />
      <circle cx="${88}" cy="32" r="${Math.max(0.8, (28 * ratio) / big)}" fill="${b.color}" />
    </svg>
    <div><b>${t('timesEarth', ratio >= 0.1 ? num(ratio) : num(ratio, 3))}</b><small>${t('sameScale', esc(b.name))}</small></div>
  </div>`;

  let gases = '';
  if (sci.gases?.length) {
    const measured = sci.gases.filter((g) => g.pct !== undefined);
    const total = measured.reduce((s, g) => s + g.pct!, 0);
    const bar = measured.length
      ? `<div class="gasbar">${measured
          .map((g) => `<span style="flex:${Math.max(g.pct! / total, 0.012)};background:${GAS_COLOR[g.gas] ?? '#8aa0b4'}" title="${esc(g.gas)}"></span>`)
          .join('')}</div>`
      : '';
    const rows = sci.gases
      .map((g) => `<li><span class="sw" style="background:${GAS_COLOR[g.gas] ?? '#8aa0b4'}"></span>${esc(g.gas)}<em>${g.pct !== undefined ? `${pct(g.pct)} %` : t('traces')}</em></li>`)
      .join('');
    gases = `<h3>${esc(sci.gasesTitle ?? t('atmosphere'))}</h3>${bar}<ul class="gases">${rows}</ul>
      ${sci.gasesNote ? `<p class="tip">${esc(sci.gasesNote)}</p>` : ''}`;
  } else if (b.group !== 'star') {
    gases = `<h3>${t('atmosphere')}</h3><p class="tip">${t('noAtmosphere')}</p>`;
  }

  return `${cmp}
    <h3>${t('interior')}${sci.layersModel ? ` <span class="model">${t('model')}</span>` : ''}</h3>
    <div class="structure">${section}<ul class="layers">${legend}</ul></div>
    <p class="tip">${t('layersTip', fmtNum(Math.round(b.radiusKm)))}</p>
    ${gases}`;
}
