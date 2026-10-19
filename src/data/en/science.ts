/** English overlay for src/data/science.ts. Layers are listed in the same order (centre → surface). */
import type { ScienceEN } from './types';

const sync = (d: string) => `${d} (synchronous)`;

export const EN_SCIENCE: Record<string, ScienceEN> = {
  sun: {
    tempNote: 'photosphere; corona over 1 million °C', day: '25.4 days',
    features: ['Fusion reactor', '99.86 % of the system’s mass', '11-year magnetic cycle'],
    layers: [['Core', 'Hydrogen fuses into helium, ≈15 million K'], ['Radiative zone', 'Photons wander for hundreds of thousands of years'], ['Convective zone', 'Boiling plasma currents, granulation']],
    gasesTitle: 'Composition (by mass)', gasesNote: 'Hydrogen shown as an element; “other” is oxygen, carbon, neon, iron',
  },
  mercury: {
    day: '176 days (solar)', year: '88 days',
    features: ['Shortest year', 'Huge iron core', '3:2 spin–orbit resonance', 'Ice in polar craters'],
    layers: [['Iron core', 'Solid inner and liquid outer'], 'Silicate mantle', ['Crust', '≈ 35 km']],
    gasesTitle: 'Exosphere', gasesNote: 'Nearly a vacuum: pressure 10¹⁵ times lower than on Earth',
  },
  venus: {
    day: '117 days (solar)', year: '225 days',
    features: ['Hottest planet', 'Retrograde rotation', 'Sulphuric acid clouds', '92 atm pressure'],
    layers: ['Iron-nickel core', 'Silicate mantle', ['Basaltic crust', '≈ 30 km']],
    gasesNote: 'Surface pressure is 92 atm — like 900 m deep in the ocean',
  },
  earth: {
    tempNote: 'average +15 °C', day: '24 h', year: '365.26 days',
    features: ['Liquid surface water', 'Life', 'Plate tectonics', 'Magnetic field'],
    layers: [['Inner core', 'Solid iron, ≈5,400 °C'], ['Outer core', 'Liquid iron — source of the magnetic field'], ['Mantle', 'Flows slowly, moving the plates'], ['Crust', '5–70 km']],
    gasesNote: 'Plus water vapour — about 1 % on average',
  },
  moon: {
    day: '29.5 days (solar)', year: '27.3 days around Earth',
    features: ['Synchronous rotation', 'Permanent shadow in polar craters', 'Astronauts’ footprints'],
    layers: ['Inner core', 'Outer core', 'Partially molten layer', 'Mantle', ['Anorthosite crust', '≈ 35–45 km']],
    gasesTitle: 'Exosphere', gasesNote: 'Practically a vacuum',
  },
  mars: {
    tempNote: 'average −63 °C', day: '24 h 40 min', year: '687 days',
    features: ['Tallest volcano', 'Planet-wide dust storms', 'Ancient river beds', 'Rovers at work'],
    layers: [['Liquid core', 'Iron with sulphur (InSight)'], 'Mantle', ['Crust', '≈ 25–70 km']],
    gasesNote: 'Pressure about 0.6 % of Earth’s (Curiosity)',
  },
  jupiter: {
    tempNote: 'at the 1 bar pressure level', day: '9 h 56 min', year: '11.9 years',
    features: ['Largest planet', 'Winds up to 600 km/h', 'Strongest magnetic field', 'Faint rings'],
    layers: [['Dilute core', 'Rock and ice mixed with hydrogen (Juno)'], ['Metallic hydrogen', 'Conducts electricity — generates the magnetic field'], 'Molecular hydrogen', ['Clouds', 'Ammonia, ammonium hydrosulphide, water']],
  },
  saturn: {
    tempNote: 'at the 1 bar pressure level', day: '10 h 34 min', year: '29.5 years',
    features: ['Less dense than water', 'Main rings', 'Hexagon at the pole', '274 moons'],
    layers: [['Dilute core', 'Rock and ice; Cassini ring seismology shows it spread out to ~60 % of the radius'], 'Metallic hydrogen', 'Molecular hydrogen', ['Clouds', 'Ammonia, water']],
  },
  uranus: {
    tempNote: 'at the 1 bar pressure level', day: '17 h 14 min', year: '84 years',
    features: ['Lies on its side', 'Coldest atmosphere', 'Retrograde rotation', '13 dark rings'],
    layers: ['Rocky core', ['“Icy” mantle', 'Hot dense fluid: water, ammonia, methane'], 'Hydrogen–helium envelope'],
    gasesNote: 'Methane absorbs red light — hence the blue colour',
  },
  neptune: {
    tempNote: 'at the 1 bar pressure level', day: '16 h 6 min', year: '165 years',
    features: ['Fastest winds', 'Found “with a pen”', 'Internal heat', 'Dark storms'],
    layers: ['Rocky core', ['“Icy” mantle', 'Water, ammonia, methane; possibly “diamond rain”'], 'Hydrogen–helium envelope'],
  },
  phobos: {
    day: sync('7 h 39 min'),
    features: ['Spiralling into Mars', 'Rises in the west', 'Porous body'],
    layers: ['Porous rocky “rubble pile”', ['Regolith', 'up to a hundred metres of dust']],
  },
  deimos: {
    day: sync('30.3 h'),
    features: ['Smooth surface', 'Almost still in the Martian sky'],
    layers: ['Porous rocky body', 'Thick regolith'],
  },
  io: {
    tempNote: 'surface; lava up to +1,600 °C', day: sync('1.77 days'),
    features: ['400+ active volcanoes', 'Tidal heating', 'Sulphur deposits', '1:2:4 resonance'],
    layers: ['Iron core', ['Partially molten mantle', 'A magma “ocean” beneath the crust'], ['Crust', '≈ 30–50 km']],
    gasesTitle: 'Thin atmosphere', gasesNote: 'Replenished by volcanoes, freezes out in Jupiter’s shadow',
  },
  europa: {
    day: sync('3.55 days'),
    features: ['Subsurface ocean', 'Candidate for life', 'Young smooth crust'],
    layers: ['Metallic core', 'Rocky mantle', ['Salty ocean', '≈ 100 km deep'], ['Ice shell', '≈ 15–25 km']],
    gasesTitle: 'Exosphere', gasesNote: 'Oxygen split off the ice by Jupiter’s radiation',
  },
  ganymede: {
    day: sync('7.15 days'),
    features: ['Largest moon', 'Own magnetic field', 'Subsurface ocean', 'Auroras'],
    layers: ['Iron core', 'Rocky mantle', 'High-pressure ice', 'Salty ocean', 'Ice shell'],
  },
  callisto: {
    day: sync('16.7 days'),
    features: ['Most cratered surface', 'Barely changed in 4 billion years', 'Outside the radiation belts'],
    layers: [['Rock–ice mixture', 'Only partly differentiated'], 'Possible ocean', 'Ice shell'],
  },
  mimas: {
    day: sync('22.6 h'),
    features: ['“Death Star”', 'Young hidden ocean (2024)', 'Clears the Cassini Division'],
    layers: ['Rocky core', 'Ocean', ['Ice shell', '≈ 20–30 km']],
  },
  enceladus: {
    tempNote: 'noticeably warmer at the “tiger stripes”', day: sync('1.37 days'),
    features: ['Geysers from a hidden ocean', 'Whitest surface', 'Feeds the E ring', 'Phosphates, organics, H₂'],
    layers: ['Porous rocky core', 'Global ocean', ['Ice shell', '≈ 20 km, ≈ 5 km at the south pole']],
    gasesTitle: 'Plume composition (Cassini)', gasesNote: 'Water ≈ 96–99 %; the rest is ammonia, hydrogen, CO₂, methane, organics',
  },
  tethys: {
    day: sync('1.89 days'),
    features: ['Almost pure ice', 'Ithaca Chasma', 'Odysseus crater'],
    layers: [['Water ice', 'Almost no rock']],
  },
  dione: {
    day: sync('2.74 days'),
    features: ['Ice cliffs', 'Likely deep ocean'],
    layers: ['Rocky core', 'Possible ocean', 'Ice shell'],
  },
  rhea: {
    day: sync('4.52 days'),
    features: ['Saturn’s second-largest moon', 'Oxygen exosphere'],
    layers: [['Ice–rock mixture', 'Interior probably barely differentiated']],
    gasesTitle: 'Exosphere',
  },
  titan: {
    day: sync('15.9 days'),
    features: ['Thick atmosphere', 'Methane rain and seas', 'Subsurface ocean', 'Dragonfly target'],
    layers: [['Rocky core', 'Hydrated silicates'], 'High-pressure ice', 'Water–ammonia ocean', 'Ice shell'],
    gasesNote: 'At the surface (Huygens). Pressure 1.45 atm with weak gravity: a person with wings could fly',
  },
  iapetus: {
    day: sync('79.3 days'),
    features: ['Two-faced: black and white', 'Equatorial ridge', 'Walnut shape'],
    layers: ['Ice with some rock'],
  },
  miranda: {
    day: sync('1.41 days'),
    features: ['“Patchwork” surface', '20 km high cliff'],
    layers: ['Rocky core', 'Icy mantle'],
  },
  ariel: {
    day: sync('2.52 days'),
    features: ['Youngest surface at Uranus', 'Rift valleys'],
    layers: ['Rocky core', 'Icy mantle'],
  },
  umbriel: {
    day: sync('4.14 days'),
    features: ['Darkest at Uranus', 'Mysterious bright ring'],
    layers: ['Rocky core', 'Icy mantle'],
  },
  titania: {
    day: sync('8.71 days'),
    features: ['Largest at Uranus', 'Canyons 1,500 km long'],
    layers: ['Rocky core', 'Possible thin ocean', 'Ice shell'],
  },
  oberon: {
    day: sync('13.5 days'),
    features: ['Ancient craters', 'Dark material on crater floors'],
    layers: ['Rocky core', 'Icy mantle'],
  },
  triton: {
    day: sync('5.88 days'),
    features: ['Retrograde orbit', 'Nitrogen geysers', 'Captured Kuiper belt object'],
    layers: ['Rocky core', 'Icy mantle, possibly with an ocean', 'Nitrogen ice crust'],
    gasesNote: 'Pressure about 1.4 Pa — 70,000 times lower than on Earth',
  },
  charon: {
    day: sync('6.39 days'),
    features: ['Half the size of Pluto', 'Double system', 'Red “Mordor” cap'],
    layers: ['Rocky core', ['Icy mantle', 'Its ancient ocean froze long ago']],
  },
  ceres: {
    day: '9 h 4 min', year: '4.6 years',
    features: ['Largest body in the belt', 'Salt faculae', 'Remnant brine inside'],
    layers: ['Rocky interior', 'Remnant brine', ['Crust: ice, salts, clays', '≈ 40 km']],
  },
  pluto: {
    day: '6.39 days', year: '248 years',
    features: ['Nitrogen glaciers', 'Blue haze', 'Likely subsurface ocean', '5 moons'],
    layers: ['Rocky core', 'Likely ocean', 'Ice shell', 'Nitrogen and methane ice'],
    gasesNote: 'Pressure about 1 Pa; the atmosphere freezes out as Pluto moves away from the Sun',
  },
  haumea: {
    tempNote: 'estimate', day: '3 h 55 min', year: '283 years',
    features: ['Rugby-ball shape', 'Has a ring', 'Crystalline ice'],
    layers: ['Rocky interior', 'Water-ice crust'],
  },
  makemake: {
    tempNote: 'estimate', day: '22.8 h', year: '306 years',
    features: ['Methane ice', 'Reddish colour'],
    layers: ['Rocky interior', 'Icy mantle'],
  },
  eris: {
    day: '15.8 days', year: '559 years',
    features: ['More massive than Pluto', 'Very bright surface', 'Why Pluto was “demoted”'],
    layers: ['Rocky interior', 'Icy mantle'],
  },
};

/** Gas labels that are words rather than formulas. */
export const EN_GAS: Record<string, string> = { другие: 'other' };
