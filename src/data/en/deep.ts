import type { Level } from '../deep';

export interface DeepEN {
  name: string;
  kind: string;
  description: string;
  facts: [string, string][];
  note?: string;
}

export const EN_LEVEL_NAMES: Record<Level, string> = { galaxy: 'Milky Way', stars: 'Solar neighbourhood', helio: 'Heliosphere' };

export const EN_DEEP: Record<string, DeepEN> = {
  heliosphere: {
    name: 'Heliosphere', kind: 'Bubble of the solar wind',
    description:
      'The solar wind — charged particles streaming out at 400–750 km/s — inflates a vast bubble around the Solar System. At the termination shock (about 90 AU) the wind abruptly slows, and at the heliopause (about 120 AU) its pressure is balanced by the interstellar medium. Beyond lies interstellar space. Both Voyagers have crossed the heliopause and sent back the first direct measurements from there.',
    facts: [
      ['Termination shock', 'Voyager 1 — December 2004, 94 AU; Voyager 2 — August 2007, 84 AU'],
      ['Heliopause', 'Voyager 1 — 25 August 2012, 121.6 AU; Voyager 2 — 5 November 2018, 119 AU'],
      ['Interstellar wind', '≈ 26 km/s, from the direction of Scorpius and Ophiuchus'],
    ],
    note: 'The shape is schematic: the tail has never been measured, and it is debated whether the heliosphere trails like a comet or is nearly round.',
  },
  oort: {
    name: 'Oort cloud', kind: 'Hypothetical cloud of icy bodies',
    description:
      'A spherical cloud of perhaps trillions of icy bodies surrounding the Solar System from 2,000 to 100,000 AU — up to a third of the way to the nearest star. Jan Oort proposed it in 1950 to explain where long-period comets come from. Nobody has observed it directly: its objects are too faint and too far.',
    facts: [
      ['Inner part (Hills cloud)', '≈ 2,000–20,000 AU, flattened toward the planets’ plane'],
      ['Outer edge', '≈ 100,000 AU (1.6 light years)'],
      ['Voyager 1', 'will reach the inner edge in about 300 years and take about 30,000 years to cross'],
    ],
    note: 'Shown schematically: the cloud is a hypothesis, supported only indirectly — by the orbits of comets.',
  },
  voyager1: {
    name: 'Voyager 1', kind: 'NASA interstellar probe',
    description:
      'The most distant human-made object. It flew past Jupiter and Saturn, photographed Earth from 6 billion km (“Pale Blue Dot”, 1990) and was the first to enter interstellar space. It carries the Golden Record with voices and music of Earth.',
    facts: [['Launch', '5 September 1977'], ['Jupiter', '5 March 1979'], ['Saturn and Titan', '12 November 1980'], ['Heliopause', '25 August 2012, 121.6 AU']],
  },
  voyager2: {
    name: 'Voyager 2', kind: 'NASA interstellar probe',
    description:
      'The only spacecraft to have visited Uranus and Neptune. In 12 years it flew past all four giant planets, using a rare alignment that recurs every 175 years. It entered interstellar space in 2018.',
    facts: [['Launch', '20 August 1977'], ['Jupiter · Saturn', '9 July 1979 · 26 August 1981'], ['Uranus · Neptune', '24 January 1986 · 25 August 1989'], ['Heliopause', '5 November 2018, 119 AU']],
  },
  pioneer10: {
    name: 'Pioneer 10', kind: 'NASA probe (contact lost)',
    description:
      'The first spacecraft to cross the asteroid belt and fly past Jupiter. It carries a plaque showing humans and the position of the Sun — a message to anyone who might find it. Its last signal arrived in 2003.',
    facts: [['Launch', '3 March 1972'], ['Jupiter', '4 December 1973'], ['Last signal', '23 January 2003']],
  },
  pioneer11: {
    name: 'Pioneer 11', kind: 'NASA probe (contact lost)',
    description:
      'The first to fly past Saturn, discovering its F ring, and the scout of the path the Voyagers later took. Contact ended in 1995.',
    facts: [['Launch', '6 April 1973'], ['Jupiter', '3 December 1974'], ['Saturn', '1 September 1979'], ['Last signal', '30 September 1995']],
  },
  newHorizons: {
    name: 'New Horizons', kind: 'NASA probe',
    description:
      'The first to explore Pluto and Charon up close; in 2019 it flew past Arrokoth — the most distant and most primitive body ever explored. It continues through the Kuiper belt.',
    facts: [['Launch', '19 January 2006'], ['Jupiter (gravity assist)', '28 February 2007'], ['Pluto', '14 July 2015'], ['Arrokoth', '1 January 2019']],
  },
  neighbourhood: {
    name: 'Solar neighbourhood', kind: 'Nearest stars · within 26 light years',
    description:
      'The stars within 26 light years of the Sun, from the HYG catalogue. Three quarters of them are faint red dwarfs, invisible without a telescope; only a few are brighter and hotter than the Sun, such as Sirius, Procyon and Altair. The nearest is Proxima Centauri: its light takes 4.2 years to reach us.',
    facts: [['Nearest star', 'Proxima Centauri, 4.24 ly'], ['Nearest Sun-like star', 'Alpha Centauri A, 4.37 ly'], ['Brightest in the sky', 'Sirius, 8.6 ly']],
  },
  milkyway: {
    name: 'Milky Way', kind: 'Barred spiral galaxy',
    description:
      'Our Galaxy is a disc of hundreds of billions of stars, gas and dust, with a bar at its centre and spiral arms. The Sun sits in the small Orion arm, about halfway from the centre to the edge, and circles the centre once every 230 million years. The band of the Milky Way across the night sky is this disc, seen from inside.',
    facts: [
      ['Stellar disc diameter', '≈ 100,000 ly'], ['Stars', '100–400 billion'], ['Sun to centre', '26,670 ly (8.18 kpc)'],
      ['Speed of the Sun', '≈ 230 km/s'], ['Galactic year', '≈ 230 million years'], ['Disc thickness', '≈ 1,000 ly'],
    ],
    note: 'The view from outside is an artist’s reconstruction from Spitzer telescope data (NASA/JPL-Caltech/R. Hurt): from inside the disc nobody can photograph the whole Galaxy.',
  },
  galacticCentre: {
    name: 'Galactic Centre', kind: 'Supermassive black hole',
    description:
      'At the centre of the Galaxy, toward the constellation Sagittarius, lies the black hole Sagittarius A*, about 4.3 million times the mass of the Sun. It was proven by tracking stars orbiting an invisible centre (Nobel Prize 2020), and in 2022 the Event Horizon Telescope imaged it. In visible light the centre is hidden by dust — it is observed in infrared, radio and X-rays.',
    facts: [['Mass', '≈ 4.3 million Suns'], ['Distance', '26,670 ly'], ['Image of its shadow', 'Event Horizon Telescope, 2022']],
  },
  orionArm: {
    name: 'Orion Arm', kind: 'Local arm · the Sun is here',
    description: 'A small arm between the Sagittarius and Perseus arms, home of the Sun. Many familiar sights of the night sky are in it: the Orion Nebula, Rigel and Betelgeuse, the Pleiades.',
    facts: [['Contains', 'Orion Nebula, Pleiades, Rigel, Betelgeuse']],
  },
  perseusArm: {
    name: 'Perseus Arm', kind: 'Major spiral arm',
    description: 'One of the two major arms of the Galaxy, the nearest to the Sun on the outside — about 6,000 light years away. It starts at the far end of the central bar.',
    facts: [['Distance from the Sun', '≈ 6,000 ly, toward the edge']],
  },
  sagittariusArm: {
    name: 'Sagittarius–Carina Arm', kind: 'Minor spiral arm',
    description: 'The arm between the Sun and the Galactic centre. The Lagoon and Eagle nebulae — with the “Pillars of Creation” — seen in the summer Milky Way lie in it.',
    facts: [['Distance from the Sun', '≈ 5,000 ly, toward the centre']],
  },
  scutumArm: {
    name: 'Scutum–Centaurus Arm', kind: 'Major spiral arm',
    description: 'The second major arm of the Galaxy. It starts at the near end of the bar and wraps around the centre; it is especially rich in star-forming regions.',
    facts: [['Starts', 'at the near end of the central bar']],
  },
  lmc: {
    name: 'Large Magellanic Cloud', kind: 'Satellite galaxy',
    description: 'A dwarf satellite galaxy of the Milky Way, visible to the naked eye from the southern hemisphere. It holds the Tarantula Nebula — the largest star-forming region in the Local Group — and supernova 1987A, the nearest seen in 400 years.',
    facts: [['Distance', '≈ 160,000 ly'], ['Diameter', '≈ 32,000 ly']],
  },
  smc: {
    name: 'Small Magellanic Cloud', kind: 'Satellite galaxy',
    description: 'A dwarf satellite galaxy next to the Large Magellanic Cloud in the southern sky. From its variable stars Henrietta Leavitt found the law that made it possible to measure distances to galaxies.',
    facts: [['Distance', '≈ 200,000 ly'], ['Diameter', '≈ 19,000 ly']],
  },
};

/** English names and notes for nearby stars, by Gliese catalogue id. */
export const EN_STAR_NAMES: Record<string, { name: string; note?: string }> = {
  'Gl 551': { name: 'Proxima Centauri', note: 'The nearest star to the Sun, a red dwarf. Its planet Proxima b orbits where liquid water could exist (discovered in 2016).' },
  'Gl 559A': { name: 'Alpha Centauri A', note: 'Almost a twin of the Sun. With Alpha Centauri B it circles a common centre every 80 years; Proxima is the third, distant member of the system.' },
  'Gl 559B': { name: 'Alpha Centauri B', note: 'An orange dwarf, the partner of Alpha Centauri A.' },
  'Gl 699': { name: 'Barnard’s Star', note: 'Moves across our sky faster than any other star — 10.3″ a year. In 10,000 years it will pass within 3.8 light years of the Sun.' },
  'Gl 406': { name: 'Wolf 359', note: 'One of the faintest known red dwarfs: in visible light tens of thousands of times fainter than the Sun.' },
  'Gl 411': { name: 'Lalande 21185' },
  'Gl 244A': { name: 'Sirius', note: 'The brightest star of the night sky, nearly twice as hot as the Sun; it is circled by the white dwarf Sirius B — the remnant of a once more massive star.' },
  'Gl 244B': { name: 'Sirius B', note: 'A white dwarf the size of Earth with the mass of the Sun.' },
  'Gl 65A': { name: 'Luyten 726-8 A' },
  'Gl 65B': { name: 'Luyten 726-8 B' },
  'Gl 729': { name: 'Ross 154' },
  'Gl 905': { name: 'Ross 248' },
  'Gl 144': { name: 'Epsilon Eridani', note: 'A young Sun-like star with dust belts. With Tau Ceti it was the first target of a search for alien radio signals (Project Ozma, 1960).' },
  'Gl 887': { name: 'Lacaille 9352' },
  'Gl 447': { name: 'Ross 128' },
  'Gl 280A': { name: 'Procyon', note: 'The eighth brightest star of the sky; like Sirius, it has a white dwarf companion.' },
  'Gl 280B': { name: 'Procyon B' },
  'Gl 820A': { name: '61 Cygni A', note: 'The first star whose distance was measured: Friedrich Bessel, from its annual parallax, in 1838.' },
  'Gl 820B': { name: '61 Cygni B' },
  'Gl 71': { name: 'Tau Ceti', note: 'The nearest single Sun-like star — a favourite of science fiction and of searches for signals.' },
  'Gl 845': { name: 'Epsilon Indi' },
  'Gl 15A': { name: 'Groombridge 34' },
  'Gl 273': { name: 'Luyten’s Star' },
  'Gl 191': { name: 'Kapteyn’s Star', note: 'An old star of the Galactic halo, sweeping past us on an elongated orbit.' },
  'Gl 825': { name: 'Lacaille 8760' },
  'Gl 860A': { name: 'Kruger 60' },
  'Gl 35': { name: 'Van Maanen’s Star', note: 'The nearest solitary white dwarf; its atmosphere shows the remains of planetary bodies it swallowed.' },
  'Gl 628': { name: 'Wolf 1061' },
  'Gl 166A': { name: '40 Eridani A' },
  'Gl 768': { name: 'Altair', note: 'It spins so fast — once in 9 hours — that it is visibly flattened at the poles.' },
  'Gl 764': { name: 'Sigma Draconis' },
  'Gl 34A': { name: 'Eta Cassiopeiae' },
  'Gl 780': { name: 'Delta Pavonis' },
  'Gl 19': { name: 'Beta Hydri' },
  'Gl 721': { name: 'Vega', note: 'The reference for star brightness; a dust disc surrounds it. In 12,000 years it will be the pole star.' },
  'Gl 881': { name: 'Fomalhaut', note: 'Ringed by a bright dust belt imaged by Hubble and the James Webb telescope.' },
  'Gl 286': { name: 'Pollux', note: 'An orange giant with a giant planet.' },
  'Gl 541': { name: 'Arcturus', note: 'An orange giant, the brightest star of the northern sky.' },
  'Gl 194A': { name: 'Capella', note: 'A pair of yellow giants, the sixth brightest “star” of the sky.' },
  'Gl 194B': { name: 'Capella B' },
  'Gl 278A': { name: 'Castor', note: 'A system of six stars: three pairs orbiting one another.' },
};
