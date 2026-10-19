/** English overlay for the Sun, planets and the Moon (source texts: src/data/bodies.ts). */
import type { BodyEN } from './types';

export const EN_PLANETS: Record<string, BodyEN> = {
  sun: {
    name: 'Sun', kind: 'Star · G2V yellow dwarf',
    facts: [
      ['Radius', '696,340 km (109 Earths)'],
      ['Mass', '1.989 × 10³⁰ kg (333,000 Earths)'],
      ['Photosphere temperature', '5,772 K'],
      ['Core temperature', '≈ 15.7 million K'],
      ['Rotation period', '25.4 days at the equator, ~35 days at the poles'],
      ['Age', '≈ 4.6 billion years'],
    ],
    description:
      'The Sun holds 99.86 % of the mass of the Solar System. Every second its core fuses about 600 million tonnes of hydrogen into helium, and part of that mass becomes radiation. Light leaving the photosphere reaches Earth in 8 minutes 20 seconds, although energy from the core takes tens of thousands of years to work its way to the surface. The Sun rotates differentially: the equator turns faster than the poles.',
  },
  mercury: {
    name: 'Mercury', kind: 'Terrestrial planet',
    facts: [
      ['Radius', '2,439.7 km (0.38 Earth)'],
      ['Mass', '3.301 × 10²³ kg (0.055 Earth)'],
      ['Surface gravity', '3.7 m/s²'],
      ['Sidereal day', '58.6 Earth days'],
      ['Solar day', '176 Earth days'],
      ['Year', '88 Earth days'],
      ['Temperature', '−173 … +427 °C'],
      ['Moons', 'none'],
    ],
    description:
      'The smallest planet and the closest to the Sun. It has almost no atmosphere, only a thin exosphere, so the surface heats up to +427 °C by day and cools to −173 °C at night. Its spin is locked to its orbit in a 3:2 resonance: three turns on its axis for every two trips around the Sun. The iron core takes up about 85 % of the planet’s radius. Mercury was explored by Mariner 10 and MESSENGER (2011–2015); the European-Japanese BepiColombo mission is on its way.',
    sites: {
      caloris: {
        name: 'Caloris Planitia', kind: 'Impact basin',
        description: 'One of the largest impact basins in the Solar System. The asteroid strike about 3.8 billion years ago was so violent that seismic waves converging on the opposite side of the planet created “chaotic” hilly terrain there. The name means “plain of heat”: the basin faces the Sun at perihelion.',
        facts: [['Diameter', '≈ 1,550 km'], ['Age', '≈ 3.8 billion years']],
      },
      rachmaninoff: {
        name: 'Rachmaninoff crater', kind: 'Peak-ring basin',
        description: 'The inner ring of the basin is filled with some of Mercury’s youngest volcanic plains, showing that volcanism on the planet lasted much longer than was thought before MESSENGER.',
        facts: [['Diameter', '≈ 290 km']],
      },
      hokusai: {
        name: 'Hokusai crater', kind: 'Young rayed crater',
        description: 'Bright ejecta rays stretch thousands of kilometres from the crater. They are still bright because space weathering has not yet darkened them: geologically, the crater is very young.',
        facts: [['Diameter', '≈ 95 km']],
      },
      'discovery-rupes': {
        name: 'Discovery Rupes', kind: 'Tectonic scarp',
        description: 'A giant cliff up to 2 km high. Scarps like this formed as the cooling core shrank and the crust “wrinkled”. According to MESSENGER, Mercury’s radius has shrunk by about 7 km.',
        facts: [['Length', '≈ 650 km'], ['Height', 'up to 2 km']],
      },
      'chao-meng-fu': {
        name: 'Chao Meng-Fu crater', kind: 'Polar crater, water ice',
        description: 'Because Mercury’s axis is almost upright, the floors of polar craters never see sunlight. Radar from Earth and MESSENGER data showed that these “cold traps” hold water ice — on the planet closest to the Sun.',
        facts: [['Diameter', '≈ 167 km']],
      },
    },
  },
  venus: {
    name: 'Venus', kind: 'Terrestrial planet',
    facts: [
      ['Radius', '6,051.8 km (0.95 Earth)'],
      ['Mass', '4.867 × 10²⁴ kg (0.815 Earth)'],
      ['Surface gravity', '8.87 m/s²'],
      ['Sidereal day', '243 Earth days, retrograde'],
      ['Solar day', '116.75 Earth days'],
      ['Year', '224.7 Earth days'],
      ['Surface temperature', '≈ +464 °C'],
      ['Surface pressure', '92 atm'],
      ['Atmosphere', '96.5 % CO₂, sulphuric acid clouds'],
    ],
    description:
      'The hottest planet in the Solar System, although it is twice as far from the Sun as Mercury. Its dense carbon dioxide atmosphere drives an extreme greenhouse effect. Venus spins backwards, and its day is longer than its year. The cloud deck “super-rotates”, circling the planet in about 4 Earth days. The surface was mapped by the Magellan radar (1990–1994), and Soviet Venera landers sent back pictures from the ground. When you inspect a site, the clouds are removed to show the radar map of the surface.',
    sites: {
      maxwell: {
        name: 'Maxwell Montes', kind: 'Mountain range',
        description: 'The highest mountains on Venus, about 11 km above the mean surface. It is the only major feature on Venus with a man’s name (James Clerk Maxwell): all others are named after women and goddesses.',
        facts: [['Height', '≈ 11 km']],
      },
      ishtar: {
        name: 'Ishtar Terra', kind: 'Highland “continent”',
        description: 'One of the two main highland regions of Venus, comparable to Australia in area. It includes Lakshmi Planum, a plateau ringed by mountain belts.',
      },
      aphrodite: {
        name: 'Aphrodite Terra', kind: 'Highland',
        description: 'The largest highland on Venus, stretching about 10,000 km along the equator. Its terrain is cut by faults and rift zones.',
        facts: [['Length', '≈ 10,000 km']],
      },
      maat: {
        name: 'Maat Mons', kind: 'Shield volcano',
        description: 'The largest volcano on Venus. In 2023 a re-analysis of Magellan images showed that a vent on its flank changed shape over eight months in 1991 — the first direct evidence of present-day volcanic activity on Venus.',
        facts: [['Height', '≈ 8 km']],
      },
      venera13: {
        name: 'Venera 13 landing site', kind: 'Soviet lander',
        description: 'On 1 March 1982 the Venera 13 lander touched down and worked for 127 minutes at 457 °C and 89 atm. It returned the first colour panoramas of the surface, analysed a soil sample and recorded the sound of the Venusian wind.',
        facts: [['Landing', '1 March 1982'], ['Operating time', '127 minutes']],
      },
      mead: {
        name: 'Mead crater', kind: 'Impact crater',
        description: 'The largest impact crater on Venus. There are few craters on the planet and they are all about the same age, which suggests the whole surface was resurfaced by volcanism some 300–700 million years ago.',
        facts: [['Diameter', '≈ 270 km']],
      },
    },
  },
  earth: {
    name: 'Earth', kind: 'Terrestrial planet',
    facts: [
      ['Radius', '6,371 km'],
      ['Mass', '5.972 × 10²⁴ kg'],
      ['Surface gravity', '9.81 m/s²'],
      ['Sidereal day', '23 h 56 min 4 s'],
      ['Year', '365.26 days'],
      ['Mean temperature', '+15 °C (records −89.2 … +56.7 °C)'],
      ['Atmosphere', '78 % N₂, 21 % O₂'],
      ['Moons', '1 — the Moon'],
    ],
    description:
      'The only place in the Universe known to host life. About 71 % of the surface is ocean. The magnetic field shields the atmosphere from the solar wind. The 23.44° tilt of the axis gives us the seasons. Day and night are shown for the current moment; city lights on the night side come from NASA’s Black Marble data.',
    sites: {
      everest: {
        name: 'Mount Everest (Chomolungma)', kind: 'Highest peak',
        description: 'The highest point above sea level. The Himalayas are still rising as the Indian plate pushes into Eurasia at about 4–5 cm a year. Edmund Hillary and Tenzing Norgay made the first ascent on 29 May 1953.',
        facts: [['Height', '8,849 m (2020 survey)']],
      },
      mariana: {
        name: 'Challenger Deep', kind: 'Deepest point of the ocean',
        description: 'The deepest part of the Mariana Trench, where the Pacific plate dives beneath the Philippine plate. Pressure on the bottom exceeds 1,000 atm. Jacques Piccard and Don Walsh made the first descent in the bathyscaphe Trieste in 1960.',
        facts: [['Depth', '≈ 10,935 m']],
      },
      chicxulub: {
        name: 'Chicxulub crater', kind: 'Buried impact crater',
        description: 'The scar of a roughly 10 km asteroid that struck 66 million years ago. The impact caused a global catastrophe and the end-Cretaceous mass extinction that wiped out the non-avian dinosaurs. The crater lies hidden beneath the sediments of the Yucatán Peninsula.',
        facts: [['Diameter', '≈ 180 km'], ['Age', '66 million years']],
      },
      amazon: {
        name: 'Amazon rainforest', kind: 'Tropical forest',
        description: 'The largest tropical forest on the planet, home to about 10 % of all known species. The forest makes much of its own rain: trees release moisture that forms “flying rivers” in the atmosphere.',
        facts: [['Area', '≈ 5.5 million km²']],
      },
      baikonur: {
        name: 'Baikonur Cosmodrome', kind: 'Spaceport',
        description: 'The first artificial satellite was launched from here on 4 October 1957, and Yuri Gagarin, the first human in space, on 12 April 1961.',
        facts: [['Sputnik 1', '4 October 1957'], ['Vostok 1', '12 April 1961']],
      },
      vostok: {
        name: 'Vostok Station', kind: 'Pole of cold',
        description: 'On 21 July 1983 the station recorded −89.2 °C, the lowest temperature ever measured by a weather station. Beneath 4 km of ice lies Lake Vostok, cut off from the atmosphere for millions of years.',
        facts: [['Record', '−89.2 °C']],
      },
      reef: {
        name: 'Great Barrier Reef', kind: 'Coral reef',
        description: 'The largest structure built by living organisms, visible from space. It consists of nearly 3,000 individual reefs. Ocean warming is causing repeated mass coral bleaching.',
        facts: [['Length', '≈ 2,300 km']],
      },
    },
  },
  moon: {
    name: 'Moon', kind: 'Earth’s natural satellite',
    facts: [
      ['Radius', '1,737.4 km (0.27 Earth)'],
      ['Mass', '7.342 × 10²² kg (1/81 Earth)'],
      ['Surface gravity', '1.62 m/s²'],
      ['Orbital period', '27.32 days (synchronous rotation)'],
      ['Distance from Earth', '384,400 km on average'],
      ['Temperature', '−173 … +127 °C'],
    ],
    description:
      'The Moon formed about 4.5 billion years ago, probably from the debris of a collision between the young Earth and a Mars-sized body (the Theia hypothesis). Tides have synchronised its rotation, so it always shows us the same face. The dark “seas” are solidified basalt lava. It is the only other world people have walked on: 12 astronauts between 1969 and 1972.',
    sites: {
      apollo11: {
        name: 'Tranquility Base (Apollo 11)', kind: 'Landing site',
        description: 'On 20 July 1969 Neil Armstrong and Buzz Aldrin became the first people to walk on another world. They collected 21.5 kg of samples and left a retroreflector that is still used for lunar laser ranging.',
        facts: [['Date', '20 July 1969'], ['Mare', 'Sea of Tranquility']],
      },
      tycho: {
        name: 'Tycho crater', kind: 'Young rayed crater',
        description: 'One of the most prominent craters on the Moon. Its bright rays reach 1,500 km and are easy to see with binoculars at full Moon. By lunar standards it is young: about 108 million years. Surveyor 7 landed nearby in 1968.',
        facts: [['Diameter', '85 km'], ['Age', '≈ 108 million years']],
      },
      copernicus: {
        name: 'Copernicus crater', kind: 'Impact crater',
        description: 'A textbook complex crater with terraced walls and central peaks, about 800 million years old. The Copernican period of the lunar time scale is named after it.',
        facts: [['Diameter', '93 km']],
      },
      imbrium: {
        name: 'Mare Imbrium', kind: 'Lunar mare',
        description: 'A huge impact basin later flooded with basalt lava. On 17 November 1970 Lunokhod 1 began work here — the first remotely driven rover on another world. It travelled 10.5 km in ten months.',
        facts: [['Diameter', '≈ 1,145 km'], ['Lunokhod 1', '17 Nov 1970']],
      },
      luna9: {
        name: 'Luna 9 landing site', kind: 'Soviet lander',
        description: 'On 3 February 1966 Luna 9 made the first soft landing on another world and sent back panoramas of the surface. The landing proved that the ground could support a spacecraft.',
        facts: [['Date', '3 February 1966']],
      },
      shackleton: {
        name: 'Shackleton crater', kind: 'Polar crater',
        description: 'A crater almost exactly at the south pole. Its floor is in permanent shadow, colder than −170 °C, where water ice survives. The ridges around it are sunlit most of the time, making the area a prime target for crewed Artemis missions.',
        facts: [['Diameter', '≈ 21 km']],
      },
      change4: {
        name: 'Von Kármán crater (Chang’e 4)', kind: 'Far side of the Moon',
        description: 'On 3 January 2019 the Chinese Chang’e 4 lander made the first soft landing on the far side of the Moon, relaying its signal through a satellite orbiting the L2 Lagrange point. In 2024 Chang’e 6 returned the first samples from the far side.',
        facts: [['Landing', '3 January 2019']],
      },
    },
  },
  mars: {
    name: 'Mars', kind: 'Terrestrial planet',
    facts: [
      ['Radius', '3,389.5 km (0.53 Earth)'],
      ['Mass', '6.417 × 10²³ kg (0.107 Earth)'],
      ['Surface gravity', '3.72 m/s²'],
      ['Solar day (sol)', '24 h 39 min'],
      ['Year', '687 Earth days'],
      ['Temperature', '−153 … +20 °C, average −63 °C'],
      ['Atmosphere', '95 % CO₂, pressure ~0.6 % of Earth’s'],
      ['Moons', '2 — Phobos and Deimos'],
    ],
    description:
      'Iron oxides in the dust give Mars its red colour. Billions of years ago it was warmer and wetter: dry river channels, deltas and lake sediments remain. The polar caps are water ice, topped in winter with dry ice (CO₂). The Curiosity and Perseverance rovers are at work here, and the Ingenuity helicopter made 72 flights — the first powered flights on another planet.',
    sites: {
      olympus: {
        name: 'Olympus Mons', kind: 'Shield volcano',
        description: 'The largest known volcano in the Solar System. With low gravity and no plate tectonics, lava poured out over the same spot for ages. The slopes are so gentle that from the summit you could not see the edge of the mountain — it lies beyond the horizon.',
        facts: [['Height', '≈ 21.9 km above the mean level'], ['Base diameter', '≈ 600 km']],
      },
      valles: {
        name: 'Valles Marineris', kind: 'Canyon system',
        description: 'A gigantic system of rifts along the equator. On Earth it would stretch from New York to Los Angeles. Unlike the Grand Canyon, it was not carved by water but formed as the crust stretched when the Tharsis volcanic region rose.',
        facts: [['Length', 'more than 4,000 km'], ['Depth', 'up to 7 km']],
      },
      gale: {
        name: 'Gale crater (Curiosity)', kind: 'Rover site',
        description: 'Curiosity has been working here since 6 August 2012. It showed that the crater once held a freshwater lake with conditions suitable for microbial life and found organic molecules. In the centre rises the layered Mount Sharp, a record of Mars’s climate history.',
        facts: [['Diameter', '154 km'], ['Mount Sharp', '≈ 5.5 km'], ['Landing', '6 August 2012']],
      },
      jezero: {
        name: 'Jezero crater (Perseverance)', kind: 'Ancient lake and delta',
        description: 'About 3.5 billion years ago the crater was a lake fed by a river with a delta. Since 18 February 2021 Perseverance has been collecting rock samples here for a future return to Earth. In 2024 it found the “Cheyava Falls” rock with possible biosignatures: not proof of life, but a strong candidate to test.',
        facts: [['Diameter', '45 km'], ['Landing', '18 February 2021']],
      },
      hellas: {
        name: 'Hellas Planitia', kind: 'Impact basin',
        description: 'The largest well-preserved impact basin on Mars and the lowest region of the planet. The pressure on its floor is almost twice the mean, so at the right temperature pure water could briefly stay liquid there.',
        facts: [['Diameter', '≈ 2,300 km'], ['Depth', '≈ 7 km']],
      },
      'north-cap': {
        name: 'North polar cap', kind: 'Polar ice',
        description: 'A dome of layered water ice and dust up to 3 km thick. The layers record climate cycles driven by changes in the tilt of Mars’s axis. Melted, the cap would cover Mars with water several metres deep.',
        facts: [['Diameter', '≈ 1,000 km']],
      },
      zhurong: {
        name: 'Utopia (Zhurong)', kind: 'Rover site',
        description: 'Utopia Planitia is the largest impact basin on Mars. In May 2021 the Chinese rover Zhurong landed here. Its ground-penetrating radar found layered deposits beneath the surface that resemble ancient shorelines.',
        facts: [['Landing', '15 May 2021']],
      },
    },
  },
  jupiter: {
    name: 'Jupiter', kind: 'Gas giant',
    facts: [
      ['Radius', '69,911 km (11.2 Earths)'],
      ['Mass', '1.898 × 10²⁷ kg (318 Earths)'],
      ['Gravity', '24.8 m/s²'],
      ['Day', '9 h 56 min'],
      ['Year', '11.86 Earth years'],
      ['Temperature (1 bar level)', '−108 °C'],
      ['Composition', '≈ 90 % H₂, 10 % He'],
      ['Moons', '95+ (including the Galilean moons)'],
    ],
    description:
      'The largest planet: Jupiter is 2.5 times as massive as all the other planets combined. It has no solid surface; the atmosphere gradually turns into liquid metallic hydrogen. The light “zones” are regions of rising gas with ammonia clouds, the dark “belts” regions of sinking gas. Its magnetic field is 20,000 times stronger than Earth’s. Fast rotation has flattened the planet at the poles, as the model shows. Juno has orbited Jupiter since 2016, and Europa Clipper and JUICE are on their way to its moons.',
    sites: {
      grs: {
        name: 'Great Red Spot', kind: 'Anticyclone',
        description: 'A giant storm watched continuously since the 1830s, and possibly since 1665. Winds at its edge reach 430 km/h. The spot is shrinking: in the 19th century three Earths would have fitted inside, now just over one. According to Juno, its roots extend 300–500 km deep.',
        facts: [['Size', '≈ 16,000 km'], ['Wind speed', 'up to 430 km/h']],
      },
      'oval-ba': {
        name: 'Oval BA', kind: 'Anticyclone',
        description: 'In 1998–2000 three white ovals that had existed since the 1930s merged into one. In 2005–2006 it turned red and was nicknamed “Red Spot Junior”. Storms drift in longitude, so the position shown is approximate.',
        facts: [['Size', '≈ the size of Earth']],
      },
      'north-pole': {
        name: 'North polar cyclones', kind: 'Cyclone cluster',
        description: 'Juno discovered geometric clusters of cyclones at Jupiter’s poles: in the north, eight storms surround a central one; in the south, five (later six). Each is larger than India. Why the pattern is stable is still being studied.',
      },
      neb: {
        name: 'North Equatorial Belt', kind: 'Cloud belt',
        description: 'One of the most active belts. Holes in the clouds let internal heat escape, and powerful thunderstorms rage: Jupiter’s lightning is many times stronger than Earth’s.',
      },
      'galileo-probe': {
        name: 'Galileo probe entry site', kind: 'Atmospheric probe',
        description: 'On 7 December 1995 the Galileo descent probe entered the atmosphere at 47 km/s, worked for 58 minutes and reached a pressure of 23 bar. It found less water than expected: the probe had fallen into a rare dry “hot spot”.',
        facts: [['Date', '7 December 1995']],
      },
    },
  },
  saturn: {
    name: 'Saturn', kind: 'Gas giant',
    facts: [
      ['Radius', '58,232 km (9.45 Earths)'],
      ['Mass', '5.683 × 10²⁶ kg (95 Earths)'],
      ['Gravity', '10.4 m/s²'],
      ['Day', '10 h 34 min'],
      ['Year', '29.46 Earth years'],
      ['Mean density', '0.69 g/cm³ — less than water'],
      ['Rings', 'Ø ≈ 270,000 km, ~10 m thick'],
      ['Moons', '274 (as of 2025)'],
    ],
    description:
      'Saturn is less dense than water on average. Its rings are 99 % water ice, from dust grains to house-sized boulders; hundreds of thousands of kilometres across, they are typically only about 10 metres thick. The Cassini mission (2004–2017) ended with a deliberate plunge into the atmosphere. Titan, with its thick atmosphere and methane lakes, and Enceladus, with geysers from a subsurface ocean, are leading candidates in the search for life.',
    sites: {
      hexagon: {
        name: 'North polar hexagon', kind: 'Polar jet stream',
        description: 'A stable six-sided jet stream around the north pole, discovered by Voyager in 1981 and still there today. Each side is longer than Earth’s diameter. The shape is explained by standing waves in the atmosphere; its colour changes with the seasons.',
        facts: [['Side length', '≈ 14,500 km'], ['Wind speed', '≈ 320 km/h']],
      },
      'south-vortex': {
        name: 'South polar vortex', kind: 'Hurricane',
        description: 'Cassini found a storm over the south pole with a sharp “eye” and eyewall, like a terrestrial hurricane. The eye is about 8,000 km wide, with winds up to 550 km/h.',
        facts: [['Eye width', '≈ 8,000 km']],
      },
      'great-white-spot': {
        name: 'Great White Spot 2010–2011', kind: 'Seasonal storm',
        description: 'About once per Saturnian year (roughly 30 Earth years) a giant thunderstorm erupts in the atmosphere. The 2010–2011 storm wrapped around the whole planet within six months, and Cassini watched it up close.',
      },
      'cassini-division': {
        name: 'Cassini Division', kind: 'Gap in the rings',
        description: 'A gap about 4,700 km wide between the A and B rings, discovered by Giovanni Cassini in 1675. It is cleared by a resonance with the moon Mimas: particles here make exactly two orbits for each of Mimas’s, and the regular gravitational nudges throw them out.',
        facts: [['Width', '≈ 4,700 km']],
      },
      'grand-finale': {
        name: 'Cassini’s Grand Finale', kind: 'Where the probe ended',
        description: 'On 15 September 2017 Cassini, almost out of fuel, entered Saturn’s atmosphere and sent data until its last seconds. This ruled out any chance of contaminating Enceladus or Titan with Earth microbes.',
        facts: [['Date', '15 September 2017']],
      },
    },
  },
  uranus: {
    name: 'Uranus', kind: 'Ice giant',
    facts: [
      ['Radius', '25,362 km (4 Earths)'],
      ['Mass', '8.681 × 10²⁵ kg (14.5 Earths)'],
      ['Gravity', '8.7 m/s²'],
      ['Day', '17 h 14 min, retrograde'],
      ['Year', '84 Earth years'],
      ['Axial tilt', '97.8°'],
      ['Minimum temperature', '−224 °C'],
      ['Moons', '29 (as of 2025)'],
    ],
    description:
      'Uranus “lies on its side”: its axis is tilted almost 98°, probably after an ancient collision. So each pole gets 42 years of sunlight followed by 42 years of darkness. Beneath an atmosphere of hydrogen, helium and methane lies a hot, dense “mantle” of water, ammonia and methane. Methane absorbs red light, hence the bluish colour. Only Voyager 2 has seen Uranus up close, in January 1986.',
    sites: {
      'south-pole': {
        name: 'South pole', kind: 'Polar region',
        description: 'When Voyager 2 flew past in 1986, Uranus had its south pole turned to the Sun. Almost all images from that time show this hemisphere, which looked smooth and featureless.',
      },
      'north-cap': {
        name: 'North polar cap', kind: 'Seasonal haze',
        description: 'As northern summer approaches (solstice in 2028), a bright polar cap of haze has formed over the north pole, clearly visible in Hubble and JWST images.',
      },
      'dark-spot': {
        name: 'Dark spot of 2006', kind: 'Vortex',
        description: 'In 2006 Hubble photographed a dark spot on Uranus for the first time — a vortex roughly 1,700 × 3,000 km. It showed that Uranus’s atmosphere is far more active than Voyager suggested.',
      },
    },
  },
  neptune: {
    name: 'Neptune', kind: 'Ice giant',
    facts: [
      ['Radius', '24,622 km (3.9 Earths)'],
      ['Mass', '1.024 × 10²⁶ kg (17 Earths)'],
      ['Gravity', '11.2 m/s²'],
      ['Day', '16 h 6 min'],
      ['Year', '164.8 Earth years'],
      ['Temperature', '−214 °C'],
      ['Winds', 'up to 2,100 km/h — the fastest'],
      ['Moons', '16'],
    ],
    description:
      'Neptune was discovered “with the tip of a pen”: Urbain Le Verrier calculated its position from disturbances in Uranus’s orbit, and in 1846 Johann Galle found it almost exactly there. Neptune radiates 2.6 times more heat than it receives from the Sun. Its moon Triton orbits backwards and is probably a captured Kuiper belt object. The colour in the model follows a 2024 study: the deep blue Neptune of classic Voyager images is a processing artefact; it is really pale blue, only slightly bluer than Uranus.',
    sites: {
      gds: {
        name: 'Great Dark Spot', kind: 'Anticyclone (1989)',
        description: 'Voyager 2 found an Earth-sized storm in 1989, accompanied by white “companion” clouds of methane ice. When Hubble looked again in 1994 the spot was gone: storms on Neptune last years, not centuries as on Jupiter.',
        facts: [['Size', '≈ 13,000 × 6,600 km']],
      },
      scooter: {
        name: '“Scooter”', kind: 'Cloud feature',
        description: 'A fast-moving white cloud, named because it raced ahead of other features in the atmosphere. It circled the planet in about 16 hours.',
      },
      d2: {
        name: 'Small Dark Spot (D2)', kind: 'Vortex',
        description: 'A second dark vortex seen by Voyager 2. It had a bright core, probably clouds rising over the vortex as over a mountain.',
      },
    },
  },
};
