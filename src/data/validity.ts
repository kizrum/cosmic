/**
 * Years in which the ephemerides are checked against JPL Horizons (npm run check:astro).
 * Outside them the positions drift and the app says so.
 *
 *  - planets: JPL "Approximate Positions of the Planets", table 1 is fitted to 1800–2050.
 *    The Moon (Meeus), Haumea, Makemake and Eris stay within 0.1° over the same years.
 *  - fitted: the other moons, Ceres and Pluto use mean elements fitted at the 2026 epoch.
 *    Perturbations (Jupiter for Ceres, Neptune for Pluto, resonances such as Mimas–Tethys)
 *    make them drift by degrees within decades, so only ±5 years are claimed.
 */
export const RANGES = {
  planets: [1800, 2050],
  fitted: [2021, 2031],
} as const satisfies Record<string, readonly [number, number]>;

/** Bodies on fitted elements whose accuracy is limited to RANGES.fitted. */
export const usesFittedRange = (def: { id: string; group: string }) => def.group === 'moon' ? def.id !== 'moon' : def.id === 'ceres' || def.id === 'pluto';

export type Accuracy = 'ok' | 'moons' | 'all';

/** What the model can still vouch for at a UTC instant. */
export function accuracyAt(date: Date): Accuracy {
  const y = date.getUTCFullYear();
  if (y < RANGES.planets[0] || y > RANGES.planets[1]) return 'all';
  if (y < RANGES.fitted[0] || y > RANGES.fitted[1]) return 'moons';
  return 'ok';
}
