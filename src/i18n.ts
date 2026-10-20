/**
 * Interface language. Russian is the source language of all content; English comes from
 * translation overlays (src/data/en.ts). Missing translations fall back to Russian.
 */
export type Lang = 'ru' | 'en';

const STORE_KEY = 'cosmic.lang';

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export let lang: Lang = detect();
const listeners = new Set<() => void>();

export function setLang(next: Lang) {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(STORE_KEY, next);
  } catch {
    /* keep in memory only */
  }
  applyStatic();
  listeners.forEach((f) => f());
}

export const onLangChange = (f: () => void) => listeners.add(f);

export const locale = () => (lang === 'ru' ? 'ru-RU' : 'en-GB');

/** Locale-aware number formatting. */
export const fmtNum = (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(locale(), opts);

const RU = {
  title: 'Cosmic — Солнечная система',
  subtitle: 'Навигационная карта',
  loading: 'Инициализация навигационной системы',
  boot1: 'Загрузка эфемерид JPL',
  boot2: 'Расчёт орбит на текущую дату',
  boot3: 'Загрузка карт поверхностей',
  boot4: 'Калибровка навигации',
  objects: 'Объекты',
  objectsTitle: 'Список объектов',
  credits: 'Источники и лицензии',
  scaleTitle: 'Наглядный режим сжимает размеры и расстояния, реальный показывает их истинными (M)',
  scaleLabel: 'Масштаб',
  scaleIllustrative: 'Наглядный',
  scaleTrue: 'Реальный',
  settingsTitle: 'Настройки',
  settingsDisplay: 'Отображение',
  orbitsLabel: 'Орбиты и оси',
  lightLabel: 'Подсветка ночной стороны',
  soundLabel: 'Звуки интерфейса',
  shortcuts: 'Горячие клавиши',
  keyBack: 'Назад на уровень выше',
  keyPause: 'Пауза / продолжить',
  keySpeed: 'Медленнее / быстрее',
  keyScale: 'Наглядный / реальный масштаб',
  keyPanel: 'Свернуть / развернуть панель',
  creditsTitle: 'Источники и лицензии',
  close: 'Закрыть',
  changes: 'Изменения',
  play: 'Продолжить',
  pause: 'Пауза',
  playTitle: 'Пауза / продолжить (Пробел)',
  speedTitle: 'Скорость времени (клавиши , и .)',
  slower: 'Медленнее',
  faster: 'Быстрее',
  pickDate: 'Выбрать дату',
  realtime: 'Реальное время',
  dateLabel: 'Дата и время, UTC',
  now: 'Сейчас',
  langTitle: 'Язык интерфейса',

  navPlanets: 'Солнце и планеты',
  navDwarfs: 'Карликовые планеты',
  navBelts: 'Пояса',
  system: 'Солнечная система',
  collapse: 'Свернуть / развернуть (I)',
  tabOverview: 'Обзор',
  tabStructure: 'Строение',
  tabFacts: 'Факты',
  tabSites: 'Районы',
  tabMoons: 'Спутники',
  backSystem: '← К системе',
  backBody: '← Назад',
  backPlanet: '← К планете',
  backMoon: '← К спутнику',
  orbits_around: 'Обращается вокруг',
  sunNoSites: 'Поверхность Солнца — плазма, отдельных районов для посадки нет. Выберите планету.',
  sitesTip: 'Районы обведены на поверхности: наведите курсор, чтобы подсветить, и нажмите, чтобы изучить. ',
  scanTip: 'Нажмите на любую другую точку, чтобы просканировать её.',
  scanSite: 'Сканирование района…',
  scanSector: 'Сканирование сектора…',
  randomPoint: 'Произвольная точка',
  unexplored: 'Неисследованный сектор',
  nearestSite: 'Ближайший изученный район',
  alongSurface: 'км по поверхности',
  ringPlane: 'км от центра, в плоскости колец',
  km: 'км',

  hintSystem: 'Выберите объект — кликом по нему, по метке или в списке «Объекты»',
  hintRegion: 'Вращайте камеру мышью · колесо — приближение · Esc — назад',
  hintBody: 'Вращайте камеру мышью · колесо — приближение · клик по поверхности — сканирование · Esc — назад',
  hintSun: 'Esc — назад к системе',
  hintSite: 'Вращайте камеру вокруг района · колесо — высота · Esc — назад',
  hintNight: 'Район на ночной стороне — включена подсветка (L) · Esc — назад',
  hintBack: 'Esc — назад',

  distEarthNow: 'Расстояние до Земли сейчас',
  distSunNow: 'Расстояние до Солнца сейчас',
  distTo: 'Расстояние до {0}',
  lightToEarth: 'Свет идёт до Земли',
  signalFromEarth: 'Сигнал от Земли идёт',
  phase: 'Фаза',
  ringSun: 'Солнце над плоскостью колец',
  ringLitN: '{0}° (освещена северная сторона)',
  ringLitS: '{0}° (освещена южная сторона)',
  newMoon: 'новолуние',
  fullMoon: 'полнолуние',
  waxCrescent: 'растущий серп',
  wanCrescent: 'убывающий серп',
  waxing: 'растущая Луна',
  waning: 'убывающая Луна',
  illuminated: '{0}, освещено {1} %',
  lighting: 'Освещение',
  day: 'день',
  twilight: 'сумерки, терминатор',
  night: 'ночь',
  sunElev: 'Высота Солнца над горизонтом',
  solarTime: 'Местное солнечное время',
  aboveHorizon: '{0} над горизонтом',
  fixedInSky: '{0}°, всегда на месте',
  notVisible: 'не видна отсюда',
  au: 'а.е.',
  bnKm: 'млрд км',
  mnKm: 'млн км',
  sec: 'с',
  min: 'мин',
  hr: 'ч',

  gravity: 'Гравитация',
  gEarthMark: 'метка — Земля',
  thousandthG: 'тыс. g',
  temperature: 'Температура',
  tempScale: 'шкала от абсолютного нуля до +500 °C · метка — Земля',
  density: 'Плотность',
  lighterWater: 'легче воды',
  denserWater: 'в {0} раза плотнее воды',
  waterMark: 'метка — вода',
  escape: '2-я космическая',
  escapeNote: 'скорость отрыва · метка — Земля',
  ms2: 'м/с²',
  gcm3: 'г/см³',
  ms: 'м/с',
  kms: 'км/с',
  dayLen: 'Сутки',
  yearLen: 'Год',
  orbitLen: 'Оборот',
  radiusAbout: 'радиус ≈ {0} км',
  thickAbout: 'толщина ≈ {0} км',
  timesEarth: '{0} × Земли',
  sameScale: 'Земля и {0} в одном масштабе',
  interior: 'Внутреннее строение',
  model: 'модель',
  layersTip: 'Слои от поверхности к центру; сумма толщин равна радиусу — {0} км.',
  atmosphere: 'Атмосфера',
  noAtmosphere: 'Практически отсутствует.',
  traces: 'следы',

  catVolcanic: 'Вулканизм',
  catImpact: 'Ударные кратеры',
  catWater: 'Вода и лёд',
  catAtmosphere: 'Атмосфера',
  catMission: 'Миссии',
  catTerrain: 'Рельеф',

  lat: ['с. ш.', 'ю. ш.'],
  lon: ['в. д.', 'з. д.'],
} as const;

type Key = keyof typeof RU;
type Dict = { [K in Key]: (typeof RU)[K] extends readonly string[] ? readonly string[] : string };

const EN: Dict = {
  title: 'Cosmic — The Solar System',
  subtitle: 'Navigation map',
  loading: 'Initialising navigation system',
  boot1: 'Loading JPL ephemerides',
  boot2: 'Computing orbits for today',
  boot3: 'Loading surface maps',
  boot4: 'Calibrating navigation',
  objects: 'Objects',
  objectsTitle: 'List of objects',
  credits: 'Sources & licences',
  scaleTitle: 'Illustrative compresses sizes and distances, true shows them as they are (M)',
  scaleLabel: 'Scale',
  scaleIllustrative: 'Illustrative',
  scaleTrue: 'True',
  settingsTitle: 'Settings',
  settingsDisplay: 'Display',
  orbitsLabel: 'Orbits and axes',
  lightLabel: 'Light up the night side',
  soundLabel: 'Interface sounds',
  shortcuts: 'Keyboard shortcuts',
  keyBack: 'Go back a level',
  keyPause: 'Pause / resume',
  keySpeed: 'Slower / faster',
  keyScale: 'Illustrative / true scale',
  keyPanel: 'Collapse / expand the panel',
  creditsTitle: 'Sources & licences',
  close: 'Close',
  changes: 'Changes',
  play: 'Resume',
  pause: 'Pause',
  playTitle: 'Pause / resume (Space)',
  speedTitle: 'Time speed (keys , and .)',
  slower: 'Slower',
  faster: 'Faster',
  pickDate: 'Pick a date',
  realtime: 'Real time',
  dateLabel: 'Date & time, UTC',
  now: 'Now',
  langTitle: 'Interface language',

  navPlanets: 'Sun & planets',
  navDwarfs: 'Dwarf planets',
  navBelts: 'Belts',
  system: 'Solar System',
  collapse: 'Collapse / expand (I)',
  tabOverview: 'Overview',
  tabStructure: 'Structure',
  tabFacts: 'Facts',
  tabSites: 'Sites',
  tabMoons: 'Moons',
  backSystem: '← Solar System',
  backBody: '← Back',
  backPlanet: '← Planet',
  backMoon: '← Moon',
  orbits_around: 'Orbits',
  sunNoSites: 'The Sun’s surface is plasma, so there are no sites to land on. Pick a planet.',
  sitesTip: 'Sites are outlined on the surface: hover to highlight, click to explore. ',
  scanTip: 'Click anywhere else to scan that spot.',
  scanSite: 'Scanning site…',
  scanSector: 'Scanning sector…',
  randomPoint: 'Surface point',
  unexplored: 'Unexplored sector',
  nearestSite: 'Nearest known site',
  alongSurface: 'km over the surface',
  ringPlane: 'km from the centre, in the ring plane',
  km: 'km',

  hintSystem: 'Pick an object — click it, its label or the “Objects” list',
  hintRegion: 'Drag to orbit · scroll to zoom · Esc to go back',
  hintBody: 'Drag to orbit · scroll to zoom · click the surface to scan · Esc to go back',
  hintSun: 'Esc — back to the system',
  hintSite: 'Drag to orbit the site · scroll to change altitude · Esc to go back',
  hintNight: 'Site is on the night side — fill light on (L) · Esc to go back',
  hintBack: 'Esc to go back',

  distEarthNow: 'Distance to Earth now',
  distSunNow: 'Distance to the Sun now',
  distTo: 'Distance to {0}',
  lightToEarth: 'Light reaches Earth in',
  signalFromEarth: 'Signal from Earth takes',
  phase: 'Phase',
  ringSun: 'Sun above the ring plane',
  ringLitN: '{0}° (north face lit)',
  ringLitS: '{0}° (south face lit)',
  newMoon: 'new Moon',
  fullMoon: 'full Moon',
  waxCrescent: 'waxing crescent',
  wanCrescent: 'waning crescent',
  waxing: 'waxing gibbous',
  waning: 'waning gibbous',
  illuminated: '{0}, {1} % lit',
  lighting: 'Lighting',
  day: 'day',
  twilight: 'twilight, terminator',
  night: 'night',
  sunElev: 'Sun above the horizon',
  solarTime: 'Local solar time',
  aboveHorizon: '{0} above the horizon',
  fixedInSky: '{0}°, never moves',
  notVisible: 'not visible from here',
  au: 'AU',
  bnKm: 'billion km',
  mnKm: 'million km',
  sec: 's',
  min: 'min',
  hr: 'h',

  gravity: 'Gravity',
  gEarthMark: 'mark — Earth',
  thousandthG: 'thousandths of g',
  temperature: 'Temperature',
  tempScale: 'scale from absolute zero to +500 °C · mark — Earth',
  density: 'Density',
  lighterWater: 'lighter than water',
  denserWater: '{0}× denser than water',
  waterMark: 'mark — water',
  escape: 'Escape velocity',
  escapeNote: 'speed to break free · mark — Earth',
  ms2: 'm/s²',
  gcm3: 'g/cm³',
  ms: 'm/s',
  kms: 'km/s',
  dayLen: 'Day',
  yearLen: 'Year',
  orbitLen: 'Orbit',
  radiusAbout: 'radius ≈ {0} km',
  thickAbout: 'thickness ≈ {0} km',
  timesEarth: '{0} × Earth',
  sameScale: 'Earth and {0} to the same scale',
  interior: 'Interior',
  model: 'model',
  layersTip: 'Layers from the surface inwards; the thicknesses add up to the radius — {0} km.',
  atmosphere: 'Atmosphere',
  noAtmosphere: 'Practically none.',
  traces: 'traces',

  catVolcanic: 'Volcanism',
  catImpact: 'Impact craters',
  catWater: 'Water & ice',
  catAtmosphere: 'Atmosphere',
  catMission: 'Missions',
  catTerrain: 'Terrain',

  lat: ['N', 'S'],
  lon: ['E', 'W'],
};

const DICTS: Record<Lang, Dict> = { ru: RU as unknown as Dict, en: EN };

type StringKey = { [K in Key]: Dict[K] extends string ? K : never }[Key];

/** Translate a UI string; {0}, {1}… are replaced with the arguments. */
export function t(key: StringKey, ...args: (string | number)[]) {
  const s = DICTS[lang][key] as string;
  return args.length ? s.replace(/\{(\d)\}/g, (_, i) => String(args[Number(i)])) : s;
}

export const tList = (key: 'lat' | 'lon') => DICTS[lang][key];

/** Static markup: elements with data-i18n / data-i18n-title / data-i18n-aria get their text set. */
export function applyStatic() {
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n as StringKey)));
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => (el.title = t(el.dataset.i18nTitle as StringKey)));
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria as StringKey)));
  document.querySelectorAll<HTMLElement>('[data-lang]').forEach((el) => el.classList.toggle('on', el.dataset.lang === lang));
}
