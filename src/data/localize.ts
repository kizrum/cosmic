/**
 * Localised views of the content. Russian data is the source; for English, the overlays in
 * ./en replace the text fields while keeping ids, numbers and geometry from the source.
 */
import { lang } from '../i18n';
import { BODIES, bodyById, type BodyDef } from './bodies';
import { CREDITS, NOTICES, type CreditGroup } from './credits';
import { REGIONS, type RegionDef } from './regions';
import { scienceOf, type Science } from './science';
import { EN_PLANETS } from './en/bodies';
import { EN_SATELLITES } from './en/satellites';
import { EN_GAS, EN_SCIENCE } from './en/science';
import { EN_CREDITS, EN_NOTICES, EN_REGIONS } from './en/misc';
import { DEEP, LEVEL_NAMES, STAR_NAMES, deepById, type DeepDef, type Level } from './deep';
import { EN_DEEP, EN_LEVEL_NAMES, EN_STAR_NAMES } from './en/deep';

const EN_BODIES = { ...EN_PLANETS, ...EN_SATELLITES };
const cache = new Map<string, unknown>();
const memo = <T>(key: string, make: () => T): T => {
  const k = `${lang}:${key}`;
  if (!cache.has(k)) cache.set(k, make());
  return cache.get(k) as T;
};

export function bodyL(def: BodyDef): BodyDef {
  if (lang === 'ru') return def;
  const en = EN_BODIES[def.id];
  if (!en) return def;
  return memo(`body:${def.id}`, () => ({
    ...def,
    name: en.name,
    kind: en.kind,
    description: en.description,
    facts: en.facts,
    note: def.note ? (en.note ?? def.note) : undefined,
    sites: def.sites.map((s) => {
      const es = en.sites?.[s.id];
      return es ? { ...s, name: es.name, kind: es.kind, description: es.description, facts: es.facts ?? s.facts } : s;
    }),
  }));
}

export const bodyByIdL = (id: string) => bodyL(bodyById(id));
export const bodiesL = () => BODIES.map(bodyL);

export function scienceL(id: string): Science | undefined {
  const sci = scienceOf(id);
  if (!sci || lang === 'ru') return sci;
  const en = EN_SCIENCE[id];
  if (!en) return sci;
  return memo(`sci:${id}`, () => ({
    ...sci,
    features: en.features,
    tempNote: sci.tempNote ? en.tempNote ?? sci.tempNote : undefined,
    day: en.day ?? sci.day,
    year: en.year ?? sci.year,
    gasesTitle: sci.gasesTitle ? en.gasesTitle ?? sci.gasesTitle : undefined,
    gasesNote: sci.gasesNote ? en.gasesNote ?? sci.gasesNote : undefined,
    gases: sci.gases?.map((g) => ({ ...g, gas: EN_GAS[g.gas] ?? g.gas })),
    layers: sci.layers.map((l, i) => {
      const e = en.layers[i];
      if (e === undefined) return l;
      return typeof e === 'string' ? { ...l, name: e } : { ...l, name: e[0], detail: e[1] };
    }),
  }));
}

export function regionL(r: RegionDef): RegionDef {
  if (lang === 'ru') return r;
  const en = EN_REGIONS[r.id];
  return en ? { ...r, ...en, latin: r.latin } : r;
}

export const regionsL = () => REGIONS.map(regionL);

export function deepL(id: string): DeepDef {
  const d = deepById(id);
  const en = lang === 'en' ? EN_DEEP[id] : undefined;
  return en ? { ...d, ...en, note: d.note ? en.note ?? d.note : undefined } : d;
}
export const deepsL = () => DEEP.map((d) => deepL(d.id));
export const levelName = (l: Level) => (lang === 'en' ? EN_LEVEL_NAMES : LEVEL_NAMES)[l];
/** Localised name and note of a nearby star (by Gliese id), if it has one. */
export const starInfoL = (gl: string) => (lang === 'en' ? EN_STAR_NAMES : STAR_NAMES)[gl];
export const creditsL = (): CreditGroup[] => (lang === 'ru' ? CREDITS : EN_CREDITS);
export const noticesL = () => (lang === 'ru' ? NOTICES : EN_NOTICES);
