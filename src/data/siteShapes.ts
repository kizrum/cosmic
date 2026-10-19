import type { Site } from './bodies';

/**
 * Outline of a site on the surface (sizes in km along the surface).
 * circle: radius around the site (or around `center`, e.g. a pole);
 * ellipse: semi-axes a (along the azimuth) and b, azimuth in degrees from north;
 * band: a latitude band around the whole body; polygon: [lat, lon] vertices.
 */
export type SiteShape =
  | { type: 'circle'; r: number; center?: [number, number] }
  | { type: 'ellipse'; a: number; b: number; az: number }
  | { type: 'band'; from: number; to: number }
  | { type: 'polygon'; points: [number, number][] };

const circle = (r: number, center?: [number, number]): SiteShape => ({ type: 'circle', r, center });
const ellipse = (a: number, b: number, az = 90): SiteShape => ({ type: 'ellipse', a, b, az });

const SHAPES: Record<string, SiteShape> = {
  'mercury/caloris': circle(775),
  'mercury/rachmaninoff': circle(145),
  'mercury/hokusai': circle(48),
  'mercury/discovery-rupes': ellipse(325, 25, 30),
  'mercury/chao-meng-fu': circle(84),

  'venus/maxwell': ellipse(425, 260, 0),
  'venus/ishtar': ellipse(2800, 1000, 90),
  'venus/aphrodite': ellipse(5000, 1100, 90),
  'venus/maat': circle(200),
  'venus/venera13': circle(60),
  'venus/mead': circle(135),

  'earth/everest': circle(40),
  'earth/mariana': ellipse(300, 45, 20),
  'earth/chicxulub': circle(90),
  'earth/amazon': ellipse(1500, 1100, 90),
  'earth/baikonur': circle(40),
  'earth/vostok': circle(50),
  'earth/reef': ellipse(1150, 110, 150),

  'moon/apollo11': circle(15),
  'moon/tycho': circle(43),
  'moon/copernicus': circle(47),
  'moon/imbrium': circle(572),
  'moon/luna9': circle(15),
  'moon/shackleton': circle(11),
  'moon/change4': circle(93),

  'mars/olympus': circle(300),
  'mars/valles': ellipse(2000, 120, 95),
  'mars/gale': circle(77),
  'mars/jezero': circle(23),
  'mars/hellas': circle(1150),
  'mars/north-cap': circle(500, [88, 0]),
  'mars/zhurong': circle(30),

  'jupiter/grs': ellipse(8000, 5000, 90),
  'jupiter/oval-ba': ellipse(4000, 3000, 90),
  'jupiter/north-pole': circle(9000, [90, 0]),
  'jupiter/neb': { type: 'band', from: 7, to: 17 },
  'jupiter/galileo-probe': circle(300),

  'saturn/hexagon': { type: 'polygon', points: [0, 60, 120, 180, 240, 300].map((lon) => [77, lon - 180] as [number, number]) },
  'saturn/south-vortex': circle(4000, [-90, 0]),
  'saturn/great-white-spot': { type: 'band', from: 30, to: 40 },
  'saturn/grand-finale': circle(1000),

  'uranus/south-pole': circle(6000, [-90, 0]),
  'uranus/north-cap': circle(9000, [90, 0]),
  'uranus/dark-spot': ellipse(1500, 850, 90),

  'neptune/gds': ellipse(6500, 3300, 90),
  'neptune/scooter': ellipse(1500, 600, 90),
  'neptune/d2': circle(900),

  'phobos/stickney': circle(4.5),

  'io/pele': circle(700),
  'io/loki': circle(100),
  'io/tvashtar': circle(150),
  'europa/conamara': ellipse(50, 35, 0),
  'europa/pwyll': circle(22),
  'europa/thera': ellipse(70, 50, 0),
  'ganymede/galileo-regio': circle(1600),
  'ganymede/tros': circle(47),
  'ganymede/osiris': circle(54),
  'callisto/valhalla': circle(1900),
  'callisto/asgard': circle(800),

  'mimas/herschel': circle(70),
  'enceladus/tiger-stripes': circle(150, [-90, 0]),
  'tethys/odysseus': circle(222),
  'dione/wispy': ellipse(400, 250, 0),
  'rhea/inktomi': circle(24),
  'rhea/tirawa': circle(180),
  'titan/kraken': ellipse(600, 400, 20),
  'titan/ligeia': circle(220),
  'titan/huygens': circle(30),
  'titan/xanadu': ellipse(2200, 1300, 90),
  'titan/selk': circle(45),
  'iapetus/cassini-regio': ellipse(1100, 900, 90),
  'iapetus/ridge': ellipse(650, 20, 90),

  'miranda/verona': ellipse(40, 6, 0),
  'miranda/inverness': circle(100),
  'ariel/kachina': ellipse(310, 40, 90),
  'umbriel/wunda': circle(65),
  'titania/messina': ellipse(750, 50, 60),
  'oberon/hamlet': circle(103),
  'triton/south-cap': circle(1000, [-90, 0]),
  'triton/geysers': circle(150),
  'triton/cantaloupe': ellipse(500, 400, 0),
  'charon/mordor': circle(225, [90, 0]),
  'charon/vulcan': ellipse(400, 300, 90),

  'ceres/occator': circle(46),
  'ceres/ahuna': circle(10),
  'ceres/kerwan': circle(142),
  'pluto/sputnik': ellipse(525, 400, 0),
  'pluto/wright': circle(80),
  'pluto/cthulhu': ellipse(1500, 375, 90),
};

export const shapeOf = (bodyId: string, siteId: string): SiteShape | undefined => SHAPES[`${bodyId}/${siteId}`];

// ── Categories (colour coding of markers and outlines) ─────────────────────────
export interface SiteCategory {
  id: string;
  label: string;
  color: string;
}

export const CATEGORIES: SiteCategory[] = [
  { id: 'volcanic', label: 'Вулканизм', color: '#ff8a4c' },
  { id: 'impact', label: 'Ударные кратеры', color: '#9fb4ff' },
  { id: 'water', label: 'Вода и лёд', color: '#5fd6ff' },
  { id: 'atmosphere', label: 'Атмосфера', color: '#c79bff' },
  { id: 'mission', label: 'Миссии', color: '#6dffa8' },
  { id: 'terrain', label: 'Рельеф', color: '#ffc65c' },
];

const MISSION = /посад|марсоход|зонд|космодром|аппарат|станци|финал|гибел|цель|Huygens|Dragonfly/i;
const GIANTS = ['jupiter', 'saturn', 'uranus', 'neptune'];
const RULES: [string, RegExp][] = [
  // Lunar "seas" are solidified basalt lava, not water.
  ['volcanic', /вулкан|лав|гейзер|патер|лунное море/i],
  ['atmosphere', /циклон|шторм|вихр|ураган|облач|течени|дымк/i],
  ['water', /мор[ея]|океан|озер|лёд|ледник|шапк|риф|холода/i],
  ['impact', /кратер|бассейн/i],
];

const byId = (id: string) => CATEGORIES.find((c) => c.id === id)!;

export function categoryOf(site: Site, bodyId: string): SiteCategory {
  if (MISSION.test(site.kind) || MISSION.test(site.name)) return byId('mission');
  // Giant planets have no solid surface: everything there is weather.
  if (GIANTS.includes(bodyId) && !site.elevation) return byId('atmosphere');
  for (const text of [site.kind, site.name]) {
    const hit = RULES.find(([, re]) => re.test(text));
    if (hit) return byId(hit[0]);
  }
  return byId('terrain');
}
