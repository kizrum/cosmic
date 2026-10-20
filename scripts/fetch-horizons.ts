/**
 * Downloads reference positions from JPL Horizons into scripts/horizons-reference.json:
 * run with `npm run fetch:horizons` (needs network). `npm run check:astro` compares the
 * app's ephemerides against that file offline.
 *
 * Vectors are geometric, ecliptic J2000, at UT instants (the app's clock is UTC).
 * Planets and dwarf planets: heliocentric, AU. Moons: from the parent's centre, km.
 */
import { writeFileSync } from 'node:fs';
import { BODIES } from '../src/data/bodies';
import { RANGES, usesFittedRange } from '../src/data/validity';

const API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const J2000_JD = 2451545.0;

/** App body id → Horizons command and centre. */
const TARGETS: Record<string, { command: string; center: string }> = {
  mercury: { command: '199', center: '10' },
  venus: { command: '299', center: '10' },
  // JPL's approximate elements describe the Earth–Moon barycentre.
  earth: { command: '3', center: '10' },
  mars: { command: '4', center: '10' },
  jupiter: { command: '5', center: '10' },
  saturn: { command: '6', center: '10' },
  uranus: { command: '7', center: '10' },
  neptune: { command: '8', center: '10' },
  ceres: { command: '1;', center: '10' },
  pluto: { command: '999', center: '10' },
  haumea: { command: '136108;', center: '10' },
  makemake: { command: '136472;', center: '10' },
  eris: { command: '136199;', center: '10' },
  moon: { command: '301', center: '399' },
  phobos: { command: '401', center: '499' },
  deimos: { command: '402', center: '499' },
  io: { command: '501', center: '599' },
  europa: { command: '502', center: '599' },
  ganymede: { command: '503', center: '599' },
  callisto: { command: '504', center: '599' },
  mimas: { command: '601', center: '699' },
  enceladus: { command: '602', center: '699' },
  tethys: { command: '603', center: '699' },
  dione: { command: '604', center: '699' },
  rhea: { command: '605', center: '699' },
  titan: { command: '606', center: '699' },
  iapetus: { command: '608', center: '699' },
  miranda: { command: '705', center: '799' },
  ariel: { command: '701', center: '799' },
  umbriel: { command: '702', center: '799' },
  titania: { command: '703', center: '799' },
  oberon: { command: '704', center: '799' },
  triton: { command: '801', center: '899' },
  charon: { command: '901', center: '999' },
};

/** Sample instants (UTC) spread over the range in which a body's model claims accuracy. */
function samples(id: string): string[] {
  const [from, to] = usesFittedRange(BODIES.find((b) => b.id === id)!) ? RANGES.fitted : RANGES.planets;
  const out: string[] = [];
  const n = 6;
  for (let k = 0; k < n; k++) {
    const ms = Date.UTC(from, 0, 1) + ((Date.UTC(to, 11, 31) - Date.UTC(from, 0, 1)) * k) / (n - 1);
    // Round to the minute so the file stays readable.
    out.push(new Date(Math.round(ms / 60_000) * 60_000).toISOString().replace(':00.000Z', 'Z'));
  }
  return out;
}

export interface Sample {
  id: string;
  /** UTC instant, ISO 8601. */
  utc: string;
  /** Ecliptic J2000 vector: AU (heliocentric) or km (planetocentric). */
  xyz: [number, number, number];
}

async function fetchTarget(id: string): Promise<Sample[]> {
  const { command, center } = TARGETS[id];
  const times = samples(id);
  const jd = times.map((s) => (J2000_JD + (Date.parse(s) - Date.UTC(2000, 0, 1, 12)) / 86_400_000).toFixed(6));
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${command}'`,
    EPHEM_TYPE: 'VECTORS',
    CENTER: `'500@${center}'`,
    TLIST: jd.map((j) => `'${j}'`).join(' '),
    TIME_TYPE: 'UT',
    REF_PLANE: 'ECLIPTIC',
    REF_SYSTEM: 'ICRF',
    VEC_TABLE: '1',
    VEC_CORR: 'NONE',
    OUT_UNITS: center === '10' ? 'AU-D' : 'KM-S',
    CSV_FORMAT: 'YES',
  });
  const res = await fetch(`${API}?${params}`);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const { result } = (await res.json()) as { result: string };
  const body = result.split('$$SOE')[1]?.split('$$EOE')[0];
  if (!body) throw new Error(`${id}: no ephemeris in the response\n${result.slice(0, 2000)}`);
  const rows = body.trim().split('\n').map((line) => line.split(',').map((c) => c.trim()));
  if (rows.length !== times.length) throw new Error(`${id}: expected ${times.length} rows, got ${rows.length}`);
  return rows.map((r, i) => ({ id, utc: times[i], xyz: [Number(r[2]), Number(r[3]), Number(r[4])] }));
}

const all: Sample[] = [];
for (const id of Object.keys(TARGETS)) {
  process.stdout.write(`  ${id}…`);
  all.push(...(await fetchTarget(id)));
  console.log(' ok');
}
const file = new URL('./horizons-reference.json', import.meta.url);
// One sample per line: diffs of a re-fetch stay readable.
const source = 'JPL Horizons API (https://ssd.jpl.nasa.gov/horizons/), geometric vectors, ecliptic J2000';
const lines = all.map((s) => `    ${JSON.stringify(s)}`).join(',\n');
writeFileSync(file, `{\n  "source": "${source}",\n  "fetched": "${new Date().toISOString().slice(0, 10)}",\n  "samples": [\n${lines}\n  ]\n}\n`);
console.log(`\n✓ ${all.length} samples → scripts/horizons-reference.json`);
