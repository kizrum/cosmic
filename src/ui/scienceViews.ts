import type { BodyDef } from '../data/bodies';
import { GAS_COLOR, MATERIAL_COLOR, type Science } from '../data/science';
import { fmtNum, t } from '../i18n';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const num = (n: number, digits = 2) =>
  fmtNum(n, { maximumFractionDigits: n < 0.1 ? 4 : n < 10 ? digits : 0 });

/** Percentages keep their meaningful decimals: 95,1 · 2,59 · 0,042. */
const pct = (p: number) => fmtNum(p, { maximumFractionDigits: p >= 10 ? 1 : p >= 1 ? 2 : 4 });

const EARTH_R = 6371;

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
