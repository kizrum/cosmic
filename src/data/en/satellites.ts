/** English overlay for moons and dwarf planets (source texts: src/data/satellites.ts). */
import type { BodyEN } from './types';

const UNIMAGED = 'Voyager 2 imaged only the southern hemisphere in 1986; the northern half of the map is filled in schematically.';

export const EN_SATELLITES: Record<string, BodyEN> = {
  phobos: {
    name: 'Phobos', kind: 'Moon of Mars',
    facts: [['Size', '27 × 22 × 18 km'], ['Orbital period', '7 h 39 min'], ['Distance from Mars’s centre', '9,376 km'], ['Discovered', '1877, Asaph Hall']],
    description:
      'Phobos orbits Mars faster than Mars rotates, so seen from the surface it rises in the west and sets in the east twice a day. Tides are slowly drawing it inwards: in about 30–50 million years it will break up and may form a ring. Whether it is a captured asteroid or debris from an impact should be settled by Japan’s MMX mission.',
    sites: {
      stickney: {
        name: 'Stickney crater', kind: 'Impact crater',
        description: 'A crater almost half the size of Phobos itself; the impact nearly shattered the moon. Mysterious parallel grooves radiate from it.',
        facts: [['Diameter', '≈ 9 km']],
      },
    },
  },
  deimos: {
    name: 'Deimos', kind: 'Moon of Mars',
    facts: [['Size', '15 × 12 × 11 km'], ['Orbital period', '30.3 h'], ['Distance from Mars’s centre', '23,460 km']],
    description:
      'The smaller and more distant moon of Mars. Its surface is smoothed by a thick layer of regolith that has buried most craters. From Mars, Deimos looks like a bright star that barely moves for hours.',
  },
  io: {
    name: 'Io', kind: 'Galilean moon of Jupiter',
    facts: [['Radius', '1,821.6 km'], ['Orbital period', '1.77 days'], ['Distance from Jupiter', '421,700 km'], ['Active volcanoes', 'more than 400']],
    description:
      'The most volcanically active body in the Solar System. Io is locked in a 1:2:4 orbital resonance with Europa and Ganymede: their pull keeps its orbit from becoming circular, so Jupiter’s tides constantly knead and heat its interior. The yellows and reds come from sulphur compounds; some lavas are hotter than any on Earth.',
    sites: {
      pele: {
        name: 'Pele volcano', kind: 'Active volcano',
        description: 'Its eruption plume rises 300 km, and the sulphur that falls back forms a red ring about 1,400 km across.',
        facts: [['Plume height', '≈ 300 km']],
      },
      loki: {
        name: 'Loki Patera', kind: 'Lava lake',
        description: 'Io’s most powerful volcano: a lava lake about 200 km across. Its surface overturns periodically and it is bright enough in the infrared to be seen from Earth.',
        facts: [['Diameter', '≈ 200 km']],
      },
      tvashtar: {
        name: 'Tvashtar Paterae', kind: 'Volcano',
        description: 'In 2007 New Horizons, on its way to Pluto, caught an eruption here with a plume 330 km high.',
      },
    },
  },
  europa: {
    name: 'Europa', kind: 'Galilean moon of Jupiter',
    facts: [['Radius', '1,560.8 km'], ['Orbital period', '3.55 days'], ['Ice shell thickness', '≈ 15–25 km'], ['Subsurface ocean', 'twice as much water as Earth']],
    description:
      'Beneath Europa’s ice shell lies a salty ocean about 100 km deep — one of the best places to look for life beyond Earth. The cracks (“lineae”) on the surface come from tidal stresses. Europa Clipper, launched in 2024, will reach Jupiter in 2030 and make dozens of Europa flybys.',
    sites: {
      conamara: {
        name: 'Conamara Chaos', kind: 'Chaos terrain',
        description: 'Here ice plates broke apart and shifted like icebergs frozen into new ice — a sign that warm water or soft ice once came close to the surface.',
      },
      pwyll: {
        name: 'Pwyll crater', kind: 'Young impact crater',
        description: 'One of Europa’s youngest large craters, with bright ejecta rays stretching hundreds of kilometres.',
        facts: [['Diameter', '≈ 45 km']],
      },
      thera: {
        name: 'Thera Macula', kind: 'Chaos terrain',
        description: 'A dark, slightly sunken area. A lens of liquid water may lie within the ice shell beneath it.',
      },
    },
  },
  ganymede: {
    name: 'Ganymede', kind: 'Galilean moon of Jupiter',
    facts: [['Radius', '2,634.1 km — larger than Mercury'], ['Orbital period', '7.15 days'], ['Distance from Jupiter', '1,070,400 km'], ['Magnetic field', 'its own']],
    note: 'Map: Björn Jónsson (from Voyager and Galileo data).',
    description:
      'The largest moon in the Solar System and the only one with its own magnetic field. Dark ancient terrain alternates with bright grooved terrain where the crust was stretched. A salty ocean probably lies beneath the ice. ESA’s JUICE will become the first spacecraft to orbit another planet’s moon — Ganymede, in 2034.',
    sites: {
      'galileo-regio': {
        name: 'Galileo Regio', kind: 'Ancient dark region',
        description: 'Ganymede’s largest dark region, about 3,200 km across. Its surface is among the oldest on the moon, covered with craters and arc-shaped furrows from a giant ancient impact.',
      },
      tros: {
        name: 'Tros crater', kind: 'Rayed crater',
        description: 'A bright young crater with a system of light rays. The impact exposed clean ice beneath the darkened surface.',
        facts: [['Diameter', '≈ 94 km']],
      },
      osiris: {
        name: 'Osiris crater', kind: 'Rayed crater',
        description: 'One of Ganymede’s brightest craters, with rays reaching hundreds of kilometres.',
      },
    },
  },
  callisto: {
    name: 'Callisto', kind: 'Galilean moon of Jupiter',
    facts: [['Radius', '2,410.3 km'], ['Orbital period', '16.7 days'], ['Distance from Jupiter', '1,882,700 km']],
    description:
      'The most heavily cratered surface in the Solar System, almost unchanged for 4 billion years. Callisto is outside the resonance and barely heated by tides, yet it too may hide an ocean. Lying outside Jupiter’s radiation belts, it is the best spot for a future base.',
    sites: {
      valhalla: {
        name: 'Valhalla', kind: 'Multi-ring basin',
        description: 'The largest multi-ring structure in the Solar System: concentric scarps spread almost 2,000 km from a bright centre.',
        facts: [['Diameter including rings', '≈ 3,800 km']],
      },
      asgard: {
        name: 'Asgard', kind: 'Multi-ring basin',
        description: 'Callisto’s second-largest multi-ring basin.',
        facts: [['Diameter', '≈ 1,600 km']],
      },
    },
  },
  mimas: {
    name: 'Mimas', kind: 'Moon of Saturn',
    facts: [['Radius', '198 km'], ['Orbital period', '22.6 h'], ['Distance from Saturn', '185,500 km']],
    description:
      'Mimas clears the Cassini Division in Saturn’s rings through a 2:1 resonance. In 2024, wobbles in its rotation and orbit pointed to a young hidden ocean only 5–15 million years old.',
    sites: {
      herschel: {
        name: 'Herschel crater', kind: 'Impact crater',
        description: 'A crater a third as wide as Mimas, which earned the moon the nickname “Death Star”. Its central peak rises almost 6 km.',
        facts: [['Diameter', '139 km']],
      },
    },
  },
  enceladus: {
    name: 'Enceladus', kind: 'Moon of Saturn',
    facts: [['Radius', '252 km'], ['Orbital period', '1.37 days'], ['Albedo', 'the highest in the Solar System']],
    description:
      'Geysers of water from a subsurface ocean erupt from cracks near the south pole and feed Saturn’s E ring. Cassini flew through the plumes and found salts, organics, molecular hydrogen and, in 2023, phosphates — all the key known ingredients for life.',
    sites: {
      'tiger-stripes': {
        name: '“Tiger stripes”', kind: 'Geyser fractures',
        description: 'Four parallel fractures about 130 km long. They are tens of degrees warmer than their surroundings and vent about 200 kg of water per second.',
      },
    },
  },
  tethys: {
    name: 'Tethys', kind: 'Moon of Saturn',
    facts: [['Radius', '531 km'], ['Orbital period', '1.89 days'], ['Density', '0.98 g/cm³ — almost pure ice']],
    description: 'Made almost entirely of water ice. The Ithaca Chasma canyon runs a third of the way around the moon, about 2,000 km long and up to 3 km deep.',
    sites: {
      odysseus: {
        name: 'Odysseus crater', kind: 'Impact basin',
        description: 'A huge but shallow crater: its floor has slowly “floated” back up because ice flows over time.',
        facts: [['Diameter', '445 km']],
      },
    },
  },
  dione: {
    name: 'Dione', kind: 'Moon of Saturn',
    facts: [['Radius', '561 km'], ['Orbital period', '2.74 days']],
    description: 'A network of bright “wispy” lines covers the trailing hemisphere. Cassini showed they are not frost but ice cliffs hundreds of metres high. A deep ocean probably lies beneath the crust.',
    sites: {
      wispy: {
        name: '“Wispy” cliffs', kind: 'Tectonic fractures',
        description: 'A network of bright ice cliffs on the trailing hemisphere — traces of past crustal stretching.',
      },
    },
  },
  rhea: {
    name: 'Rhea', kind: 'Moon of Saturn',
    facts: [['Radius', '764 km'], ['Orbital period', '4.52 days']],
    description: 'Saturn’s second-largest moon: an icy ball with an ancient cratered surface and a very thin oxygen–carbon dioxide exosphere.',
    sites: {
      inktomi: {
        name: 'Inktomi crater', kind: 'Rayed crater',
        description: 'A young crater with bright rays, nicknamed “The Splat” for the shape of its ejecta.',
        facts: [['Diameter', '48 km']],
      },
      tirawa: {
        name: 'Tirawa basin', kind: 'Impact basin',
        description: 'One of Rhea’s largest basins.',
        facts: [['Diameter', '≈ 360 km']],
      },
    },
  },
  titan: {
    name: 'Titan', kind: 'Moon of Saturn',
    facts: [['Radius', '2,574.7 km'], ['Orbital period', '15.95 days'], ['Surface pressure', '1.45 atm'], ['Atmosphere', '≈ 95 % N₂, ~5 % CH₄'], ['Temperature', '−179 °C']],
    description:
      'The only moon with a thick atmosphere; the surface pressure is higher than on Earth. Titan has a methane cycle: clouds, rain, rivers and seas of liquid hydrocarbons. An orange haze hides the surface in visible light, so the map comes from near-infrared images; the haze is removed when you inspect a site. ESA’s Huygens landed here in 2005, and the Dragonfly rotorcraft will arrive in 2034.',
    sites: {
      kraken: {
        name: 'Kraken Mare', kind: 'Hydrocarbon sea',
        description: 'Titan’s largest sea of liquid methane and ethane, bigger than the Caspian Sea.',
        facts: [['Area', '≈ 400,000 km²']],
      },
      ligeia: {
        name: 'Ligeia Mare', kind: 'Hydrocarbon sea',
        description: 'The second-largest sea. Cassini’s radar measured its depth: up to 160 m of almost transparent methane liquid.',
      },
      huygens: {
        name: 'Huygens landing site', kind: 'Lander',
        description: 'On 14 January 2005 ESA’s Huygens probe parachuted down and sent images of river valleys and rounded pebbles of water ice. It is the most distant landing ever made.',
        facts: [['Date', '14 January 2005']],
      },
      xanadu: {
        name: 'Xanadu', kind: 'Bright highland',
        description: 'A bright region the size of Australia: mountains and river valleys carved by methane rain.',
      },
      selk: {
        name: 'Selk crater', kind: 'Dragonfly target',
        description: 'An impact crater in the Shangri-La dune field. Dragonfly is headed here: liquid water from the impact may once have mixed with organics.',
      },
    },
  },
  iapetus: {
    name: 'Iapetus', kind: 'Moon of Saturn',
    facts: [['Radius', '734.5 km'], ['Orbital period', '79.3 days'], ['Orbital inclination', '≈ 15° to Saturn’s equator']],
    description:
      'A two-faced moon: the leading hemisphere is coal-black, the trailing one snow-white. Dark dust arrives from the outer Phoebe ring; the darkened ice then warms more, evaporates and settles on the bright side, deepening the contrast. A ridge up to 20 km high runs along the equator, giving Iapetus the shape of a walnut.',
    sites: {
      'cassini-regio': {
        name: 'Cassini Regio', kind: 'Dark hemisphere',
        description: 'A dark region with an albedo of about 0.04. Radar shows the dark layer is thin — just tens of centimetres.',
      },
      ridge: {
        name: 'Equatorial ridge', kind: 'Mountain ridge',
        description: 'A ridge about 1,300 km long and up to 20 km high runs almost exactly along the equator. Its origin is still debated; it may be the remains of an ancient ring that fell onto the moon.',
        facts: [['Height', 'up to 20 km']],
      },
    },
  },
  miranda: {
    name: 'Miranda', kind: 'Moon of Uranus', note: UNIMAGED,
    facts: [['Radius', '235.8 km'], ['Orbital period', '1.41 days']],
    description: 'The most “patchwork” world in the Solar System: ancient cratered plains sit next to giant coronae of parallel grooves. Miranda’s interior may have partly re-melted through tidal heating.',
    sites: {
      verona: {
        name: 'Verona Rupes', kind: 'Cliff',
        description: 'Probably the tallest cliff in the Solar System, about 20 km. In the weak gravity a rock dropped from the top would take several minutes to fall.',
        facts: [['Height', '≈ 20 km']],
      },
      inverness: {
        name: 'Inverness Corona', kind: 'Corona',
        description: 'A rectangular structure with a bright chevron in the middle.',
      },
    },
  },
  ariel: {
    name: 'Ariel', kind: 'Moon of Uranus', note: UNIMAGED,
    facts: [['Radius', '578.9 km'], ['Orbital period', '2.52 days']],
    description: 'The brightest and probably geologically youngest of Uranus’s major moons, crossed by rift valleys floored with icy “lava”.',
    sites: {
      kachina: {
        name: 'Kachina Chasmata', kind: 'Rift valleys',
        description: 'A system of faults more than 600 km long.',
      },
    },
  },
  umbriel: {
    name: 'Umbriel', kind: 'Moon of Uranus', note: UNIMAGED,
    facts: [['Radius', '584.7 km'], ['Orbital period', '4.14 days']],
    description: 'The darkest of Uranus’s major moons, with an ancient, uniform surface.',
    sites: {
      wunda: {
        name: 'Wunda crater', kind: 'Crater with a bright ring',
        description: 'A mysterious bright ring on the crater floor, possibly frost deposits.',
        facts: [['Diameter', '131 km']],
      },
    },
  },
  titania: {
    name: 'Titania', kind: 'Moon of Uranus', note: UNIMAGED,
    facts: [['Radius', '788.4 km — Uranus’s largest moon'], ['Orbital period', '8.71 days']],
    description: 'Uranus’s largest moon. Huge canyons suggest the crust stretched as the interior froze.',
    sites: {
      messina: {
        name: 'Messina Chasmata', kind: 'Canyon',
        description: 'A system of faults about 1,500 km long.',
      },
    },
  },
  oberon: {
    name: 'Oberon', kind: 'Moon of Uranus', note: UNIMAGED,
    facts: [['Radius', '761.4 km'], ['Orbital period', '13.46 days']],
    description: 'The outermost of Uranus’s major moons, with a heavily cratered ancient surface. Some crater floors hold dark material.',
    sites: {
      hamlet: {
        name: 'Hamlet crater', kind: 'Impact crater',
        description: 'A large crater with a dark floor.',
        facts: [['Diameter', '206 km']],
      },
    },
  },
  triton: {
    name: 'Triton', kind: 'Moon of Neptune',
    note: 'Voyager 2 imaged mostly the southern hemisphere in 1989; the northern half of the map is filled in schematically.',
    facts: [['Radius', '1,353.4 km'], ['Orbital period', '5.88 days, retrograde'], ['Temperature', '−235 °C']],
    description:
      'Triton orbits against Neptune’s rotation: it is a captured Kuiper belt object, a “cousin” of Pluto. Its surface is covered with nitrogen ice, and nitrogen geysers shoot up to 8 km high. Tides are slowly drawing it in; in about 3.6 billion years it will be torn apart.',
    sites: {
      'south-cap': {
        name: 'South polar cap', kind: 'Nitrogen ice',
        description: 'A pinkish cap of nitrogen and methane ice. It was summer here when Voyager 2 flew by.',
      },
      geysers: {
        name: 'Hili and Mahilani geysers', kind: 'Nitrogen geysers',
        description: 'Dark plumes carried hundreds of kilometres by the wind, probably driven by sunlight warming translucent nitrogen ice.',
      },
      cantaloupe: {
        name: '“Cantaloupe terrain”', kind: 'Unique terrain',
        description: 'Terrain resembling melon skin, found nowhere else — probably formed as warmer ice rose through the crust (diapirism).',
      },
    },
  },
  charon: {
    name: 'Charon', kind: 'Moon of Pluto',
    note: 'New Horizons imaged one hemisphere in detail in 2015; the south polar region was in polar night.',
    facts: [['Radius', '606 km — half of Pluto'], ['Orbital period', '6.39 days'], ['Distance from Pluto', '19,600 km']],
    description:
      'Charon is so large compared with Pluto that their common centre of mass lies in the space between them; the pair is often called a double system. Both are tidally locked and always face each other with the same side.',
    sites: {
      mordor: {
        name: 'Mordor Macula', kind: 'Polar region',
        description: 'A reddish polar cap. Methane escaping Pluto’s atmosphere freezes onto Charon’s cold pole, and ultraviolet light turns it into red tholins.',
      },
      vulcan: {
        name: 'Vulcan Planitia', kind: 'Cryovolcanic plain',
        description: 'Smooth plains south of the canyon belt, probably flooded by icy “lava” from an ancient subsurface ocean.',
      },
    },
  },
  // ── Dwarf planets ─────────────────────────────────────────────────────────────
  ceres: {
    name: 'Ceres', kind: 'Dwarf planet · asteroid belt',
    note: 'Map: Dawn shaded-relief model (HAMO).',
    facts: [['Radius', '469.7 km'], ['Mass', '9.4 × 10²⁰ kg (~¼ of the belt)'], ['Day', '9 h 4 min'], ['Year', '4.6 Earth years'], ['Discovered', '1 January 1801, Giuseppe Piazzi']],
    description:
      'The largest body in the asteroid belt. It was found first, and for half a century it was counted as a planet. The Dawn spacecraft (2015–2018) found remnants of a salty ocean beneath the surface: brines rising from below left bright deposits of sodium carbonate.',
    sites: {
      occator: {
        name: 'Occator crater', kind: 'Bright spots (faculae)',
        description: 'Ceres’s brightest spots — salt deposits (Cerealia Facula) left behind when brine rising from a deep reservoir evaporated.',
        facts: [['Diameter', '92 km']],
      },
      ahuna: {
        name: 'Ahuna Mons', kind: 'Cryovolcano',
        description: 'A lone steep-sided mountain about 4 km high: a cryovolcano built of salty ice.',
        facts: [['Height', '≈ 4 km']],
      },
      kerwan: {
        name: 'Kerwan crater', kind: 'Impact basin',
        description: 'Ceres’s largest crater: smoothed, with walls almost erased — a sign of an ice-rich crust.',
        facts: [['Diameter', '284 km']],
      },
    },
  },
  pluto: {
    name: 'Pluto', kind: 'Dwarf planet · Kuiper belt',
    note: 'New Horizons imaged only one hemisphere (with the “heart”) in detail. The opposite side is seen at low resolution, and the south polar region, then in polar night, is filled in schematically.',
    facts: [['Radius', '1,188.3 km'], ['Mass', '1.3 × 10²² kg (0.2 Moon)'], ['Day', '6.39 Earth days'], ['Year', '248 Earth years'], ['Temperature', '≈ −230 °C'], ['Moons', '5 (Charon, Styx, Nix, Kerberos, Hydra)']],
    description:
      'The ninth planet from 1930 to 2006. The New Horizons flyby on 14 July 2015 revealed a surprisingly active world: glaciers of nitrogen ice, water-ice mountains up to 6 km high, a blue layered haze in the atmosphere and probably a subsurface ocean.',
    sites: {
      sputnik: {
        name: 'Sputnik Planitia', kind: 'Nitrogen ice glacier',
        description: 'The western lobe of Pluto’s famous “heart”: a basin filled with nitrogen ice that slowly churns by convection into cells. The surface is less than 10 million years old.',
        facts: [['Size', '≈ 1,050 × 800 km']],
      },
      wright: {
        name: 'Wright Mons', kind: 'Possible cryovolcano',
        description: 'A mountain about 4 km high with a depression at its summit — probably a giant ice volcano.',
      },
      cthulhu: {
        name: 'Cthulhu Macula', kind: 'Dark region',
        description: 'A long dark-red band along the equator, coloured by tholins — complex organics formed by ultraviolet light.',
      },
    },
  },
  haumea: {
    name: 'Haumea', kind: 'Dwarf planet · Kuiper belt',
    note: 'Never imaged up close: colouring is schematic. Shape, rotation and ring come from a stellar occultation (Ortiz et al., 2017).',
    facts: [['Size', '≈ 2,322 × 1,704 × 1,026 km'], ['Day', '3 h 55 min — fastest of all large bodies'], ['Year', '≈ 283 Earth years'], ['Moons', '2 (Hiʻiaka, Namaka)'], ['Ring', 'radius ≈ 2,290 km']],
    description:
      'Fast rotation has stretched Haumea into the shape of a rugby ball. Its surface is covered with crystalline water ice. In 2017 a stellar occultation revealed a ring — the first found around a body beyond Neptune.',
  },
  makemake: {
    name: 'Makemake', kind: 'Dwarf planet · Kuiper belt',
    note: 'Never imaged up close: colouring is schematic and the axis orientation has not been measured.',
    facts: [['Radius', '≈ 715 km'], ['Day', '22.8 h'], ['Year', '≈ 306 Earth years'], ['Moons', '1 (MK2, found in 2016)']],
    description: 'A reddish-brown world covered with methane and ethane ice. Discovered shortly after Easter 2005 and named after the creator god of the Rapa Nui people of Easter Island.',
  },
  eris: {
    name: 'Eris', kind: 'Dwarf planet · scattered disc',
    note: 'Never imaged up close: colouring is schematic and the axis orientation has not been measured.',
    facts: [['Radius', '1,163 km'], ['Mass', '1.66 × 10²² kg — 27 % more than Pluto'], ['Day', '≈ 15.8 days (synchronous with its moon)'], ['Year', '≈ 559 Earth years'], ['Moons', '1 (Dysnomia)']],
    description:
      'The discovery of Eris in 2005 — a body more massive than Pluto — forced the International Astronomical Union to define “planet” for the first time in 2006, and Pluto became a dwarf planet. Eris is now almost 100 times farther from the Sun than Earth. Its surface is one of the brightest in the Solar System, probably thanks to fresh methane frost.',
  },
};
