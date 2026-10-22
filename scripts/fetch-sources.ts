/**
 * Downloads the full-resolution inputs of the asset builds into textures-src/ (not in git):
 * run with `npm run fetch:sources`, then `npm run build:textures` and `npm run build:stars`.
 *
 *  - Solar System Scope 8K maps (CC BY 4.0, https://www.solarsystemscope.com/textures/)
 *  - HYG star database v4.1 (CC BY-SA 4.0, https://github.com/astronexus/HYG-Database)
 *  - face-on Milky Way, NASA/JPL-Caltech/R. Hurt (PIA10748, https://images.nasa.gov)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const SSS = ['8k_mercury.jpg', '8k_venus_surface.jpg', '8k_earth_daymap.jpg', '8k_earth_nightmap.jpg', '8k_earth_clouds.jpg',
  '8k_earth_specular_map.tif', '8k_moon.jpg', '8k_mars.jpg'];
const FILES: [string, string, Record<string, string>?][] = [
  // The site serves downloads only to requests coming from its texture page.
  ...SSS.map((f): [string, string, Record<string, string>] => [f, `https://www.solarsystemscope.com/textures/download/${f}`, { Referer: 'https://www.solarsystemscope.com/textures/' }]),
  ['hygdata_v41.csv', 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv'],
  ['PIA10748.jpg', 'https://images-assets.nasa.gov/image/PIA10748/PIA10748~orig.jpg'],
];

mkdirSync('textures-src', { recursive: true });
for (const [name, url, headers] of FILES) {
  const path = `textures-src/${name}`;
  if (existsSync(path)) {
    console.log(`  ${name}: already there`);
    continue;
  }
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', ...headers } });
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || type.includes('html')) throw new Error(`${name}: HTTP ${res.status} ${type}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  console.log(`  ${name}: ok`);
}
