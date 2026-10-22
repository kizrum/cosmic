/**
 * Cuts every surface map into resolution tiers (512, 1024, … up to its source width):
 * run with `npm run build:textures`. The app starts on the 512 px tier and streams larger
 * ones as a body grows on screen (src/scene/textures.ts).
 *
 * Sources: the full-resolution download in textures-src/ when there is one (see
 * scripts/fetch-textures.ts), otherwise the largest tier already in public/textures.
 * Writes public/textures/<name>.<width>.<ext> and src/data/textureTiers.ts.
 *
 * 8K tiers of JPEG maps are encoded as AVIF: at 1:1 they look the same as the JPEG (PSNR
 * 38–42 dB against it) at roughly 60 % of the size, and every current browser decodes them.
 */
import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

sharp.cache(false);

const PUB = 'public/textures';
const SRC = 'textures-src';
const TIERS = [512, 1024, 2048, 4096, 8192];
/** JPEG maps switch to AVIF from this width on (kept in sync with the app via textureTiers.ts). */
const AVIF_FROM = 8192;
const AVIF_QUALITY = 55;
/** File extension of a tier. */
const tierExt = (ext: string, w: number) => (ext === 'jpg' && w >= AVIF_FROM ? 'avif' : ext);

interface Spec {
  /** Path under public/textures, as the app refers to it. */
  name: string;
  /** Full-resolution source in textures-src/ (Solar System Scope, CC BY 4.0). */
  source?: string;
  /** Same processing as the shipped maps (see the credits). */
  grey?: boolean;
  rotate180?: boolean;
  /** Largest tier worth shipping. */
  max?: number;
  /** Ship only these tiers. */
  only?: number[];
  /** Keep just this many rows around the middle (the ring shader reads only v = 0.5). */
  strip?: number;
}

const SPECS: Spec[] = [
  { name: 'sun.jpg' },
  // Rarely seen up close (Venus's surface only under its clouds): 4096 px is enough.
  { name: 'mercury.jpg', source: '8k_mercury.jpg', max: 4096 },
  { name: 'venus_surface.jpg', source: '8k_venus_surface.jpg', rotate180: true, max: 4096 },
  { name: 'venus_atmosphere.jpg' },
  { name: 'earth_day.jpg', source: '8k_earth_daymap.jpg' },
  { name: 'earth_night.jpg', source: '8k_earth_nightmap.jpg' },
  { name: 'earth_clouds.jpg', source: '8k_earth_clouds.jpg', grey: true },
  // The glint map is subtle: 2048 px is as far as it visibly improves.
  { name: 'earth_specular.jpg', source: '8k_earth_specular_map.tif', grey: true, max: 2048 },
  { name: 'moon.jpg', source: '8k_moon.jpg' },
  { name: 'mars.jpg', source: '8k_mars.jpg' },
  { name: 'jupiter.jpg' },
  { name: 'saturn.jpg' },
  // A radial profile: one 8192 px strip is ~50 KB and needs no streaming.
  { name: 'saturn_ring.png', strip: 8, only: [8192] },
  { name: 'uranus.jpg' },
  { name: 'neptune.jpg' },
  { name: 'stars.jpg' },
  // Face-on Milky Way, NASA/JPL-Caltech/R. Hurt (PIA10748), 5600 px square.
  { name: 'milky_way.jpg', source: 'PIA10748.jpg', max: 4096 },
  ...readdirSync(join(PUB, 'moons'))
    .map((f) => f.replace(/\.\d+(\.\w+)$/, '$1'))
    .filter((f, i, all) => all.indexOf(f) === i)
    .map((f) => ({ name: `moons/${f}` })),
];

const split = (name: string) => {
  const dot = name.lastIndexOf('.');
  return { stem: name.slice(0, dot), ext: name.slice(dot + 1) };
};

/** Largest file already published for a map: an untiered original or its top tier. */
function publishedSource(name: string): string {
  const { stem, ext } = split(name);
  const plain = join(PUB, name);
  if (existsSync(plain)) return plain;
  for (const w of [...TIERS].reverse()) {
    for (const e of new Set([tierExt(ext, w), ext])) {
      const p = join(PUB, `${stem}.${w}.${e}`);
      if (existsSync(p)) return p;
    }
  }
  throw new Error(`no source for ${name}`);
}

const manifest: Record<string, number[]> = {};
for (const spec of SPECS) {
  const { stem, ext } = split(spec.name);
  const downloaded = spec.source && existsSync(join(SRC, spec.source)) ? join(SRC, spec.source) : null;
  const srcPath = downloaded ?? publishedSource(spec.name);
  // Read into memory first: the source may be one of the files about to be rewritten.
  let base = sharp(await sharp(srcPath, { limitInputPixels: false }).toBuffer(), { limitInputPixels: false });
  if (downloaded && spec.rotate180) base = base.rotate(180);
  if (spec.grey) base = base.toColourspace('b-w');
  if (spec.strip) {
    const { width: w0, height: h0 } = await base.metadata();
    if (h0! > spec.strip) base = sharp(await base.extract({ left: 0, top: Math.floor((h0! - spec.strip) / 2), width: w0!, height: spec.strip }).toBuffer());
  }
  const input = await base.raw().toBuffer({ resolveWithObject: true });
  const width = input.info.width;
  const tiers = (spec.only ?? TIERS).filter((w) => w <= Math.min(width, spec.max ?? Infinity));
  for (const w of tiers) {
    const out = tierExt(ext, w);
    const target = join(PUB, `${stem}.${w}.${out}`);
    // A published tier as its own source stays as it is: re-encoding would lose quality on every run.
    if (target === srcPath && !spec.strip) continue;
    const h = spec.strip ?? Math.round((input.info.height * w) / width);
    let img = sharp(input.data, { raw: input.info, limitInputPixels: false }).resize(w, h, { kernel: 'lanczos3' });
    img = out === 'png' ? img.png({ compressionLevel: 9 })
      : out === 'avif' ? img.avif({ quality: AVIF_QUALITY, effort: 4 })
      : img.jpeg({ quality: w <= 512 ? 82 : 87, mozjpeg: true });
    await img.toFile(target);
  }
  // Drop the untiered original and tiers no longer produced.
  if (existsSync(join(PUB, spec.name))) rmSync(join(PUB, spec.name));
  for (const w of TIERS) {
    for (const e of new Set([ext, 'avif'])) {
      if (!tiers.includes(w) || e !== tierExt(ext, w)) rmSync(join(PUB, `${stem}.${w}.${e}`), { force: true });
    }
  }
  manifest[spec.name] = tiers;
  console.log(`  ${spec.name.padEnd(26)} ${downloaded ? 'download ' : 'published'} ${width} px → ${tiers.join(', ')}`);
}

writeFileSync('src/data/textureTiers.ts', `// Generated by scripts/build-textures.ts: widths of the published tiers of each map.
/** JPEG maps are published as AVIF from this width on. */
export const AVIF_FROM = ${AVIF_FROM};

export const TEXTURE_TIERS: Record<string, readonly number[]> = {
${Object.entries(manifest).map(([k, v]) => `  '${k}': [${v.join(', ')}],`).join('\n')}
};
`);
console.log('✓ src/data/textureTiers.ts');
