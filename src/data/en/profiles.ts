/** English overlay for the object profiles (source texts: src/data/profiles.ts). */
import type { Milestone, Profile } from '../profiles';

const m = (when: string, name: string, note: string): Milestone => ({ when, name, note });

export const EN_PROFILES: Record<string, Profile> = {
  sun: {
    place: 'at the centre of the Solar System',
    tagline: 'An ordinary star that holds every planet in place and powers life on Earth.',
    fun: 'About 1.3 million Earths would fit inside the Sun.',
    history: [
      m('1974', 'Helios 1', 'Came within a third of Earth’s distance from the Sun'),
      m('1995', 'SOHO', 'Has watched the Sun non-stop from the L1 point for three decades'),
      m('2010', 'SDO', 'Images the Sun in high resolution every 12 seconds'),
      m('2018', 'Parker Solar Probe', 'In 2024 passed 6.1 million km from the surface — the closest ever'),
      m('2020', 'Solar Orbiter', 'First images of the Sun’s poles'),
    ],
  },
  mercury: {
    place: '1st planet from the Sun',
    tagline: 'The smallest planet: scorching days, frozen nights and ice in permanently shadowed craters.',
    fun: 'A year on Mercury is shorter than its solar day: 88 Earth days against 176.',
    history: [
      m('1974', 'Mariner 10', 'Three flybys, about 45 % of the surface imaged'),
      m('2011', 'MESSENGER', 'First spacecraft to orbit Mercury, a full map of the planet'),
      m('2018', 'BepiColombo', 'European-Japanese mission, orbit insertion at the end of 2026'),
    ],
  },
  venus: {
    place: '2nd planet from the Sun',
    tagline: 'Earth’s twin in size, but under clouds of sulphuric acid it is as hot as an oven and as crushing as the deep sea.',
    fun: 'Venus spins backwards: there the Sun rises in the west.',
    history: [
      m('1962', 'Mariner 2', 'First successful flyby of another planet'),
      m('1967', 'Venera 4', 'First direct measurements inside another planet’s atmosphere'),
      m('1970', 'Venera 7', 'First soft landing on another planet and a signal from its surface'),
      m('1975', 'Venera 9', 'First images from the surface of another planet'),
      m('1982', 'Venera 13', 'Colour panoramas; the lander worked for 127 minutes'),
      m('1990', 'Magellan', 'Radar map of 98 % of the surface'),
      m('2015', 'Akatsuki', 'Japanese orbiter studied winds and clouds until 2024'),
    ],
  },
  earth: {
    place: '3rd planet from the Sun',
    tagline: 'The only place in the Universe known to host life.',
    fun: 'Earth is the densest planet in the Solar System.',
  },
  mars: {
    place: '4th planet from the Sun',
    tagline: 'A cold red desert with the tallest volcano in the Solar System and traces of ancient rivers.',
    fun: 'Olympus Mons rises about 22 km — almost two and a half times the height of Everest.',
    history: [
      m('1965', 'Mariner 4', 'First flyby and first close-up images'),
      m('1971', 'Mars 3', 'First soft landing; contact lasted about 20 seconds'),
      m('1976', 'Viking 1 and 2', 'First long-term work on the surface'),
      m('1997', 'Mars Pathfinder', 'The first rover, Sojourner'),
      m('2004', 'Spirit and Opportunity', 'Found traces of water in ancient rocks'),
      m('2012', 'Curiosity', 'Working in Gale crater'),
      m('2021', 'Perseverance and Ingenuity', 'Collecting samples; first flights on another planet'),
      m('2021', 'Tianwen-1 and Zhurong', 'China’s first Mars rover, Utopia Planitia'),
    ],
  },
  jupiter: {
    place: '5th planet from the Sun · the largest',
    tagline: 'A gas giant two and a half times as massive as all the other planets combined.',
    fun: 'The Great Red Spot is a storm wider than Earth that has been watched for over 150 years.',
    history: [
      m('1610', 'Galileo Galilei', 'Discovered the four largest moons'),
      m('1973', 'Pioneer 10', 'First flyby of Jupiter'),
      m('1979', 'Voyager 1 and 2', 'Io’s volcanoes and Jupiter’s faint rings'),
      m('1995', 'Galileo', 'First Jupiter orbiter; a probe entered the atmosphere'),
      m('2016', 'Juno', 'Polar orbit, studying the interior and auroras'),
      m('2023', 'JUICE', 'European probe to the icy moons, arriving in 2031'),
      m('2024', 'Europa Clipper', 'Launched to Europa, arriving in 2030'),
    ],
  },
  saturn: {
    place: '6th planet from the Sun',
    tagline: 'The planet with the brightest rings — made of ice and in places only tens of metres thick.',
    fun: 'Saturn’s mean density is lower than that of water.',
    history: [
      m('1610', 'Galileo Galilei', 'Saw the planet’s “ears” — rings he could not explain'),
      m('1979', 'Pioneer 11', 'First flyby of Saturn'),
      m('1980', 'Voyager 1 and 2', 'Thousands of ringlets and Titan’s thick atmosphere'),
      m('2004', 'Cassini–Huygens', '13 years in orbit around Saturn'),
      m('2005', 'Huygens', 'Landed on Titan — the most distant landing ever'),
      m('2017', 'Grand Finale', 'Cassini dived between the planet and its rings and burned up in the atmosphere'),
    ],
  },
  uranus: {
    place: '7th planet from the Sun',
    tagline: 'An ice giant that spins lying on its side.',
    fun: 'At Uranus’s poles, day and night each last 42 Earth years.',
    history: [
      m('1781', 'William Herschel', 'The first planet discovered with a telescope'),
      m('1977', 'Kuiper Airborne Observatory', 'Rings found from the flickering of a star behind them'),
      m('1986', 'Voyager 2', 'The only flyby: 10 new moons, the magnetic field'),
    ],
  },
  neptune: {
    place: '8th planet from the Sun · the farthest',
    tagline: 'A blue ice giant with the fastest winds in the Solar System.',
    fun: 'Neptune was found “with the tip of a pen”: its position was calculated first.',
    history: [
      m('1846', 'Le Verrier and Galle', 'Found from the disturbances of Uranus’s orbit'),
      m('1846', 'William Lassell', 'Triton discovered 17 days later'),
      m('1989', 'Voyager 2', 'The only flyby: the Great Dark Spot and Triton’s geysers'),
    ],
  },
  moon: {
    place: '5th-largest moon in the Solar System',
    tagline: 'The only world beyond Earth where people have walked.',
    fun: 'The Moon drifts 3.8 cm farther from Earth every year — measured by lasers bounced off the Apollo reflectors.',
    history: [
      m('1959', 'Luna 2 and Luna 3', 'First impact on the Moon and first images of its far side'),
      m('1966', 'Luna 9', 'First soft landing'),
      m('1969', 'Apollo 11', 'First people on the Moon'),
      m('1970', 'Lunokhod 1', 'The first lunar rover, 10.5 km across Mare Imbrium'),
      m('1972', 'Apollo 17', 'The last crewed landing to date'),
      m('2019', 'Chang’e 4', 'First landing on the far side'),
      m('2023', 'Chandrayaan-3', 'Landing near the south pole'),
      m('2024', 'Chang’e 6', 'First samples from the far side'),
    ],
  },

  phobos: {
    place: 'the inner and larger of two',
    tagline: 'A lumpy moon slowly falling towards Mars.',
    fun: 'Seen from Mars, Phobos rises in the west and sets in the east — twice a day.',
  },
  deimos: {
    place: 'the outer and smaller of two',
    tagline: 'A tiny smooth moon the size of a city.',
    fun: 'From Mars, Deimos looks like a bright star.',
  },
  io: {
    place: 'the innermost Galilean moon',
    tagline: 'The most volcanically active body in the Solar System.',
    fun: 'Jupiter’s tides raise Io’s “solid” surface by tens of metres.',
    history: [
      m('1610', 'Galileo Galilei', 'Discovery'),
      m('1979', 'Voyager 1', 'Active volcanoes found — the first beyond Earth'),
      m('1995', 'Galileo', 'Watched eruptions and changing lava fields'),
      m('2023', 'Juno', 'Flew within 1,500 km of Io'),
    ],
  },
  europa: {
    place: '2nd Galilean moon from Jupiter',
    tagline: 'An icy crust over a global ocean holding more water than Earth’s.',
    fun: 'Europa’s surface is one of the smoothest in the Solar System: its relief is only hundreds of metres.',
    history: [
      m('1610', 'Galileo Galilei', 'Discovery'),
      m('1979', 'Voyagers', 'First images of the cracks in the ice'),
      m('1995', 'Galileo', 'Magnetic data pointed to a salty ocean under the ice'),
      m('2022', 'Juno', 'Flyby 352 km above the surface'),
      m('2030', 'Europa Clipper', 'Arrival at Jupiter and dozens of Europa flybys'),
    ],
  },
  ganymede: {
    place: 'the largest moon in the Solar System',
    tagline: 'A moon bigger than Mercury — and the only one with its own magnetic field.',
    fun: 'Ganymede probably hides an ocean sandwiched between layers of ice.',
    history: [
      m('1610', 'Galileo Galilei', 'Discovery'),
      m('1996', 'Galileo', 'Its own magnetic field discovered'),
      m('2021', 'Juno', 'Flyby 1,000 km above the surface'),
      m('2034', 'JUICE', 'First spacecraft to orbit another planet’s moon (planned)'),
    ],
  },
  callisto: {
    place: '3rd-largest moon in the Solar System',
    tagline: 'The oldest surface in the Solar System, saturated with craters.',
    fun: 'Callisto has barely changed in 4 billion years: no volcanoes, no tectonics.',
    history: [
      m('1610', 'Galileo Galilei', 'Discovery'),
      m('1979', 'Voyagers', 'The Valhalla multi-ring basin'),
      m('1996', 'Galileo', 'Signs of an ocean deep under the crust'),
    ],
  },
  mimas: {
    place: 'the innermost of Saturn’s major moons',
    tagline: 'A small moon with a giant crater that makes it look like the “Death Star”.',
    fun: 'The impact that made Herschel crater nearly shattered Mimas.',
  },
  enceladus: {
    place: '6th-largest moon of Saturn',
    tagline: 'An icy moon spraying geysers into space from an ocean beneath its crust.',
    fun: 'Enceladus reflects almost all sunlight — the whitest body in the Solar System.',
    history: [
      m('1789', 'William Herschel', 'Discovery'),
      m('2005', 'Cassini', 'Geysers found at the south pole'),
      m('2015', 'Cassini', 'Flew through the plume 49 km up: water, salts, organics'),
    ],
  },
  tethys: {
    place: '5th-largest moon of Saturn',
    tagline: 'Almost pure water ice, with a giant canyon running across half the moon.',
  },
  dione: {
    place: '4th-largest moon of Saturn',
    tagline: 'An icy moon with bright “wispy” cliffs on one side.',
  },
  rhea: {
    place: '2nd-largest moon of Saturn',
    tagline: 'A cold, heavily cratered ball of ice and rock.',
  },
  titan: {
    place: '2nd-largest moon in the Solar System',
    tagline: 'The only moon with a thick atmosphere — and seas of liquid methane.',
    fun: 'On Titan you could fly by flapping wings: the air is dense and gravity is weak.',
    history: [
      m('1655', 'Christiaan Huygens', 'Discovery'),
      m('1980', 'Voyager 1', 'A thick nitrogen atmosphere hid the surface'),
      m('2005', 'Huygens', 'Landing: ice pebbles and channels of methane rivers'),
      m('2004–2017', 'Cassini', 'Radar found seas and lakes near the poles'),
      m('2028', 'Dragonfly', 'Launch of a rotorcraft laboratory (planned), arriving in 2034'),
    ],
  },
  iapetus: {
    place: '3rd-largest moon of Saturn',
    tagline: 'A two-faced moon: one side bright as snow, the other dark as coal.',
    fun: 'A ridge up to 20 km high runs along Iapetus’s equator.',
  },
  miranda: {
    place: 'the smallest of Uranus’s five major moons',
    tagline: 'A patchwork moon with the tallest cliff in the Solar System.',
    fun: 'A rock dropped from the 20 km Verona Rupes would fall for several minutes.',
  },
  ariel: {
    place: '4th-largest moon of Uranus',
    tagline: 'The brightest and probably youngest surface among Uranus’s moons.',
  },
  umbriel: {
    place: '3rd-largest moon of Uranus',
    tagline: 'A dark, ancient moon with a mysterious bright ring on one crater.',
  },
  titania: {
    place: 'the largest moon of Uranus',
    tagline: 'Uranus’s largest moon, cut by enormous faults.',
  },
  oberon: {
    place: '2nd-largest and outermost major moon of Uranus',
    tagline: 'Uranus’s outer major moon, with dark patches on its crater floors.',
  },
  triton: {
    place: 'Neptune’s largest, 7th in the Solar System',
    tagline: 'A captured icy world orbiting against Neptune’s spin.',
    fun: 'Voyager 2 saw nitrogen geysers on Triton up to 8 km tall.',
    history: [
      m('1846', 'William Lassell', 'Discovery'),
      m('1989', 'Voyager 2', 'The only flyby: geysers and “cantaloupe” terrain'),
    ],
  },
  charon: {
    place: 'the largest moon of Pluto',
    tagline: 'A moon half the size of Pluto: the two circle a shared point.',
    fun: 'Pluto and Charon always show each other the same face.',
  },

  ceres: {
    place: 'the largest body in the asteroid belt',
    tagline: 'A dwarf planet in the asteroid belt with salty spots on a crater floor.',
    fun: 'Ceres was the first asteroid found — and for half a century it was counted as a planet.',
    history: [
      m('1801', 'Giuseppe Piazzi', 'Discovered on the first night of the 19th century'),
      m('2015', 'Dawn', 'First spacecraft to orbit a dwarf planet'),
      m('2018', 'Dawn', 'The bright spots of Occator crater turned out to be salt deposits'),
    ],
  },
  pluto: {
    place: 'the largest dwarf planet by size',
    tagline: 'The former ninth planet, with a heart of nitrogen ice.',
    fun: 'Since its discovery in 1930 Pluto has not yet completed half of its 248-year orbit.',
    history: [
      m('1930', 'Clyde Tombaugh', 'Found on photographic plates at Lowell Observatory'),
      m('1978', 'James Christy', 'Charon discovered'),
      m('2006', 'IAU', 'Reclassified as a dwarf planet'),
      m('2015', 'New Horizons', 'Flyby: Sputnik Planitia, mountains of ice, a blue haze'),
    ],
  },
  haumea: {
    place: 'the most elongated dwarf planet',
    tagline: 'Shaped like a rugby ball and spinning once every 4 hours.',
  },
  makemake: {
    place: 'in the Kuiper belt',
    tagline: 'A reddish icy world, one of the brightest bodies beyond Neptune.',
  },
  eris: {
    place: 'the most massive dwarf planet',
    tagline: 'Its discovery in 2005 forced astronomers to decide what a planet is.',
  },

  'asteroid-belt': {
    tagline: 'A belt of millions of rocky fragments between Mars and Jupiter.',
    fun: 'All the asteroids in the belt together weigh less than 5 % of the Moon.',
  },
  'kuiper-belt': {
    tagline: 'A cold belt of icy bodies beyond Neptune — the home of short-period comets.',
  },

  heliosphere: { tagline: 'The bubble of solar wind that contains the whole planetary system.' },
  voyager1: {
    tagline: 'The most distant human-made object — and the first to reach interstellar space.',
    fun: 'In November 2026 Voyager 1 becomes the first spacecraft a full light-day away.',
  },
  voyager2: { tagline: 'The only spacecraft to have visited Uranus and Neptune.' },
  pioneer10: {
    tagline: 'The first to cross the asteroid belt and fly past Jupiter.',
    fun: 'It carries a plaque showing humans and Earth’s “address”.',
  },
  pioneer11: { tagline: 'The first to fly past Saturn, paving the way for the Voyagers.' },
  newHorizons: { tagline: 'The first close look at Pluto and at the most distant body ever explored, Arrokoth.' },
  oort: { tagline: 'A hypothetical sphere of trillions of icy bodies — the edge of the Sun’s reach.' },
  neighbourhood: { tagline: 'The nearest stars in their true places.' },
  milkyway: { tagline: 'Our Galaxy — hundreds of billions of stars, and the Sun is just one of them.' },
};
