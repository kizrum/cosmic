/**
 * Attribution required (or requested) by the licences of the assets used.
 * CC BY / CC BY-SA require: author, licence name + link, and an indication of changes.
 */
export interface CreditEntry {
  what: string;
  author: string;
  source?: string;
  licence: string;
  licenceUrl?: string;
  changes?: string;
}

export interface CreditGroup {
  title: string;
  entries: CreditEntry[];
}

const CC_BY_4 = 'https://creativecommons.org/licenses/by/4.0/';
const CC_BY_SA_3 = 'https://creativecommons.org/licenses/by-sa/3.0/';
const NASA_PD = 'Общественное достояние (материалы NASA). Использование не означает одобрения NASA.';

export const CREDITS: CreditGroup[] = [
  {
    title: 'Карты с обязательным указанием авторства',
    entries: [
      {
        what: 'Солнце, Меркурий, Венера, Земля, Луна, Марс, Юпитер, Сатурн и его кольца, Уран, Нептун, звёздное небо',
        author: 'Solar System Scope (INOVE), на основе данных NASA',
        source: 'https://www.solarsystemscope.com/textures/',
        licence: 'CC BY 4.0',
        licenceUrl: CC_BY_4,
        changes:
          'Уменьшено разрешение (до 4096 px); у панорамы звёздного неба повышены яркость и контраст Млечного Пути; карта облаков Земли переведена в оттенки серого; карта поверхности Венеры повёрнута на 180° для совпадения с системой координат IAU; цвет Нептуна приглушён по данным Irwin et al., 2024.',
      },
      {
        what: 'Фобос',
        author: 'Askaniy Anpilogov, Phil Stooke',
        source: 'https://www.deviantart.com/askaniy/art/Phobos-Texture-Map-784146561',
        licence: 'CC BY-SA 3.0',
        licenceUrl: CC_BY_SA_3,
        changes: 'Уменьшено разрешение до 2048 × 1024 px. Изменённая карта распространяется на тех же условиях (CC BY-SA 3.0).',
      },
      {
        what: 'Деймос',
        author: 'Askaniy Anpilogov, John van Vliet',
        source: 'https://www.deviantart.com/askaniy/art/Deimos-Texture-Map-784881224',
        licence: 'CC BY-SA 3.0',
        licenceUrl: CC_BY_SA_3,
        changes: 'Уменьшено разрешение до 2048 × 1024 px. Изменённая карта распространяется на тех же условиях (CC BY-SA 3.0).',
      },
      {
        what: 'Ганимед',
        author: 'Björn Jónsson (по снимкам NASA Voyager и Galileo)',
        source: 'https://bjj.mmedia.is/data/planetary_maps.html',
        licence: 'Использование с указанием автора',
        changes: 'Масштабирована до 2048 × 1024 px, долготы сдвинуты на 180°.',
      },
    ],
  },
  {
    title: 'Карты NASA и USGS',
    entries: [
      { what: 'Ио, Европа, Каллисто', author: 'NASA/JPL/USGS (Galileo, Voyager)', licence: NASA_PD },
      { what: 'Мимас, Тефия, Рея, Титан', author: 'NASA/JPL-Caltech/Space Science Institute (Cassini)', licence: NASA_PD },
      { what: 'Энцелад, Диона, Япет', author: 'NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute', licence: NASA_PD },
      { what: 'Миранда, Ариэль, Умбриэль, Титания, Оберон', author: 'NASA/JPL/USGS (Voyager 2)', licence: NASA_PD },
      { what: 'Тритон', author: 'NASA/JPL/USGS/Lunar and Planetary Institute (Voyager 2)', licence: NASA_PD },
      { what: 'Плутон, Харон', author: 'NASA/JHUAPL/SwRI (New Horizons)', licence: NASA_PD },
      { what: 'Церера', author: 'NASA/JPL-Caltech/UCLA/MPS/DLR/IDA (Dawn)', licence: NASA_PD },
    ],
  },
  {
    title: 'Данные',
    entries: [
      { what: 'Орбиты планет', author: 'E. M. Standish, JPL — «Approximate Positions of the Planets»', licence: 'Научные данные' },
      { what: 'Орбиты спутников и карликовых планет', author: 'JPL Horizons System, NASA/JPL Solar System Dynamics', licence: 'Научные данные' },
      { what: 'Ориентация осей и вращение', author: 'IAU Working Group on Cartographic Coordinates and Rotational Elements', licence: 'Научные данные' },
      { what: 'Положение Луны', author: 'J. Meeus, «Astronomical Algorithms»', licence: 'Научный метод' },
    ],
  },
  {
    title: 'Программное обеспечение и шрифты',
    entries: [
      { what: 'three.js', author: 'Copyright © 2010–2025 three.js authors', licence: 'MIT', licenceUrl: 'https://github.com/mrdoob/three.js/blob/dev/LICENSE' },
      { what: 'Шрифт Exo 2', author: 'Copyright 2013 The Exo 2 Project Authors', licence: 'SIL Open Font License 1.1', licenceUrl: 'https://openfontlicense.org' },
      { what: 'Шрифт JetBrains Mono', author: 'Copyright 2020 The JetBrains Mono Project Authors', licence: 'SIL Open Font License 1.1', licenceUrl: 'https://openfontlicense.org' },
    ],
  },
];

export const NOTICES = [
  'Размеры тел и расстояния между ними сжаты: в истинном масштабе планеты были бы невидимы. Направления, положения на выбранную дату, наклоны осей и вращение — по научным данным.',
  'Неотснятые области спутников Урана, Тритона, Плутона и Харона заполнены условно. Окраска Эриды, Макемаке и Хаумеа условная: вблизи они не снимались.',
  'Материалы NASA используются без какого-либо одобрения со стороны NASA.',
];
