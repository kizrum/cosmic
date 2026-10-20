# Cosmic — an interactive map of the Solar System

**English** · [Русский](README.ru.md)

**Cosmic** is a science outreach project. Its goal is to make knowledge about the Solar
System visual, accurate and open to anyone with a web browser.

Textbooks and encyclopedias describe the planets in words and numbers. Cosmic lets you fly
to them yourself. You can see where the planets are right now, look at the volcanoes of Io
and the methane seas of Titan, find the Apollo 11 landing site, and check what time of day
it is in Gale crater, where the Curiosity rover is working.

## Why this project

- **Spark curiosity.** Every body is more than a set of numbers: it comes with stories of
  discoveries and missions, from Luna 9 and Venera 13 to Cassini, New Horizons and
  Perseverance. Almost every body has sites to explore, and every site has a story.
- **Show the real sky.** Planets, moons and dwarf planets are where they actually are on
  the chosen date. Day and night on Earth, the phase of the Moon and the seasons match
  reality. Pick any date — a birthday or a historic moment — and see what the Solar System
  looked like then.
- **Stand on science.** Positions are computed from NASA/JPL data, axis orientations follow
  the standards of the International Astronomical Union, and surface maps are built from
  spacecraft images. The calculations are checked against the JPL Horizons reference system.
- **Be honest about limits.** Wherever the model simplifies reality it says so: in the
  illustrative mode sizes and distances are compressed, and unimaged parts of surfaces are
  filled in schematically and flagged in the descriptions.

## Who it is for

- School and university students learning astronomy and physics.
- Teachers who need a visual model for a lesson.
- Amateur astronomers and anyone curious about space.

## What you can do

- Pick the Sun, any of the 8 planets, 20 major moons, 5 dwarf planets, the asteroid belt or
  the Kuiper belt, and fly there.
- Explore marked sites: mountains, craters, volcanoes, landing sites, oceans, storms. Sites
  are outlined on the surface and colour-coded by category.
- Click any point on a surface to see its coordinates, local time, the Sun's height and the
  nearest known site.
- Study each body's structure: interior layers, atmospheric composition, key numbers
  compared with Earth.
- Switch between the illustrative and the true scale.
- Speed time up, pause it, or jump to any date.
- Follow the distance to Earth and how long a signal takes to get there.
- Use the interface in English or Russian.

## Scientific basis

| What | Source |
|---|---|
| Planetary orbits | JPL, “Approximate Positions of the Planets” (elements with secular rates, 1800–2050) |
| Orbits of moons and dwarf planets | JPL Horizons, elements as of 2026-10-19 |
| Position of the Moon | J. Meeus, “Astronomical Algorithms” |
| Axes and rotation | IAU WGCCRE: precessing poles, prime meridians |
| Surface maps | NASA, JPL, USGS and images from Voyager, Galileo, Cassini, MESSENGER, Dawn, New Horizons |

Checked against JPL Horizons: direction errors for the planets are hundredths of a degree,
about 0.01° for the Moon, and under 0.2° for moons a year after the element epoch.

**Scale.** There are two modes. In the illustrative mode (the default) body sizes and
distances are compressed by power laws — otherwise the planets would be invisible dots —
while the order of orbits and the nesting of moon systems are preserved (checked by
`npm run check:layout`). The “True scale” button (key `M`) smoothly turns the scene into
real sizes and distances: 1 scene unit = one Earth radius, 1 AU = 23,481 units.

**Simplifications.** The surfaces of Eris, Makemake and Haumea have never been imaged up
close, so their colouring is schematic. Parts of the surfaces of Uranus's moons, Triton,
Pluto and Charon that Voyager 2 and New Horizons did not see are filled with a neutral tone.

## Running it

Requires [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (as required by Vite).

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type check and static build into dist/
npm run preview        # serve the build at http://localhost:4173
npm run check:layout   # verify orbits and moon systems
```

In VS Code: `Ctrl+Shift+B` starts the dev server, `F5` starts it and opens Chrome with the
debugger attached. Other tasks are under “Tasks: Run Task”.

## Controls

- “Objects” button — list of bodies; click a body, its label or a list entry to fly there.
- Click a surface to scan that spot; click inside an outlined site to open it.
- Scroll to zoom, drag to orbit the camera.
- `Esc` — go back a level, `Space` — pause, `,` and `.` — slower and faster.
- `M` — true scale, `L` — fill light on the night side, `I` — collapse or expand the panel.
- Click the date at the top to pick any date (UTC); “Now” returns to the present.
- The RU / EN switch at the top changes the language of the interface and all descriptions.

## Licence

The source code is released under the [MIT License](LICENSE)
([Russian translation](LICENSE.ru.md)): you may use, modify and distribute it freely as long
as the copyright notice is kept.

The MIT License does not cover the surface maps and textures in `public/textures`: they come
with their own terms, listed below.

## Sources and licences

The project uses open scientific data and images. The full list of authors, licences and
changes made (as CC BY and CC BY-SA require) is shown in the app under “Sources & licences”;
the data is in `src/data/credits.ts`.

- Planets, Sun, star field: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0), based on NASA data.
- Moons, Ceres, Pluto, Charon: NASA / JPL / USGS (public domain), via Wikimedia Commons.
- Ganymede: Björn Jónsson. Phobos and Deimos: Askaniy Anpilogov (CC BY-SA 3.0).

NASA material is used without any endorsement by NASA.
