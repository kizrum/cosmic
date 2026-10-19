/**
 * Consistency check of the compressed scene layout: run with `npm run check:layout`.
 * Verifies that compression keeps the true ordering and containment relations.
 */
import { BODIES, type BodyDef } from '../src/data/bodies';
import { AU_KM, daysFromDate, elementsAt, sceneDistance } from '../src/astro';
import {
  MOON_SYSTEM_SHARE, RING_OUTER, SUN_RADIUS, extentScale, layoutMoons, moonDistance, sceneRange, visualRadius,
} from '../src/scene/layout';

const d = daysFromDate(Date.now());
const lay = layoutMoons(BODIES, d);
let failures = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) failures++;
  console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`);
};
const f = (n: number, k = 2) => n.toFixed(k);

const helio = BODIES.filter((b) => b.orbit && b.group !== 'moon');
const planets = helio.filter((b) => b.group === 'planet').sort((a, b) => elementsAt(a.orbit!, d).a - elementsAt(b.orbit!, d).a);

console.log('\n1. Planet orbits: order, no overlaps, real ratios');
let prev: BodyDef | null = null;
for (const p of planets) {
  const [q, Q] = sceneRange(p, d);
  const a = elementsAt(p.orbit!, d).a;
  const R = visualRadius(p) * extentScale(p);
  console.log(`  ${p.id.padEnd(8)} a=${f(a, 3).padStart(7)} AU  scene ${f(q, 1)}–${f(Q, 1)}  radius ${f(R)}`);
  if (prev) {
    const [, pQ] = sceneRange(prev, d);
    ok(q > pQ, `${prev.id} aphelion < ${p.id} perihelion (gap ${f(q - pQ, 1)})`);
  } else {
    ok(q - R > SUN_RADIUS, `${p.id} stays clear of the Sun (${f(q - R - SUN_RADIUS, 1)} units)`);
  }
  prev = p;
}

console.log('\n2. Dwarf planets and belts');
const [, marsQ] = sceneRange(BODIES.find((b) => b.id === 'mars')!, d);
const [jupQ] = sceneRange(BODIES.find((b) => b.id === 'jupiter')!, d);
ok(sceneDistance(2.1) > marsQ && sceneDistance(3.3) < jupQ, `asteroid belt (${f(sceneDistance(2.1), 1)}–${f(sceneDistance(3.3), 1)}) between Mars and Jupiter`);
const ceres = sceneRange(BODIES.find((b) => b.id === 'ceres')!, d);
ok(ceres[0] > marsQ && ceres[1] < jupQ, `Ceres orbit (${f(ceres[0], 1)}–${f(ceres[1], 1)}) inside the belt zone`);
const [nepQ, nepA] = sceneRange(BODIES.find((b) => b.id === 'neptune')!, d);
for (const id of ['pluto', 'haumea', 'makemake', 'eris']) {
  const [q, Q] = sceneRange(BODIES.find((b) => b.id === id)!, d);
  const crosses = q < nepA;
  console.log(`  ${id.padEnd(8)} scene ${f(q, 1)}–${f(Q, 1)}${crosses ? '  (crosses Neptune’s orbit — true for Pluto)' : ''}`);
  if (id !== 'pluto') ok(q > nepQ, `${id} perihelion beyond Neptune’s perihelion`);
}

console.log('\n3. Moon systems');
for (const p of helio) {
  const moons = BODIES.filter((m) => m.parent === p.id).sort((a, b) => (a.id === 'moon' ? 0 : elementsAt(a.orbit!, d).a) - (b.id === 'moon' ? 0 : elementsAt(b.orbit!, d).a));
  if (!moons.length) continue;
  const R = visualRadius(p) * extentScale(p);
  const squeeze = lay.squeeze.get(p.id) ?? 1;
  const keep = lay.keep.get(p.id) ?? 2.5;
  const gap = lay.gap.get(p.id) ?? Infinity;
  const dist = (m: BodyDef, km: number) => moonDistance(p, km, squeeze, keep) * (lay.spread.get(m.id) ?? 1);
  console.log(`  ${p.name} (R ${f(R)}, squeeze ${f(squeeze)}, gap to neighbour ${Number.isFinite(gap) ? f(gap, 1) : '—'})`);
  let lastOuter = 0, lastId = '';
  const ringEdge = R * (RING_OUTER[p.id] ?? 1);
  for (const m of moons) {
    const k = m.id === 'moon' ? { a: 384_400, e: 0.0549 } : elementsAt(m.orbit!, d);
    const r = visualRadius(m) * extentScale(m);
    const peri = dist(m, k.a * (1 - k.e)), apo = dist(m, k.a * (1 + k.e));
    console.log(`     ${m.id.padEnd(10)} ${f(peri)}–${f(apo)} units (${f(peri / R)}–${f(apo / R)} R), body r ${f(r)}`);
    ok(peri - r > ringEdge, `${m.id} clear of ${p.id}${RING_OUTER[p.id] ? ' and its rings' : ''}`);
    if (lastId) ok(peri - r > lastOuter, `${lastId} and ${m.id} never touch (clearance ${f(peri - r - lastOuter)})`);
    lastOuter = apo + r;
    lastId = m.id;
  }
  if (Number.isFinite(gap)) ok(lastOuter <= gap * (MOON_SYSTEM_SHARE + 0.1), `system (${f(lastOuter, 1)}) within ~${MOON_SYSTEM_SHARE * 100} % of the gap (${f(gap * MOON_SYSTEM_SHARE, 1)})`);
}

console.log('\n4. Real-world ratios the compression cannot keep (for reference)');
const earthA = 1, venusPeri = elementsAt(BODIES.find((b) => b.id === 'venus')!.orbit!, d).a;
console.log(`  Earth–Moon / closest Earth–Venus: real ${f(384_400 / ((earthA - venusPeri) * AU_KM) * 100, 1)} %,` +
  ` scene ${f((moonDistance(BODIES.find((b) => b.id === 'earth')!, 384_400, lay.squeeze.get('earth')!, lay.keep.get('earth')) * (lay.spread.get('moon') ?? 1)) / (sceneDistance(1) - sceneDistance(venusPeri)) * 100, 1)} %`);
console.log(`  Sun radius / Earth orbit: real ${f(696_340 / AU_KM * 100, 2)} %, scene ${f(SUN_RADIUS / sceneDistance(1) * 100, 1)} %`);

console.log(failures ? `\n✗ ${failures} problem(s)` : '\n✓ all relations hold');
process.exit(failures ? 1 : 0);
