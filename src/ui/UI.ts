import { BODIES, type BodyDef, type Site } from '../data/bodies';
import type { RegionDef } from '../data/regions';
import { formatLatLon } from '../astro';
import { categoryOf } from '../data/siteShapes';
import { bodyByIdL, bodyL, creditsL, noticesL, regionL, regionsL, scienceL } from '../data/localize';
import { EN_TIME } from '../data/en/misc';
import { fmtNum, lang, locale, setLang, t, type Lang } from '../i18n';
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

const presetText = (i: number) => (lang === 'ru' ? TIME_PRESETS[i] : { label: EN_TIME[i][0], title: EN_TIME[i][1] });

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

const moonsOf = (id: string) => BODIES.filter((b) => b.parent === id).map(bodyL);

/** Title with the Latin name underneath — skipped when it would just repeat the title. */
const title = (name: string, latin: string) =>
  `<h2>${esc(name)}${latin.toLowerCase() !== name.toLowerCase() ? `<small>${esc(latin)}</small>` : ''}</h2>`;

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
  toggleScale(): void;
}

export class UI {
  private readonly panel = $('#panel');
  private readonly crumbs = $('#crumbs');
  private readonly date = $('#sim-date');
  private readonly dateInput = $<HTMLInputElement>('#date-input');
  private readonly live = () => this.panel.querySelector('.live') as HTMLElement | null;
  private lastDate = '';
  private lastTab = 'overview';
  private activeId: string | null = null;
  private activeRegion: string | null = null;
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
    $('#btn-scale').addEventListener('click', () => h.toggleScale());
    document.querySelectorAll<HTMLElement>('[data-lang]').forEach((b) =>
      b.addEventListener('click', () => setLang(b.dataset.lang as Lang)),
    );
    this.panel.addEventListener('click', (e) => {
      const tg = e.target as HTMLElement;
      const tab = tg.closest<HTMLElement>('[data-tab]');
      if (tab) return this.selectTab(tab.dataset.tab!);
      if (tg.closest('[data-collapse]')) return this.setCollapsed(!this.collapsed);
      const site = tg.closest<HTMLElement>('[data-site]');
      if (site) return h.selectSite(site.dataset.body!, site.dataset.site!);
      const body = tg.closest<HTMLElement>('[data-body]');
      if (body) return h.selectBody(body.dataset.body!);
      const back = tg.closest<HTMLElement>('[data-back]');
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

  /** Re-render everything that holds language-dependent text (the panel is re-opened by the caller). */
  relang() {
    this.renderNav();
    this.renderCredits();
    this.setSpeedIndex(this.speedIndex);
    this.lastDate = '';
  }

  // ── Object list ─────────────────────────────────────────────────────────────
  private buildNav() {
    this.renderNav();
    $('#nav-groups').addEventListener('click', (e) => {
      const tg = e.target as HTMLElement;
      const btn = tg.closest<HTMLElement>('[data-body]');
      const reg = tg.closest<HTMLElement>('[data-region]');
      if (btn) this.h.selectBody(btn.dataset.body!);
      else if (reg) this.h.selectRegion(reg.dataset.region!);
      else return;
      this.setNavOpen(false);
    });
    $('#nav-toggle').addEventListener('click', () => this.setNavOpen(!this.navOpen));
  }

  private renderNav() {
    const latin = (name: string, l: string) => (l.toLowerCase() !== name.toLowerCase() ? `<span class="k">${l}</span>` : '<span class="k"></span>');
    const item = (raw: BodyDef) => {
      const b = bodyL(raw);
      return `<li><button data-body="${b.id}" style="--c:${b.color}">
        <span class="dot"></span><span class="n">${b.name}</span>${latin(b.name, b.latin)}</button>${this.subList(b.id)}</li>`;
    };
    const planets = BODIES.filter((b) => b.group === 'star' || b.group === 'planet');
    const dwarfs = BODIES.filter((b) => b.group === 'dwarf');
    $('#nav-groups').innerHTML = `
      <h4>${t('navPlanets')}</h4><ul class="nav-list">${planets.map(item).join('')}</ul>
      <h4>${t('navDwarfs')}</h4><ul class="nav-list">${dwarfs.map(item).join('')}</ul>
      <h4>${t('navBelts')}</h4><ul class="nav-list">${regionsL()
        .map((r) => `<li><button data-region="${r.id}" style="--c:${r.color}"><span class="dot ring"></span><span class="n">${r.name}</span>${latin(r.name, r.latin)}</button></li>`)
        .join('')}</ul>`;
    if (this.activeRegion) this.setActiveRegion(this.activeRegion);
    else this.setActiveBody(this.activeId);
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

  // ── Credits ─────────────────────────────────────────────────────────────────
  private buildCredits() {
    const dialog = $<HTMLDialogElement>('#credits');
    this.renderCredits();
    $('#btn-credits').addEventListener('click', () => dialog.showModal());
    dialog.querySelector('.credits-close')!.addEventListener('click', () => dialog.close());
    // Click on the backdrop closes the dialog.
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }

  private renderCredits() {
    const link = (url: string, text: string) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
    $('#credits-body').innerHTML =
      `<ul class="notices">${noticesL().map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` +
      creditsL()
        .map(
          (g) => `<h3>${esc(g.title)}</h3><ul class="credits-list">${g.entries
            .map(
              (e) => `<li>
              <div class="cw">${esc(e.what)}</div>
              <div class="ca">${e.source ? link(e.source, e.author) : esc(e.author)}</div>
              <div class="cl">${e.licenceUrl ? link(e.licenceUrl, e.licence) : esc(e.licence)}</div>
              ${e.changes ? `<div class="cc">${t('changes')}: ${esc(e.changes)}</div>` : ''}
            </li>`,
            )
            .join('')}</ul>`,
        )
        .join('');
  }

  // ── Time control ────────────────────────────────────────────────────────────
  private speedIndex = 1;
  /** Last non-zero speed, restored by the play button. */
  private runIndex = 1;

  private buildTime() {
    $('#btn-play').addEventListener('click', () => this.h.setSpeed(this.speedIndex === 0 ? this.runIndex : 0));
    $('#speed-down').addEventListener('click', () => this.stepSpeed(-1));
    $('#speed-up').addEventListener('click', () => this.stepSpeed(1));
    const pop = $('#date-pop');
    const btn = $('#date-btn');
    const setPop = (open: boolean) => {
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setPop(pop.hidden !== false);
    });
    document.addEventListener('pointerdown', (e) => {
      if (!pop.hidden && !(e.target as HTMLElement).closest('#date-pop, #date-btn')) setPop(false);
    });
    $('#btn-now').addEventListener('click', () => {
      this.h.resetNow();
      setPop(false);
    });
    this.dateInput.addEventListener('change', () => {
      // The input is in UTC (the whole UI shows UTC).
      const ms = Date.parse(this.dateInput.value + ':00Z');
      if (!Number.isNaN(ms)) this.h.setDate(ms);
    });
  }

  /** Step through the non-zero speeds; from pause, resume at the previous speed. */
  stepSpeed(dir: 1 | -1) {
    const from = this.speedIndex === 0 ? this.runIndex : this.speedIndex;
    const next = this.speedIndex === 0 ? from : Math.min(TIME_PRESETS.length - 1, Math.max(1, from + dir));
    this.h.setSpeed(next);
  }

  setSpeedIndex(i: number) {
    this.speedIndex = i;
    if (i > 0) this.runIndex = i;
    const shown = presetText(i > 0 ? i : this.runIndex);
    $('#speed-label').textContent = shown.label;
    $('#speed-label').title = shown.title;
    $('#btn-play').classList.toggle('paused', i === 0);
    $('#btn-play').setAttribute('aria-label', i === 0 ? t('play') : t('pause'));
    $('.time').classList.toggle('paused', i === 0);
    $('#speed-down').toggleAttribute('disabled', i === 1);
    $('#speed-up').toggleAttribute('disabled', i === TIME_PRESETS.length - 1);
  }

  /** Green "live" dot when the simulation runs in real time at the present moment. */
  setRealtime(live: boolean) {
    $('#date-btn').classList.toggle('is-live', live);
  }

  setToggle(id: 'light' | 'orbits' | 'scale', on: boolean) {
    $(`#btn-${id}`).classList.toggle('on', on);
  }

  setDate(d: Date) {
    const day = d.toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace(' г.', '');
    const time = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const s = `${day}, ${time} UTC`;
    if (s === this.lastDate) return;
    this.lastDate = s;
    this.date.textContent = s;
    if (document.activeElement !== this.dateInput && Number.isFinite(d.getTime())) {
      this.dateInput.value = d.toISOString().slice(0, 16);
    }
  }

  // ── Navigation state ────────────────────────────────────────────────────────
  setActiveBody(id: string | null) {
    this.activeId = id;
    this.activeRegion = null;
    const def = id ? BODIES.find((b) => b.id === id) : undefined;
    const open = def?.parent ?? id;
    document.querySelectorAll<HTMLElement>('#nav-groups [data-body]').forEach((b) => b.classList.toggle('active', b.dataset.body === id));
    document.querySelectorAll<HTMLElement>('#nav-groups [data-region]').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll<HTMLElement>('#nav-groups .sub').forEach((s) => s.classList.toggle('open', s.dataset.parent === open));
  }

  private setActiveRegion(id: string) {
    this.setActiveBody(null);
    this.activeRegion = id;
    document.querySelectorAll<HTMLElement>('#nav-groups [data-region]').forEach((b) => b.classList.toggle('active', b.dataset.region === id));
  }

  private setCrumbs(body?: BodyDef, leaf?: string) {
    const parts = [`<button data-crumb="system">${t('system')}</button>`];
    if (body?.parent) parts.push(`<button data-crumb="${body.parent}">${bodyByIdL(body.parent).name}</button>`);
    if (body) parts.push(`<button data-crumb="body" ${leaf ? '' : 'class="cur"'}>${body.name}</button>`);
    if (leaf) parts.push(`<span class="cur">${esc(leaf)}</span>`);
    this.crumbs.innerHTML = parts.join('<span class="sep">›</span>');
  }

  // ── Panel ───────────────────────────────────────────────────────────────────
  /**
   * Panel layout: an always-visible header (title + live data) and tabbed details that can
   * be collapsed. The collapsed state is remembered per viewer.
   */
  private open(spec: { header: string; status?: string; tabs: PanelTab[]; back?: string }, animate = true) {
    const tabs = spec.tabs.filter((tb) => tb.html.trim());
    const active = tabs.find((tb) => tb.id === this.lastTab) ?? tabs[0];
    const bar = tabs.length > 1
      ? `<nav class="tabs">${tabs.map((tb) => `<button data-tab="${tb.id}" class="${tb === active ? 'on' : ''}">${tb.label}${tb.count ? `<sup>${tb.count}</sup>` : ''}</button>`).join('')}</nav>`
      : '';
    const scroll = this.panel.scrollTop;
    this.panel.innerHTML = `
      <div class="ph">
        ${spec.header}
        <button class="collapse" data-collapse title="${t('collapse')}" aria-label="${t('collapse')}"><i></i></button>
      </div>
      ${spec.status ?? ''}
      <div class="live"></div>
      ${bar}
      <div class="tab-body">
        ${tabs.map((tb) => `<section data-pane="${tb.id}" ${tb === active ? '' : 'hidden'}>${tb.html}</section>`).join('')}
        ${spec.back ?? ''}
      </div>`;
    this.panel.classList.toggle('collapsed', this.collapsed);
    if (animate) {
      this.panel.classList.remove('show');
      void this.panel.offsetWidth; // restart the reveal animation
      this.panel.classList.add('show');
      this.panel.scrollTop = 0;
    } else {
      this.panel.scrollTop = scroll;
    }
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

  showRegion(raw: RegionDef, animate = true) {
    const r = regionL(raw);
    this.crumbs.innerHTML = `<button data-crumb="system">${t('system')}</button><span class="sep">›</span><span class="cur">${r.name}</span>`;
    this.setActiveRegion(r.id);
    this.open({
      header: `<div class="kind" style="--c:${r.color}">${esc(r.kind)}</div>${title(r.name, r.latin)}`,
      tabs: [
        { id: 'overview', label: t('tabOverview'), html: `<p class="desc">${esc(r.description)}</p>` },
        { id: 'facts', label: t('tabFacts'), html: factsTable(r.facts) },
      ],
      back: `<button class="back" data-back="system">${t('backSystem')}</button>`,
    }, animate);
  }

  showBody(raw: BodyDef, animate = true) {
    const b = bodyL(raw);
    this.setCrumbs(b);
    this.setActiveBody(b.id);
    const sci = scienceL(b.id);
    const moons = moonsOf(b.id);
    const moonList = moons.length
      ? `<ul class="moon-grid">${moons
          .map((m) => `<li><button data-body="${m.id}" style="--c:${m.color}">
            <span class="dot"></span><b>${m.name}</b><small>${esc(m.kind)} · R ${fmtNum(Math.round(m.radiusKm))} ${t('km')}</small></button></li>`)
          .join('')}</ul>`
      : '';
    const parent = b.parent
      ? `<button class="near" data-body="${b.parent}"><span>${t('orbits_around')}</span><b>${bodyByIdL(b.parent).name}</b></button>`
      : '';
    const cats = new Map<string, { id: string; color: string }>();
    const siteList = b.sites.length
      ? `<ul class="sites">${b.sites
          .map((s, i) => {
            // Categories are derived from the Russian source text.
            const c = categoryOf(raw.sites[i], b.id);
            cats.set(c.id, c);
            return `<li><button data-body="${b.id}" data-site="${s.id}" style="--cc:${c.color}">
              <span class="idx">${String(i + 1).padStart(2, '0')}</span>
              <span class="sn">${esc(s.name)}</span><span class="sk">${esc(s.kind)}</span></button></li>`;
          })
          .join('')}</ul>`
      : '';
    const catKey = { volcanic: 'catVolcanic', impact: 'catImpact', water: 'catWater', atmosphere: 'catAtmosphere', mission: 'catMission', terrain: 'catTerrain' } as const;
    const legend = cats.size
      ? `<ul class="legend">${[...cats.values()].map((c) => `<li style="--cc:${c.color}">${t(catKey[c.id as keyof typeof catKey])}</li>`).join('')}</ul>`
      : '';
    const sites = b.group === 'star'
      ? `<p class="tip">${t('sunNoSites')}</p>`
      : `${legend}${siteList}<p class="tip">${b.sites.length ? t('sitesTip') : ''}${t('scanTip')}</p>`;
    this.open({
      header: `<div class="kind" style="--c:${b.color}">${esc(b.kind)}</div>${title(b.name, b.latin)}`,
      tabs: [
        {
          id: 'overview', label: t('tabOverview'),
          html: `${sci ? featureChips(sci) : ''}<p class="desc">${esc(b.description)}</p>${b.note ? `<p class="note-data">${esc(b.note)}</p>` : ''}${sci ? statTiles(b, sci) : ''}${parent}`,
        },
        { id: 'structure', label: t('tabStructure'), html: sci ? structureView(b, sci) : '' },
        { id: 'facts', label: t('tabFacts'), html: factsTable(b.facts) },
        { id: 'sites', label: t('tabSites'), count: b.sites.length, html: sites },
        { id: 'moons', label: t('tabMoons'), count: moons.length, html: moonList },
      ],
      back: `<button class="back" data-back="system">${t('backSystem')}</button>`,
    }, animate);
  }

  showSite(raw: BodyDef, rawSite: Site, animate = true) {
    const b = bodyL(raw);
    const s = b.sites.find((x) => x.id === rawSite.id) ?? rawSite;
    this.setCrumbs(b, s.name);
    const coord = s.elevation ? `${fmtNum(b.radiusKm * s.elevation, { maximumFractionDigits: 0 })} ${t('ringPlane')}` : formatLatLon(s.lat, s.lon);
    this.open({
      header: `<div class="kind" style="--c:${b.color}">${esc(s.kind)}</div><h2>${esc(s.name)}</h2><div class="coord">${b.name} · ${coord}</div>`,
      status: animate ? `<div class="scan"><span></span>${t('scanSite')}</div>` : '',
      tabs: [{ id: 'overview', label: t('tabOverview'), html: `<p class="desc">${esc(s.description)}</p>${factsTable(s.facts ?? [])}` }],
      back: `<button class="back" data-back="body">${b.group === 'moon' ? t('backMoon') : t('backPlanet')}</button>`,
    }, animate);
  }

  showPoint(raw: BodyDef, p: PointInfo, animate = true) {
    const b = bodyL(raw);
    this.setCrumbs(b, t('randomPoint'));
    const nearName = p.nearest ? b.sites.find((x) => x.id === p.nearest!.site.id)?.name ?? p.nearest.site.name : '';
    const near = p.nearest
      ? `<button class="near" data-body="${b.id}" data-site="${p.nearest.site.id}">
          <span>${t('nearestSite')}</span><b>${esc(nearName)}</b>
          <em>${fmtNum(Math.round(p.nearest.km))} ${t('alongSurface')}</em></button>`
      : '';
    this.open({
      header: `<div class="kind" style="--c:${b.color}">${t('unexplored')}</div><h2>${formatLatLon(p.lat, p.lon)}</h2><div class="coord">${b.name}</div>`,
      status: animate ? `<div class="scan"><span></span>${t('scanSector')}</div>` : '',
      tabs: [{ id: 'overview', label: t('tabOverview'), html: near }],
      back: `<button class="back" data-back="body">${t('backBody')}</button>`,
    }, animate);
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
