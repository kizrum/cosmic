import { BODIES, bodyById, type BodyDef, type Site } from '../data/bodies';
import { REGIONS, type RegionDef } from '../data/regions';
import { formatLatLon } from '../astro';

export const TIME_PRESETS: { label: string; title: string; days: number }[] = [
  { label: '❚❚', title: 'Пауза', days: 0 },
  { label: '1×', title: 'Реальное время', days: 1 / 86400 },
  { label: '1 ч/с', title: '1 час за секунду', days: 1 / 24 },
  { label: '1 сут/с', title: '1 сутки за секунду (вращение планет упрощено)', days: 1 },
  { label: '1 нед/с', title: '1 неделя за секунду (вращение планет упрощено)', days: 7 },
  { label: '1 мес/с', title: '1 месяц за секунду (вращение планет упрощено)', days: 30.44 },
  { label: '1 год/с', title: '1 год за секунду (вращение планет упрощено)', days: 365.25 },
];

export interface LiveStat {
  label: string;
  value: string;
}

export interface PointInfo {
  lat: number;
  lon: number;
  nearest?: { site: Site; km: number };
  status: LiveStat[];
}

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const factsTable = (facts: [string, string][] | LiveStat[]) =>
  facts.length
    ? `<dl class="facts">${facts
        .map((f) => {
          const [k, v] = Array.isArray(f) ? f : [f.label, f.value];
          return `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`;
        })
        .join('')}</dl>`
    : '';

const moonsOf = (id: string) => BODIES.filter((b) => b.parent === id);

export interface UIHandlers {
  selectBody(id: string): void;
  selectSite(bodyId: string, siteId: string): void;
  selectRegion(id: string): void;
  goSystem(): void;
  goBody(): void;
  setSpeed(index: number): void;
  setDate(ms: number): void;
  resetNow(): void;
  toggleLight(): void;
  toggleOrbits(): void;
}

export class UI {
  private readonly panel = $('#panel');
  private readonly crumbs = $('#crumbs');
  private readonly date = $('#sim-date');
  private readonly dateInput = $<HTMLInputElement>('#date-input');
  private readonly live = () => this.panel.querySelector('.live') as HTMLElement | null;
  private lastDate = '';

  constructor(private readonly h: UIHandlers) {
    this.buildNav();
    this.buildTime();
    $('#btn-light').addEventListener('click', () => h.toggleLight());
    $('#btn-orbits').addEventListener('click', () => h.toggleOrbits());
    this.panel.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const site = t.closest<HTMLElement>('[data-site]');
      if (site) return h.selectSite(site.dataset.body!, site.dataset.site!);
      const body = t.closest<HTMLElement>('[data-body]');
      if (body) return h.selectBody(body.dataset.body!);
      const back = t.closest<HTMLElement>('[data-back]');
      if (back) (back.dataset.back === 'system' ? h.goSystem : h.goBody)();
    });
    this.crumbs.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-crumb]');
      if (!el) return;
      const c = el.dataset.crumb!;
      if (c === 'system') h.goSystem();
      else if (c === 'body') h.goBody();
      else h.selectBody(c);
    });
  }

  private buildNav() {
    const item = (b: BodyDef, cls = '') =>
      `<li><button data-body="${b.id}" class="${cls}" style="--c:${b.color}">
        <span class="dot"></span><span class="n">${b.name}</span><span class="k">${b.latin}</span></button>${this.subList(b.id)}</li>`;
    const planets = BODIES.filter((b) => b.group === 'star' || b.group === 'planet');
    const dwarfs = BODIES.filter((b) => b.group === 'dwarf');
    $('#nav-groups').innerHTML = `
      <h4>Солнце и планеты</h4><ul class="nav-list">${planets.map((b) => item(b)).join('')}</ul>
      <h4>Карликовые планеты</h4><ul class="nav-list">${dwarfs.map((b) => item(b)).join('')}</ul>
      <h4>Пояса</h4><ul class="nav-list">${REGIONS.map(
        (r) => `<li><button data-region="${r.id}" style="--c:${r.color}"><span class="dot ring"></span><span class="n">${r.name}</span><span class="k">${r.latin}</span></button></li>`,
      ).join('')}</ul>`;
    $('#nav-groups').addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const btn = t.closest<HTMLElement>('[data-body]');
      if (btn) return this.h.selectBody(btn.dataset.body!);
      const reg = t.closest<HTMLElement>('[data-region]');
      if (reg) this.h.selectRegion(reg.dataset.region!);
    });
  }

  private subList(parentId: string) {
    const moons = moonsOf(parentId);
    if (!moons.length) return '';
    return `<ul class="sub" data-parent="${parentId}">${moons
      .map((m) => `<li><button data-body="${m.id}" class="child" style="--c:${m.color}"><span class="dot"></span><span class="n">${m.name}</span></button></li>`)
      .join('')}</ul>`;
  }

  private buildTime() {
    const box = $('#time-presets');
    box.innerHTML = TIME_PRESETS.map((p, i) => `<button data-i="${i}" title="${p.title}">${p.label}</button>`).join('');
    box.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
      if (b) this.h.setSpeed(Number(b.dataset.i));
    });
    $('#btn-now').addEventListener('click', () => this.h.resetNow());
    this.dateInput.addEventListener('change', () => {
      // The input is in UTC (the whole UI shows UTC).
      const ms = Date.parse(this.dateInput.value + ':00Z');
      if (!Number.isNaN(ms)) this.h.setDate(ms);
    });
  }

  setSpeedIndex(i: number) {
    document.querySelectorAll('#time-presets button').forEach((b, k) => b.classList.toggle('on', k === i));
  }

  setToggle(id: 'light' | 'orbits', on: boolean) {
    $(`#btn-${id}`).classList.toggle('on', on);
  }

  setDate(d: Date) {
    const s = d.toLocaleString('ru-RU', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    });
    if (s === this.lastDate) return;
    this.lastDate = s;
    this.date.textContent = `${s} UTC`;
    if (document.activeElement !== this.dateInput && Number.isFinite(d.getTime())) {
      this.dateInput.value = d.toISOString().slice(0, 16);
    }
  }

  setActiveBody(id: string | null) {
    const def = id ? BODIES.find((b) => b.id === id) : undefined;
    const open = def?.parent ?? id;
    document.querySelectorAll<HTMLElement>('#nav-groups [data-body]').forEach((b) => b.classList.toggle('active', b.dataset.body === id));
    document.querySelectorAll<HTMLElement>('#nav-groups [data-region]').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll<HTMLElement>('#nav-groups .sub').forEach((s) => s.classList.toggle('open', s.dataset.parent === open));
  }

  private setActiveRegion(id: string) {
    this.setActiveBody(null);
    document.querySelectorAll<HTMLElement>('#nav-groups [data-region]').forEach((b) => b.classList.toggle('active', b.dataset.region === id));
  }

  private setCrumbs(body?: BodyDef, leaf?: string) {
    const parts = [`<button data-crumb="system">Солнечная система</button>`];
    if (body?.parent) parts.push(`<button data-crumb="${body.parent}">${bodyById(body.parent).name}</button>`);
    if (body) parts.push(`<button data-crumb="body" ${leaf ? '' : 'class="cur"'}>${body.name}</button>`);
    if (leaf) parts.push(`<span class="cur">${esc(leaf)}</span>`);
    this.crumbs.innerHTML = parts.join('<span class="sep">›</span>');
  }

  private open(html: string) {
    this.panel.innerHTML = html;
    this.panel.classList.remove('show');
    void this.panel.offsetWidth; // restart the reveal animation
    this.panel.classList.add('show');
    this.panel.scrollTop = 0;
  }

  showSystem() {
    this.setCrumbs();
    this.setActiveBody(null);
    this.panel.classList.remove('show');
  }

  showRegion(r: RegionDef) {
    this.crumbs.innerHTML = `<button data-crumb="system">Солнечная система</button><span class="sep">›</span><span class="cur">${r.name}</span>`;
    this.setActiveRegion(r.id);
    this.open(`
      <div class="ph">
        <div class="kind" style="--c:${r.color}">${esc(r.kind)}</div>
        <h2>${r.name}<small>${r.latin}</small></h2>
      </div>
      <p class="desc">${esc(r.description)}</p>
      ${factsTable(r.facts)}
      <button class="back" data-back="system">← К системе</button>`);
  }

  showBody(b: BodyDef) {
    this.setCrumbs(b);
    this.setActiveBody(b.id);
    const moons = moonsOf(b.id);
    const moonList = moons.length
      ? `<h3>Спутники <span class="count">${moons.length}</span></h3>
         <ul class="moons">${moons
           .map((m) => `<li><button data-body="${m.id}" style="--c:${m.color}"><span class="dot"></span>${m.name}</button></li>`)
           .join('')}</ul>`
      : '';
    const parent = b.parent
      ? `<button class="near" data-body="${b.parent}"><span>Обращается вокруг</span><b>${bodyById(b.parent).name}</b></button>`
      : '';
    const sites = b.sites.length
      ? `<h3>Районы для изучения <span class="count">${b.sites.length}</span></h3>
         <ul class="sites">${b.sites
           .map(
             (s, i) => `<li><button data-body="${b.id}" data-site="${s.id}">
               <span class="idx">${String(i + 1).padStart(2, '0')}</span>
               <span class="sn">${esc(s.name)}</span><span class="sk">${esc(s.kind)}</span></button></li>`,
           )
           .join('')}</ul>
         <p class="tip">Нажмите на маркер или на любую точку поверхности, чтобы просканировать её.</p>`
      : b.group === 'star'
        ? `<p class="tip">Поверхность Солнца — плазма, отдельных районов для посадки нет. Выберите планету.</p>`
        : `<p class="tip">Нажмите на любую точку поверхности, чтобы просканировать её.</p>`;
    this.open(`
      <div class="ph">
        <div class="kind" style="--c:${b.color}">${esc(b.kind)}</div>
        <h2>${b.name}<small>${b.latin}</small></h2>
      </div>
      <div class="live"></div>
      <p class="desc">${esc(b.description)}</p>
      ${b.note ? `<p class="note-data">${esc(b.note)}</p>` : ''}
      ${factsTable(b.facts)}
      ${parent}
      ${moonList}
      ${sites}
      <button class="back" data-back="system">← К системе</button>`);
  }

  showSite(b: BodyDef, s: Site) {
    this.setCrumbs(b, s.name);
    const coord = s.elevation ? `${(b.radiusKm * s.elevation).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} км от центра, в плоскости колец` : formatLatLon(s.lat, s.lon);
    this.open(`
      <div class="ph">
        <div class="kind" style="--c:${b.color}">${esc(s.kind)}</div>
        <h2>${esc(s.name)}</h2>
        <div class="coord">${b.name} · ${coord}</div>
      </div>
      <div class="scan"><span></span>Сканирование района…</div>
      <div class="live"></div>
      <p class="desc">${esc(s.description)}</p>
      ${factsTable(s.facts ?? [])}
      <button class="back" data-back="body">← К ${b.group === 'moon' ? 'спутнику' : 'планете'}</button>`);
  }

  showPoint(b: BodyDef, p: PointInfo) {
    this.setCrumbs(b, 'Произвольная точка');
    const near = p.nearest
      ? `<button class="near" data-body="${b.id}" data-site="${p.nearest.site.id}">
          <span>Ближайший изученный район</span><b>${esc(p.nearest.site.name)}</b>
          <em>${Math.round(p.nearest.km).toLocaleString('ru-RU')} км по поверхности</em></button>`
      : '';
    this.open(`
      <div class="ph">
        <div class="kind" style="--c:${b.color}">Неисследованный сектор</div>
        <h2>${formatLatLon(p.lat, p.lon)}</h2>
        <div class="coord">${b.name}</div>
      </div>
      <div class="scan"><span></span>Сканирование сектора…</div>
      <div class="live"></div>
      ${near}
      <button class="back" data-back="body">← Назад</button>`);
    this.setLive(p.status);
  }

  setLive(stats: LiveStat[]) {
    const el = this.live();
    if (el) el.innerHTML = factsTable(stats);
  }

  hint(text: string) {
    $('#hint').textContent = text;
  }

  loading(progress: number) {
    $('#loader-bar').style.width = `${Math.round(progress * 100)}%`;
  }

  ready() {
    $('#loader').classList.add('done');
    document.body.classList.add('ready');
  }
}
