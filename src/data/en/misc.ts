/** English overlay for regions, credits and notices. */
import type { CreditGroup } from '../credits';

export const EN_REGIONS: Record<string, { name: string; kind: string; description: string; facts: [string, string][] }> = {
  'asteroid-belt': {
    name: 'Asteroid belt', kind: 'Region of small bodies',
    facts: [
      ['Location', '2.1–3.3 AU, between Mars and Jupiter'],
      ['Total mass', '≈ 3 % of the Moon’s mass'],
      ['Largest bodies', 'Ceres, Vesta, Pallas, Hygiea'],
      ['Known objects', 'more than 1 million'],
      ['Typical spacing of large ones', '≈ 1 million km'],
    ],
    description:
      'It is not the wreck of a shattered planet: Jupiter’s gravity kept the material here from gathering into a single body. The belt has empty “Kirkwood gaps” at distances where the orbital period resonates with Jupiter’s as 3:1, 5:2, 7:3 and 2:1; the resonance pumps up the orbits and sweeps those zones clear. The gaps are reproduced in this model. The inner belt is richer in stony S-type asteroids, the outer in dark carbonaceous C-types. Dawn explored Vesta and Ceres, Lucy has visited belt asteroids, and the Psyche mission is on its way to the metallic asteroid of the same name.',
  },
  'kuiper-belt': {
    name: 'Kuiper belt', kind: 'Trans-Neptunian region',
    facts: [
      ['Location', '≈ 30–50 AU'],
      ['Bodies larger than 100 km', 'estimated over 100,000'],
      ['Largest', 'Pluto, Haumea, Makemake'],
      ['Farthest object explored', 'Arrokoth (New Horizons, 2019)'],
    ],
    description:
      'The remains of the protoplanetary disc beyond Neptune: tens of thousands of icy bodies and the source of short-period comets. Many objects, like Pluto (the “plutinos”), are in a 3:2 resonance with Neptune, making two orbits for every three of Neptune’s. On 1 January 2019 New Horizons flew past Arrokoth, a pristine “snowman” of two stuck-together bodies unchanged since the birth of the Solar System. Eris belongs to the scattered disc — more elongated orbits flung out by Neptune.',
  },
};

const CC_BY_4 = 'https://creativecommons.org/licenses/by/4.0/';
const CC_BY_SA_3 = 'https://creativecommons.org/licenses/by-sa/3.0/';
const NASA_PD = 'Public domain (NASA material). Use does not imply NASA endorsement.';

export const EN_CREDITS: CreditGroup[] = [
  {
    title: 'Maps that require attribution',
    entries: [
      {
        what: 'Sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn and its rings, Uranus, Neptune, star field',
        author: 'Solar System Scope (INOVE), based on NASA data',
        source: 'https://www.solarsystemscope.com/textures/',
        licence: 'CC BY 4.0',
        licenceUrl: CC_BY_4,
        changes:
          'Resolution reduced (to 4096 px); Milky Way brightness and contrast raised in the star-field panorama; Earth cloud map converted to greyscale; Venus surface map rotated by 180° to match the IAU coordinate system; Neptune’s colour muted following Irwin et al., 2024.',
      },
      {
        what: 'Phobos',
        author: 'Askaniy Anpilogov, Phil Stooke',
        source: 'https://www.deviantart.com/askaniy/art/Phobos-Texture-Map-784146561',
        licence: 'CC BY-SA 3.0',
        licenceUrl: CC_BY_SA_3,
        changes: 'Resolution reduced to 2048 × 1024 px. The modified map is distributed under the same terms (CC BY-SA 3.0).',
      },
      {
        what: 'Deimos',
        author: 'Askaniy Anpilogov, John van Vliet',
        source: 'https://www.deviantart.com/askaniy/art/Deimos-Texture-Map-784881224',
        licence: 'CC BY-SA 3.0',
        licenceUrl: CC_BY_SA_3,
        changes: 'Resolution reduced to 2048 × 1024 px. The modified map is distributed under the same terms (CC BY-SA 3.0).',
      },
      {
        what: 'Ganymede',
        author: 'Björn Jónsson (from NASA Voyager and Galileo images)',
        source: 'https://bjj.mmedia.is/data/planetary_maps.html',
        licence: 'Use with attribution',
        changes: 'Scaled to 2048 × 1024 px, longitudes shifted by 180°.',
      },
    ],
  },
  {
    title: 'NASA and USGS maps',
    entries: [
      { what: 'Io, Europa, Callisto', author: 'NASA/JPL/USGS (Galileo, Voyager)', licence: NASA_PD },
      { what: 'Mimas, Tethys, Rhea, Titan', author: 'NASA/JPL-Caltech/Space Science Institute (Cassini)', licence: NASA_PD },
      { what: 'Enceladus, Dione, Iapetus', author: 'NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute', licence: NASA_PD },
      { what: 'Miranda, Ariel, Umbriel, Titania, Oberon', author: 'NASA/JPL/USGS (Voyager 2)', licence: NASA_PD },
      { what: 'Triton', author: 'NASA/JPL/USGS/Lunar and Planetary Institute (Voyager 2)', licence: NASA_PD },
      { what: 'Pluto, Charon', author: 'NASA/JHUAPL/SwRI (New Horizons)', licence: NASA_PD },
      { what: 'Ceres', author: 'NASA/JPL-Caltech/UCLA/MPS/DLR/IDA (Dawn)', licence: NASA_PD },
    ],
  },
  {
    title: 'Data',
    entries: [
      { what: 'Planetary orbits', author: 'E. M. Standish, JPL — “Approximate Positions of the Planets”', licence: 'Scientific data' },
      { what: 'Orbits of moons and dwarf planets', author: 'JPL Horizons System, NASA/JPL Solar System Dynamics', licence: 'Scientific data' },
      { what: 'Axis orientation and rotation', author: 'IAU Working Group on Cartographic Coordinates and Rotational Elements', licence: 'Scientific data' },
      { what: 'Position of the Moon', author: 'J. Meeus, “Astronomical Algorithms”', licence: 'Scientific method' },
    ],
  },
  {
    title: 'Software and fonts',
    entries: [
      { what: 'three.js', author: 'Copyright © 2010–2025 three.js authors', licence: 'MIT', licenceUrl: 'https://github.com/mrdoob/three.js/blob/dev/LICENSE' },
      { what: 'Exo 2 font', author: 'Copyright 2013 The Exo 2 Project Authors', licence: 'SIL Open Font License 1.1', licenceUrl: 'https://openfontlicense.org' },
      { what: 'JetBrains Mono font', author: 'Copyright 2020 The JetBrains Mono Project Authors', licence: 'SIL Open Font License 1.1', licenceUrl: 'https://openfontlicense.org' },
    ],
  },
];

export const EN_NOTICES = [
  'Body sizes and the distances between them are compressed: at true scale the planets would be invisible. Directions, positions for the chosen date, axial tilts and rotation follow scientific data.',
  'Unimaged areas of Uranus’s moons, Triton, Pluto and Charon are filled in schematically. The colouring of Eris, Makemake and Haumea is schematic: they have never been imaged up close.',
  'NASA material is used without any endorsement by NASA.',
];

/** Time-warp preset titles (labels are short and shared). */
export const EN_TIME = [
  ['❚❚', 'Paused'],
  ['1×', 'Real time'],
  ['1 h/s', '1 hour per second'],
  ['1 d/s', '1 day per second (planet spin simplified)'],
  ['1 wk/s', '1 week per second (planet spin simplified)'],
  ['1 mo/s', '1 month per second (planet spin simplified)'],
  ['1 yr/s', '1 year per second (planet spin simplified)'],
];
