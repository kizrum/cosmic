/**
 * Structure, composition and headline numbers for each body.
 * Interior layer boundaries are fractions of the mean radius (outer edge of each layer).
 * Values: NASA Planetary Fact Sheets, Juno/Cassini/InSight/Dawn/New Horizons results.
 */

export type Material =
  | 'plasma-core' | 'plasma-rad' | 'plasma-conv'
  | 'iron-inner' | 'iron' | 'iron-liquid' | 'mantle' | 'mantle-melt' | 'crust' | 'regolith'
  | 'ocean' | 'ice' | 'ice-hp' | 'nitrogen-ice' | 'rock-ice' | 'rock'
  | 'metallic-h' | 'molecular-h' | 'clouds' | 'ice-giant' | 'core-dilute' | 'haze';

export const MATERIAL_COLOR: Record<Material, string> = {
  'plasma-core': '#fff2a8', 'plasma-rad': '#ffc94d', 'plasma-conv': '#ff8f2e',
  'iron-inner': '#ffd08a', iron: '#ff8a4a', 'iron-liquid': '#ff6a3d',
  mantle: '#b5532f', 'mantle-melt': '#d9672e', crust: '#8f7a64', regolith: '#9a9184',
  ocean: '#2f86e0', ice: '#cdeaff', 'ice-hp': '#8fbfdf', 'nitrogen-ice': '#f2e6dc',
  'rock-ice': '#8d929c', rock: '#7a6a5c',
  'metallic-h': '#7d86ff', 'molecular-h': '#a9c2ff', clouds: '#f0dfbc',
  'ice-giant': '#4fc3c8', 'core-dilute': '#c9a46c', haze: '#d99a45',
};

export const GAS_COLOR: Record<string, string> = {
  'H₂': '#7fb3ff', He: '#ffd27f', 'CO₂': '#ff8a65', 'N₂': '#7fe3c4', 'O₂': '#5aa8ff', Ar: '#c79bff',
  'CH₄': '#9cff7f', 'NH₃': '#ff7fd1', 'SO₂': '#ffe066', 'H₂O': '#6fd3ff', CO: '#c9c9c9', Na: '#ffb347',
  K: '#e0a0ff', O: '#8fd0ff', H: '#b0c8ff', 'другие': '#6f8296', other: '#6f8296',
};

export interface Layer {
  m: Material;
  name: string;
  /** Outer edge as a fraction of the radius. */
  to: number;
  detail?: string;
}

export interface Gas {
  gas: string;
  /** Percent by volume (omitted when only detected, not measured). */
  pct?: number;
}

export interface Science {
  gravity: number; // m/s²
  density: number; // g/cm³
  escape: number; // km/s
  /** °C: single value or [min, max]. */
  temp: number | [number, number];
  tempNote?: string;
  day?: string;
  year?: string;
  features: string[];
  layers: Layer[];
  /** Interior is inferred from models rather than measured directly. */
  layersModel?: boolean;
  gases?: Gas[];
  gasesTitle?: string;
  gasesNote?: string;
}

const SCI: Record<string, Science> = {
  sun: {
    gravity: 274, density: 1.41, escape: 617.7, temp: 5500, tempNote: 'фотосфера; корона — свыше 1 млн °C',
    day: '25,4 сут', features: ['Термоядерный реактор', '99,86 % массы системы', 'Магнитный цикл 11 лет'],
    layers: [
      { m: 'plasma-core', name: 'Ядро', to: 0.25, detail: 'Синтез водорода в гелий, ≈15 млн K' },
      { m: 'plasma-rad', name: 'Зона лучистого переноса', to: 0.7, detail: 'Фотоны блуждают сотни тысяч лет' },
      { m: 'plasma-conv', name: 'Конвективная зона', to: 1, detail: 'Кипящие потоки плазмы, грануляция' },
    ],
    gases: [{ gas: 'H₂', pct: 73.5 }, { gas: 'He', pct: 24.9 }, { gas: 'другие', pct: 1.6 }],
    gasesTitle: 'Состав (по массе)', gasesNote: 'Водород указан как элемент; «другие» — кислород, углерод, неон, железо',
  },
  mercury: {
    gravity: 3.7, density: 5.43, escape: 4.25, temp: [-173, 427], day: '176 сут (солнечные)', year: '88 сут',
    features: ['Самый быстрый год', 'Огромное железное ядро', 'Резонанс вращения 3:2', 'Лёд в полярных кратерах'],
    layers: [
      { m: 'iron', name: 'Железное ядро', to: 0.83, detail: 'Твёрдое внутреннее и жидкое внешнее' },
      { m: 'mantle', name: 'Силикатная мантия', to: 0.985 },
      { m: 'crust', name: 'Кора', to: 1, detail: '≈ 35 км' },
    ],
    gases: [{ gas: 'O' }, { gas: 'Na' }, { gas: 'H' }, { gas: 'He' }, { gas: 'K' }],
    gasesTitle: 'Экзосфера', gasesNote: 'Почти вакуум: давление в 10¹⁵ раз ниже земного',
  },
  venus: {
    gravity: 8.87, density: 5.24, escape: 10.36, temp: 464, day: '117 сут (солнечные)', year: '225 сут',
    features: ['Самая горячая планета', 'Обратное вращение', 'Облака серной кислоты', 'Давление 92 атм'],
    layers: [
      { m: 'iron', name: 'Железо-никелевое ядро', to: 0.5 },
      { m: 'mantle', name: 'Силикатная мантия', to: 0.99 },
      { m: 'crust', name: 'Базальтовая кора', to: 1, detail: '≈ 30 км' },
    ],
    layersModel: true,
    gases: [{ gas: 'CO₂', pct: 96.5 }, { gas: 'N₂', pct: 3.5 }, { gas: 'SO₂', pct: 0.015 }],
    gasesNote: 'Давление у поверхности 92 атм — как на глубине 900 м в океане',
  },
  earth: {
    gravity: 9.81, density: 5.51, escape: 11.19, temp: [-89, 57], tempNote: 'в среднем +15 °C',
    day: '24 ч', year: '365,26 сут',
    features: ['Жидкая вода на поверхности', 'Жизнь', 'Тектоника плит', 'Магнитное поле'],
    layers: [
      { m: 'iron-inner', name: 'Внутреннее ядро', to: 0.19, detail: 'Твёрдое железо, ≈5 400 °C' },
      { m: 'iron-liquid', name: 'Внешнее ядро', to: 0.55, detail: 'Жидкое железо — источник магнитного поля' },
      { m: 'mantle', name: 'Мантия', to: 0.995, detail: 'Медленно течёт, двигая плиты' },
      { m: 'crust', name: 'Кора', to: 1, detail: '5–70 км' },
    ],
    gases: [{ gas: 'N₂', pct: 78.08 }, { gas: 'O₂', pct: 20.95 }, { gas: 'Ar', pct: 0.93 }, { gas: 'CO₂', pct: 0.042 }],
    gasesNote: 'Плюс водяной пар — в среднем около 1 %',
  },
  moon: {
    gravity: 1.62, density: 3.34, escape: 2.38, temp: [-173, 127], day: '29,5 сут (солнечные)', year: '27,3 сут вокруг Земли',
    features: ['Синхронное вращение', 'Вечная тень в полярных кратерах', 'Следы астронавтов'],
    layers: [
      { m: 'iron-inner', name: 'Внутреннее ядро', to: 0.14 },
      { m: 'iron-liquid', name: 'Внешнее ядро', to: 0.19 },
      { m: 'mantle-melt', name: 'Частично расплавленный слой', to: 0.28 },
      { m: 'mantle', name: 'Мантия', to: 0.975 },
      { m: 'crust', name: 'Анортозитовая кора', to: 1, detail: '≈ 35–45 км' },
    ],
    gases: [{ gas: 'He' }, { gas: 'Ar' }, { gas: 'Na' }, { gas: 'K' }],
    gasesTitle: 'Экзосфера', gasesNote: 'Практически вакуум',
  },
  mars: {
    gravity: 3.72, density: 3.93, escape: 5.03, temp: [-153, 20], tempNote: 'в среднем −63 °C',
    day: '24 ч 40 мин', year: '687 сут',
    features: ['Высочайший вулкан', 'Пылевые бури на всю планету', 'Древние русла рек', 'Работают марсоходы'],
    layers: [
      { m: 'iron-liquid', name: 'Жидкое ядро', to: 0.53, detail: 'Железо с серой (InSight)' },
      { m: 'mantle', name: 'Мантия', to: 0.985 },
      { m: 'crust', name: 'Кора', to: 1, detail: '≈ 25–70 км' },
    ],
    gases: [{ gas: 'CO₂', pct: 95.1 }, { gas: 'N₂', pct: 2.59 }, { gas: 'Ar', pct: 1.94 }, { gas: 'O₂', pct: 0.16 }, { gas: 'CO', pct: 0.06 }],
    gasesNote: 'Давление около 0,6 % земного (Curiosity)',
  },
  jupiter: {
    gravity: 24.79, density: 1.33, escape: 59.5, temp: -108, tempNote: 'на уровне давления 1 бар',
    day: '9 ч 56 мин', year: '11,9 лет',
    features: ['Крупнейшая планета', 'Ветры до 600 км/ч', 'Мощнейшее магнитное поле', 'Слабые кольца'],
    layers: [
      { m: 'core-dilute', name: 'Размытое ядро', to: 0.35, detail: 'Камень и лёд, смешанные с водородом (Juno)' },
      { m: 'metallic-h', name: 'Металлический водород', to: 0.8, detail: 'Проводит ток — создаёт магнитное поле' },
      { m: 'molecular-h', name: 'Молекулярный водород', to: 0.995 },
      { m: 'clouds', name: 'Облака', to: 1, detail: 'Аммиак, гидросульфид аммония, вода' },
    ],
    layersModel: true,
    gases: [{ gas: 'H₂', pct: 89.8 }, { gas: 'He', pct: 10.2 }, { gas: 'CH₄', pct: 0.3 }, { gas: 'NH₃', pct: 0.026 }],
  },
  saturn: {
    gravity: 10.44, density: 0.69, escape: 35.5, temp: -139, tempNote: 'на уровне давления 1 бар',
    day: '10 ч 34 мин', year: '29,5 лет',
    features: ['Плотность меньше воды', 'Главные кольца', 'Шестиугольник на полюсе', '274 спутника'],
    layers: [
      { m: 'core-dilute', name: 'Размытое ядро', to: 0.25, detail: 'Камень и лёд; по кольцевой сейсмологии Cassini размыто до ~60 % радиуса' },
      { m: 'metallic-h', name: 'Металлический водород', to: 0.5 },
      { m: 'molecular-h', name: 'Молекулярный водород', to: 0.995 },
      { m: 'clouds', name: 'Облака', to: 1, detail: 'Аммиак, вода' },
    ],
    layersModel: true,
    gases: [{ gas: 'H₂', pct: 96.3 }, { gas: 'He', pct: 3.25 }, { gas: 'CH₄', pct: 0.45 }, { gas: 'NH₃', pct: 0.0125 }],
  },
  uranus: {
    gravity: 8.69, density: 1.27, escape: 21.3, temp: [-224, -197], tempNote: 'на уровне давления 1 бар',
    day: '17 ч 14 мин', year: '84 года',
    features: ['Лежит на боку', 'Самая холодная атмосфера', 'Обратное вращение', '13 тёмных колец'],
    layers: [
      { m: 'rock', name: 'Каменное ядро', to: 0.2 },
      { m: 'ice-giant', name: '«Ледяная» мантия', to: 0.75, detail: 'Горячая плотная жидкость: вода, аммиак, метан' },
      { m: 'molecular-h', name: 'Водородно-гелиевая оболочка', to: 1 },
    ],
    layersModel: true,
    gases: [{ gas: 'H₂', pct: 82.5 }, { gas: 'He', pct: 15.2 }, { gas: 'CH₄', pct: 2.3 }],
    gasesNote: 'Метан поглощает красный свет — отсюда голубой цвет',
  },
  neptune: {
    gravity: 11.15, density: 1.64, escape: 23.5, temp: -201, tempNote: 'на уровне давления 1 бар',
    day: '16 ч 6 мин', year: '165 лет',
    features: ['Самые быстрые ветры', 'Открыт «на кончике пера»', 'Внутреннее тепло', 'Тёмные вихри'],
    layers: [
      { m: 'rock', name: 'Каменное ядро', to: 0.25 },
      { m: 'ice-giant', name: '«Ледяная» мантия', to: 0.8, detail: 'Вода, аммиак, метан; возможно, «алмазный дождь»' },
      { m: 'molecular-h', name: 'Водородно-гелиевая оболочка', to: 1 },
    ],
    layersModel: true,
    gases: [{ gas: 'H₂', pct: 80 }, { gas: 'He', pct: 19 }, { gas: 'CH₄', pct: 1.5 }],
  },
  // ── Moons ────────────────────────────────────────────────────────────────────
  phobos: {
    gravity: 0.0057, density: 1.86, escape: 0.0114, temp: [-112, -4], day: '7 ч 39 мин (синхронно)',
    features: ['Приближается к Марсу', 'Восходит на западе', 'Пористое тело'],
    layers: [{ m: 'rock', name: 'Пористая каменная «куча обломков»', to: 0.96 }, { m: 'regolith', name: 'Реголит', to: 1, detail: 'до сотни метров пыли' }],
    layersModel: true,
  },
  deimos: {
    gravity: 0.003, density: 1.47, escape: 0.0056, temp: -40, day: '30,3 ч (синхронно)',
    features: ['Гладкая поверхность', 'Почти неподвижен в небе Марса'],
    layers: [{ m: 'rock', name: 'Пористое каменное тело', to: 0.95 }, { m: 'regolith', name: 'Толстый реголит', to: 1 }],
    layersModel: true,
  },
  io: {
    gravity: 1.8, density: 3.53, escape: 2.56, temp: -143, tempNote: 'поверхность; лава — до +1 600 °C',
    day: '1,77 сут (синхронно)',
    features: ['400+ активных вулканов', 'Приливный нагрев', 'Серные отложения', 'Резонанс 1:2:4'],
    layers: [
      { m: 'iron', name: 'Железное ядро', to: 0.52 },
      { m: 'mantle-melt', name: 'Частично расплавленная мантия', to: 0.97, detail: 'Магматический «океан» под корой' },
      { m: 'crust', name: 'Кора', to: 1, detail: '≈ 30–50 км' },
    ],
    layersModel: true,
    gases: [{ gas: 'SO₂', pct: 90 }, { gas: 'другие', pct: 10 }],
    gasesTitle: 'Разреженная атмосфера', gasesNote: 'Пополняется вулканами, замерзает в тени Юпитера',
  },
  europa: {
    gravity: 1.31, density: 3.01, escape: 2.03, temp: [-223, -148], day: '3,55 сут (синхронно)',
    features: ['Подлёдный океан', 'Кандидат на жизнь', 'Молодая гладкая кора'],
    layers: [
      { m: 'iron', name: 'Металлическое ядро', to: 0.4 },
      { m: 'mantle', name: 'Каменная мантия', to: 0.9 },
      { m: 'ocean', name: 'Солёный океан', to: 0.985, detail: 'Глубина ≈ 100 км' },
      { m: 'ice', name: 'Ледяная кора', to: 1, detail: '≈ 15–25 км' },
    ],
    layersModel: true,
    gases: [{ gas: 'O₂' }], gasesTitle: 'Экзосфера', gasesNote: 'Кислород из льда, разбитого излучением Юпитера',
  },
  ganymede: {
    gravity: 1.43, density: 1.94, escape: 2.74, temp: [-203, -121], day: '7,15 сут (синхронно)',
    features: ['Крупнейший спутник', 'Собственное магнитное поле', 'Подлёдный океан', 'Полярные сияния'],
    layers: [
      { m: 'iron', name: 'Железное ядро', to: 0.25 },
      { m: 'mantle', name: 'Каменная мантия', to: 0.5 },
      { m: 'ice-hp', name: 'Лёд высокого давления', to: 0.85 },
      { m: 'ocean', name: 'Солёный океан', to: 0.93 },
      { m: 'ice', name: 'Ледяная кора', to: 1 },
    ],
    layersModel: true,
  },
  callisto: {
    gravity: 1.24, density: 1.83, escape: 2.44, temp: [-193, -108], day: '16,7 сут (синхронно)',
    features: ['Самая кратерированная поверхность', 'Почти не меняется 4 млрд лет', 'Вне радиационных поясов'],
    layers: [
      { m: 'rock-ice', name: 'Смесь камня и льда', to: 0.88, detail: 'Недра разделены лишь частично' },
      { m: 'ocean', name: 'Возможный океан', to: 0.93 },
      { m: 'ice', name: 'Ледяная кора', to: 1 },
    ],
    layersModel: true,
  },
  mimas: {
    gravity: 0.064, density: 1.15, escape: 0.159, temp: -209, day: '22,6 ч (синхронно)',
    features: ['«Звезда Смерти»', 'Молодой скрытый океан (2024)', 'Создаёт щель Кассини'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.6 }, { m: 'ocean', name: 'Океан', to: 0.87 }, { m: 'ice', name: 'Ледяная оболочка', to: 1, detail: '≈ 20–30 км' }],
    layersModel: true,
  },
  enceladus: {
    gravity: 0.113, density: 1.61, escape: 0.239, temp: -198, tempNote: 'у «тигровых полос» — заметно теплее',
    day: '1,37 сут (синхронно)',
    features: ['Гейзеры подлёдного океана', 'Самая белая поверхность', 'Питает кольцо E', 'Фосфаты, органика, H₂'],
    layers: [{ m: 'rock', name: 'Пористое каменное ядро', to: 0.75 }, { m: 'ocean', name: 'Глобальный океан', to: 0.9 }, { m: 'ice', name: 'Ледяная кора', to: 1, detail: '≈ 20 км, у южного полюса ≈ 5 км' }],
    layersModel: true,
    gases: [{ gas: 'H₂O', pct: 97 }, { gas: 'NH₃' }, { gas: 'H₂' }, { gas: 'CO₂' }, { gas: 'CH₄' }],
    gasesTitle: 'Состав шлейфов (Cassini)', gasesNote: 'Вода ≈ 96–99 %; остальное — аммиак, водород, CO₂, метан, органика',
  },
  tethys: {
    gravity: 0.146, density: 0.98, escape: 0.394, temp: -187, day: '1,89 сут (синхронно)',
    features: ['Почти чистый лёд', 'Каньон Итака', 'Кратер Одиссей'],
    layers: [{ m: 'ice', name: 'Водяной лёд', to: 1, detail: 'Камня почти нет' }],
    layersModel: true,
  },
  dione: {
    gravity: 0.232, density: 1.48, escape: 0.51, temp: -186, day: '2,74 сут (синхронно)',
    features: ['Ледяные обрывы', 'Вероятный глубокий океан'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.6 }, { m: 'ocean', name: 'Возможный океан', to: 0.8 }, { m: 'ice', name: 'Ледяная кора', to: 1 }],
    layersModel: true,
  },
  rhea: {
    gravity: 0.264, density: 1.24, escape: 0.635, temp: [-220, -174], day: '4,52 сут (синхронно)',
    features: ['Второй по размеру у Сатурна', 'Кислородная экзосфера'],
    layers: [{ m: 'rock-ice', name: 'Смесь льда и камня', to: 1, detail: 'Недра, вероятно, почти не разделены' }],
    layersModel: true,
    gases: [{ gas: 'O₂' }, { gas: 'CO₂' }], gasesTitle: 'Экзосфера',
  },
  titan: {
    gravity: 1.35, density: 1.88, escape: 2.64, temp: -179, day: '15,9 сут (синхронно)',
    features: ['Плотная атмосфера', 'Метановые дожди и моря', 'Подлёдный океан', 'Цель Dragonfly'],
    layers: [
      { m: 'rock', name: 'Каменное ядро', to: 0.6, detail: 'Гидратированные силикаты' },
      { m: 'ice-hp', name: 'Лёд высокого давления', to: 0.8 },
      { m: 'ocean', name: 'Океан воды с аммиаком', to: 0.94 },
      { m: 'ice', name: 'Ледяная кора', to: 1 },
    ],
    layersModel: true,
    gases: [{ gas: 'N₂', pct: 94.2 }, { gas: 'CH₄', pct: 5.65 }, { gas: 'H₂', pct: 0.1 }],
    gasesNote: 'У поверхности (Huygens). Давление 1,45 атм, а гравитация слабая: человек мог бы летать с крыльями',
  },
  iapetus: {
    gravity: 0.223, density: 1.09, escape: 0.573, temp: [-173, -143], day: '79,3 сут (синхронно)',
    features: ['Двуликий: чёрный и белый', 'Экваториальный хребет', 'Форма грецкого ореха'],
    layers: [{ m: 'rock-ice', name: 'Лёд с примесью камня', to: 1 }],
    layersModel: true,
  },
  miranda: {
    gravity: 0.079, density: 1.2, escape: 0.193, temp: [-213, -187], day: '1,41 сут (синхронно)',
    features: ['«Лоскутная» поверхность', 'Обрыв высотой 20 км'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.45 }, { m: 'ice', name: 'Ледяная мантия', to: 1 }],
    layersModel: true,
  },
  ariel: {
    gravity: 0.269, density: 1.59, escape: 0.558, temp: [-213, -187], day: '2,52 сут (синхронно)',
    features: ['Самая молодая поверхность у Урана', 'Рифтовые долины'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.6 }, { m: 'ice', name: 'Ледяная мантия', to: 1 }],
    layersModel: true,
  },
  umbriel: {
    gravity: 0.2, density: 1.39, escape: 0.52, temp: [-213, -187], day: '4,14 сут (синхронно)',
    features: ['Самый тёмный у Урана', 'Загадочное светлое кольцо'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.55 }, { m: 'ice', name: 'Ледяная мантия', to: 1 }],
    layersModel: true,
  },
  titania: {
    gravity: 0.379, density: 1.71, escape: 0.773, temp: [-213, -187], day: '8,71 сут (синхронно)',
    features: ['Крупнейший у Урана', 'Каньоны длиной 1 500 км'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.66 }, { m: 'ocean', name: 'Возможный тонкий океан', to: 0.72 }, { m: 'ice', name: 'Ледяная кора', to: 1 }],
    layersModel: true,
  },
  oberon: {
    gravity: 0.346, density: 1.63, escape: 0.727, temp: [-213, -187], day: '13,5 сут (синхронно)',
    features: ['Древние кратеры', 'Тёмный материал на дне кратеров'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.63 }, { m: 'ice', name: 'Ледяная мантия', to: 1 }],
    layersModel: true,
  },
  triton: {
    gravity: 0.779, density: 2.06, escape: 1.455, temp: -235, day: '5,88 сут (синхронно)',
    features: ['Обратная орбита', 'Азотные гейзеры', 'Захваченный объект пояса Койпера'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.7 }, { m: 'ice', name: 'Ледяная мантия, возможно с океаном', to: 0.97 }, { m: 'nitrogen-ice', name: 'Кора из азотного льда', to: 1 }],
    layersModel: true,
    gases: [{ gas: 'N₂', pct: 99.9 }, { gas: 'CH₄', pct: 0.02 }, { gas: 'CO' }],
    gasesNote: 'Давление около 1,4 Па — в 70 000 раз ниже земного',
  },
  charon: {
    gravity: 0.288, density: 1.7, escape: 0.59, temp: -220, day: '6,39 сут (синхронно)',
    features: ['Половина Плутона', 'Двойная система', 'Красная «шапка» Мордор'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.7 }, { m: 'ice', name: 'Ледяная мантия', to: 1, detail: 'Древний океан давно замёрз' }],
    layersModel: true,
  },
  // ── Dwarf planets ─────────────────────────────────────────────────────────────
  ceres: {
    gravity: 0.28, density: 2.16, escape: 0.51, temp: [-143, -38], day: '9 ч 4 мин', year: '4,6 года',
    features: ['Крупнейшее тело пояса', 'Солевые факулы', 'Остатки рассола в недрах'],
    layers: [{ m: 'rock', name: 'Каменистые недра', to: 0.85 }, { m: 'ocean', name: 'Остатки рассола', to: 0.92 }, { m: 'crust', name: 'Кора: лёд, соли, глины', to: 1, detail: '≈ 40 км' }],
    layersModel: true,
  },
  pluto: {
    gravity: 0.62, density: 1.85, escape: 1.21, temp: [-240, -218], day: '6,39 сут', year: '248 лет',
    features: ['Азотные ледники', 'Голубая дымка', 'Вероятный подлёдный океан', '5 спутников'],
    layers: [{ m: 'rock', name: 'Каменное ядро', to: 0.72 }, { m: 'ocean', name: 'Вероятный океан', to: 0.85 }, { m: 'ice', name: 'Ледяная кора', to: 0.995 }, { m: 'nitrogen-ice', name: 'Азотный и метановый лёд', to: 1 }],
    layersModel: true,
    gases: [{ gas: 'N₂', pct: 99 }, { gas: 'CH₄', pct: 0.5 }, { gas: 'CO', pct: 0.05 }],
    gasesNote: 'Давление около 1 Па; атмосфера вымерзает, когда Плутон удаляется от Солнца',
  },
  haumea: {
    gravity: 0.4, density: 2.0, escape: 0.84, temp: -241, tempNote: 'оценка', day: '3 ч 55 мин', year: '283 года',
    features: ['Форма мяча для регби', 'Кольцо', 'Кристаллический лёд'],
    layers: [{ m: 'rock', name: 'Каменистые недра', to: 0.85 }, { m: 'ice', name: 'Кора из водяного льда', to: 1 }],
    layersModel: true,
  },
  makemake: {
    gravity: 0.4, density: 1.9, escape: 0.76, temp: -243, tempNote: 'оценка', day: '22,8 ч', year: '306 лет',
    features: ['Метановый лёд', 'Красноватый цвет'],
    layers: [{ m: 'rock', name: 'Каменистые недра', to: 0.8 }, { m: 'ice', name: 'Ледяная мантия', to: 1 }],
    layersModel: true,
  },
  eris: {
    gravity: 0.82, density: 2.43, escape: 1.38, temp: [-243, -217], day: '15,8 сут', year: '559 лет',
    features: ['Массивнее Плутона', 'Очень яркая поверхность', 'Причина «понижения» Плутона'],
    layers: [{ m: 'rock', name: 'Каменистые недра', to: 0.85 }, { m: 'ice', name: 'Ледяная мантия', to: 1 }],
    layersModel: true,
  },
};

export const scienceOf = (id: string): Science | undefined => SCI[id];
