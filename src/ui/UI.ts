import { BODIES, bodyById, type BodyDef, type Site } from '../data/bodies';
import { REGIONS, type RegionDef } from '../data/regions';
import { CREDITS, NOTICES } from '../data/credits';
import { formatLatLon } from '../astro';
import { scienceOf } from '../data/science';
import { categoryOf, type SiteCategory } from '../data/siteShapes';
import { featureChips, statTiles, structureView } from './scienceViews';

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

interface PanelTab {
  id: string;
  label: string;
  count?: number;
  html: string;
}

export interface UIHandlers {
  selectBody(id: string): void;
  selectSite(bodyId: string, siteId: string): void;
  selectRegion(id: string): void;
  /** Pointer over a site entry in the panel (null when it leaves). */
  hoverSite(id: string | null): void;
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
  private lastTab = 'overview';
  /** Small windows start with the details folded away; the viewer's choice is remembered. */
  private collapsed = (() => {
    try {
      const v = localStorage.getItem('cosmic.panelCollapsed');
      if (v !== null) return v === '1';
    } catch {
      /* storage unavailable */
    }
    return window.innerWidth < 1280 || window.innerHeight < 760;
  })();

  constructor(private readonly h: UIHandlers) {
    this.buildNav();
    this.buildTime();
    this.buildCredits();
    $('#btn-light').addEventListener('click', () => h.toggleLight());
    $('#btn-orbits').addEventListener('click', () => h.toggleOrbits());
    this.panel.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const tab = t.closest<HTMLElement>('[data-tab]');
      if (tab) return this.selectTab(tab.dataset.tab!);
      if (t.closest('[data-collapse]')) return this.setCollapsed(!this.collapsed);
      const site = t.closest<HTMLElement>('[data-site]');
      if (site) return h.selectSite(site.dataset.body!, site.dataset.site!);
      const body = t.closest<HTMLElement>('[data-body]');
      if (body) return h.selectBody(body.dataset.body!);
      const back = t.closest<HTMLElement>('[data-back]');
      if (back) (back.dataset.back === 'system' ? h.goSystem : h.goBody)();
    });
    this.panel.addEventListener('pointerover', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('.sites [data-site]');
      h.hoverSite(el ? el.dataset.site! : null);
    });
    this.panel.addEventListener('pointerleave', () => h.hoverSite(null));
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
      const reg = t.closest<HTMLElement>('[data-region]');
      if (btn) this.h.selectBody(btn.dataset.body!);
      else if (reg) this.h.selectRegion(reg.dataset.region!);
      else return;
      this.setNavOpen(false);
    });
    $('#nav-toggle').addEventListener('click', () => this.setNavOpen(!this.navOpen));
  }

  get navOpen() {
    return $('#nav').classList.contains('open');
  }

  setNavOpen(open: boolean) {
    $('#nav').classList.toggle('open', open);
    $('#nav-toggle').setAttribute('aria-expanded', String(open));
  }

  private subList(parentId: string) {
    const moons = moonsOf(parentId);
    if (!moons.length) return '';
    return `<ul class="sub" data-parent="${parentId}">${moons
      .map((m) => `<li><button data-body="${m.id}" class="child" style="--c:${m.color}"><span class="dot"></span><span class="n">${m.name}</span></button></li>`)
      .join('')}</ul>`;
  }

  private buildCredits() {
    const dialog = $<HTMLDialogElement>('#credits');
    const link = (url: string, text: string) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
    $('#credits-body').innerHTML =
      `<ul class="notices">${NOTICES.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` +
      CREDITS.map(
        (g) => `<h3>${esc(g.title)}</h3><ul class="credits-list">${g.entries
          .map(
            (e) => `<li>
              <div class="cw">${esc(e.what)}</div>
              <div class="ca">${e.source ? link(e.source, e.author) : esc(e.author)}</div>
              <div class="cl">${e.licenceUrl ? link(e.licenceUrl, e.licence) : esc(e.licence)}</div>
              ${e.changes ? `<div class="cc">Изменения: ${esc(e.changes)}</div>` : ''}
            </li>`,
          )
          .join('')}</ul>`,
      ).join('');
    $('#btn-credits').addEventListener('click', () => dialog.showModal());
    dialog.querySelector('.credits-close')!.addEventListener('click', () => dialog.close());
    // Click on the backdrop closes the dialog.
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
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

  /**
   * Panel layout: an always-visible header (title + live data) and tabbed details that can
   * be collapsed. The collapsed state is remembered per viewer.
   */
  private open(spec: { header: string; status?: string; tabs: PanelTab[]; back?: string }) {
    const tabs = spec.tabs.filter((t) => t.html.trim());
    const active = tabs.find((t) => t.id === this.lastTab) ?? tabs[0];
    const bar = tabs.length > 1
      ? `<nav class="tabs">${tabs.map((t) => `<button data-tab="${t.id}" class="${t === active ? 'on' : ''}">${t.label}${t.count ? `<sup>${t.count}</sup>` : ''}</button>`).join('')}</nav>`
      : '';
    this.panel.innerHTML = `
      <div class="ph">
        ${spec.header}
        <button class="collapse" data-collapse title="Свернуть / развернуть (I)" aria-label="Свернуть"><i></i></button>
      </div>
      ${spec.status ?? ''}
      <div class="live"></div>
      ${bar}
      <div class="tab-body">
        ${tabs.map((t) => `<section data-pane="${t.id}" ${t === active ? '' : 'hidden'}>${t.html}</section>`).join('')}
        ${spec.back ?? ''}
      </div>`;
    this.panel.classList.toggle('collapsed', this.collapsed);
    this.panel.classList.remove('show');
    void this.panel.offsetWidth; // restart the reveal animation
    this.panel.classList.add('show');
    this.panel.scrollTop = 0;
  }

  private selectTab(id: string) {
    this.lastTab = id;
    this.panel.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
    this.panel.querySelectorAll<HTMLElement>('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== id));
    this.setCollapsed(false);
    this.panel.scrollTop = 0;
  }

  setCollapsed(collapsed: boolean) {
    this.collapsed = collapsed;
    this.panel.classList.toggle('collapsed', collapsed);
    try {
      localStorage.setItem('cosmic.panelCollapsed', collapsed ? '1' : '0');
    } catch {
      /* storage unavailable: keep the in-memory state */
    }
  }

  toggleCollapsed() {
    if (this.panel.classList.contains('show')) this.setCollapsed(!this.collapsed);
  }

  /** Screen area covered by the panel (used to frame the camera), or null. */
  occlusion(): DOMRect | null {
    return this.panel.classList.contains('show') ? this.panel.getBoundingClientRect() : null;
  }

  showSystem() {
    this.setCrumbs();
    this.setActiveBody(null);
    this.panel.classList.remove('show');
  }

  showRegion(r: RegionDef) {
    this.crumbs.innerHTML = `<button data-crumb="system">Солнечная система</button><span class="sep">›</span><span class="cur">${r.name}</span>`;
    this.setActiveRegion(r.id);
    this.open({
      header: `<div class="kind" style="--c:${r.color}">${esc(r.kind)}</div><h2>${r.name}<small>${r.latin}</small></h2>`,
      tabs: [
        { id: 'overview', label: 'Обзор', html: `<p class="desc">${esc(r.description)}</p>` },
        { id: 'facts', label: 'Факты', html: factsTable(r.facts) },
      ],
      back: '<button class="back" data-back="system">← К системе</button>',
    });
  }

  showBody(b: BodyDef) {
    this.setCrumbs(b);
    this.setActiveBody(b.id);
    const sci = scienceOf(b.id);
    const moons = moonsOf(b.id);
    const moonList = moons.length
      ? `<ul class="moon-grid">${moons
          .map((m) => `<li><button data-body="${m.id}" style="--c:${m.color}">
            <span class="dot"></span><b>${m.name}</b><small>${esc(m.kind)} · R ${Math.round(m.radiusKm).toLocaleString('ru-RU')} км</small></button></li>`)
          .join('')}</ul>`
      : '';
    const parent = b.parent
      ? `<button class="near" data-body="${b.parent}"><span>Обращается вокруг</span><b>${bodyById(b.parent).name}</b></button>`
      : '';
    const cats = new Map<string, SiteCategory>();
    const siteList = b.sites.length
      ? `<ul class="sites">${b.sites
          .map((s, i) => {
            const c = categoryOf(s, b.id);
            cats.set(c.id, c);
            return `<li><button data-body="${b.id}" data-site="${s.id}" style="--cc:${c.color}">
              <span class="idx">${String(i + 1).padStart(2, '0')}</span>
              <span class="sn">${esc(s.name)}</span><span class="sk">${esc(s.kind)}</span></button></li>`;
          })
          .join('')}</ul>`
      : '';
    const legend = cats.size
      ? `<ul class="legend">${[...cats.values()].map((c) => `<li style="--cc:${c.color}">${c.label}</li>`).join('')}</ul>`
      : '';
    const sites = b.group === 'star'
      ? `<p class="tip">Поверхность Солнца — плазма, отдельных районов для посадки нет. Выберите планету.</p>`
      : `${legend}${siteList}<p class="tip">${b.sites.length ? 'Районы обведены на поверхности: наведите курсор, чтобы подсветить, и нажмите, чтобы изучить. ' : ''}Нажмите на любую другую точку, чтобы просканировать её.</p>`;
    this.open({
      header: `<div class="kind" style="--c:${b.color}">${esc(b.kind)}</div><h2>${b.name}<small>${b.latin}</small></h2>`,
      tabs: [
        {
          id: 'overview', label: 'Обзор',
          html: `${sci ? featureChips(sci) : ''}<p class="desc">${esc(b.description)}</p>${b.note ? `<p class="note-data">${esc(b.note)}</p>` : ''}${sci ? statTiles(b, sci) : ''}${parent}`,
        },
        { id: 'structure', label: 'Строение', html: sci ? structureView(b, sci) : '' },
        { id: 'facts', label: 'Факты', html: factsTable(b.facts) },
        { id: 'sites', label: 'Районы', count: b.sites.length, html: sites },
        { id: 'moons', label: 'Спутники', count: moons.length, html: moonList },
      ],
      back: '<button class="back" data-back="system">← К системе</button>',
    });
  }

  showSite(b: BodyDef, s: Site) {
    this.setCrumbs(b, s.name);
    const coord = s.elevation ? `${(b.radiusKm * s.elevation).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} км от центра, в плоскости колец` : formatLatLon(s.lat, s.lon);
    this.open({
      header: `<div class="kind" style="--c:${b.color}">${esc(s.kind)}</div><h2>${esc(s.name)}</h2><div class="coord">${b.name} · ${coord}</div>`,
      status: '<div class="scan"><span></span>Сканирование района…</div>',
      tabs: [{ id: 'overview', label: 'Обзор', html: `<p class="desc">${esc(s.description)}</p>${factsTable(s.facts ?? [])}` }],
      back: `<button class="back" data-back="body">← К ${b.group === 'moon' ? 'спутнику' : 'планете'}</button>`,
    });
  }

  showPoint(b: BodyDef, p: PointInfo) {
    this.setCrumbs(b, 'Произвольная точка');
    const near = p.nearest
      ? `<button class="near" data-body="${b.id}" data-site="${p.nearest.site.id}">
          <span>Ближайший изученный район</span><b>${esc(p.nearest.site.name)}</b>
          <em>${Math.round(p.nearest.km).toLocaleString('ru-RU')} км по поверхности</em></button>`
      : '';
    this.open({
      header: `<div class="kind" style="--c:${b.color}">Неисследованный сектор</div><h2>${formatLatLon(p.lat, p.lon)}</h2><div class="coord">${b.name}</div>`,
      status: '<div class="scan"><span></span>Сканирование сектора…</div>',
      tabs: [{ id: 'overview', label: 'Обзор', html: near }],
      back: '<button class="back" data-back="body">← Назад</button>',
    });
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
