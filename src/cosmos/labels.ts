/** Clickable name labels for the neighbourhood and Galaxy views (same look as body labels). */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export interface Label {
  object: CSS2DObject;
  name: HTMLElement;
  /** Higher-priority labels win when names overlap. */
  priority: number;
}

export function makeLabel(text: string, color: string, onClick: () => void, cls = '', priority = 1): Label {
  const el = document.createElement('div');
  el.className = `body-label ${cls}`;
  el.style.setProperty('--c', color);
  el.innerHTML = '<span class="dot"></span><span class="name"></span>';
  const name = el.querySelector<HTMLElement>('.name')!;
  name.textContent = text;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return { object: new CSS2DObject(el), name, priority };
}

const pos = new THREE.Vector3();
const widths = new WeakMap<HTMLElement, number>();

/** Hide the names that would overlap a higher-priority one (dots stay). */
export function layoutLabels(labels: Label[], camera: THREE.Camera) {
  const halfW = window.innerWidth / 2, halfH = window.innerHeight / 2;
  const items: { l: Label; x: number; y: number }[] = [];
  for (const l of labels) {
    if (!l.object.visible) continue;
    l.object.getWorldPosition(pos).project(camera);
    if (pos.z > 1 || Math.abs(pos.x) > 1.2 || Math.abs(pos.y) > 1.2) continue;
    items.push({ l, x: (pos.x + 1) * halfW, y: (1 - pos.y) * halfH });
  }
  items.sort((a, b) => b.l.priority - a.l.priority);
  const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
  for (const it of items) {
    let w = widths.get(it.l.name);
    if (!w) {
      w = it.l.name.offsetWidth;
      if (w) widths.set(it.l.name, w);
    }
    const box = { x0: it.x + 13, x1: it.x + 17 + (w || 80), y0: it.y - 9, y1: it.y + 9 };
    const hit = placed.some((p) => box.x0 < p.x1 && box.x1 > p.x0 && box.y0 < p.y1 && box.y1 > p.y0);
    it.l.object.element.classList.toggle('crowded', hit);
    if (!hit) placed.push(box);
  }
}

/** Re-measure label widths after their text changed (language switch). */
export function relabel(l: Label, text: string) {
  l.name.textContent = text;
  widths.delete(l.name);
}
