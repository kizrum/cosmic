/** Pointer, wheel and keyboard input on the map. */
import type { CameraDirector } from './CameraDirector';
import type { Cosmos } from './cosmos/cosmos';
import type { Display } from './display';
import type { Navigation } from './navigation';
import type { Picker } from './picking';
import type { Markers } from './scene/markers';
import type { Body } from './scene/SolarSystem';
import type { UI } from './ui/UI';

export interface InputDeps {
  canvas: HTMLCanvasElement;
  /** HTML label layers over the canvas (one per scale of the cosmos). */
  labelLayers: HTMLElement[];
  cosmos: Cosmos;
  nav: Navigation;
  picker: Picker;
  markers: Markers;
  director: CameraDirector;
  display: Display;
  ui: UI;
}

/**
 * Layout-independent key: Latin letters as typed (so AZERTY or Dvorak users press the
 * letter they see), otherwise the physical key (so Cyrillic layouts work too).
 */
const keyOf = (e: KeyboardEvent) =>
  /^[a-z]$/i.test(e.key) ? `Key${e.key.toUpperCase()}` : e.key === ',' ? 'Comma' : e.key === '.' ? 'Period' : e.code;

export function bindInput({ canvas, labelLayers, cosmos, nav, picker, markers, director, display, ui }: InputDeps) {
  /** Picking and hovering apply to the Solar System only, when it is on screen alone. */
  const solar = () => cosmos.realm === 'solar' && !cosmos.transitioning;
  /** Body under the pointer: highlighted label and orbit. */
  let hovered: Body | null = null;
  let downAt: { x: number; y: number } | null = null;

  for (const layer of labelLayers) {
    // Any click on the map (labels and markers included) hides the object list.
    layer.addEventListener('click', () => ui.setNavOpen(false), { capture: true });
    // The wheel over labels and site markers (HTML on top of the canvas) belongs to the scene:
    // hand it to the camera controls instead of letting the overlay swallow it.
    layer.addEventListener('wheel', (w) => {
      w.preventDefault();
      canvas.dispatchEvent(new WheelEvent('wheel', {
        deltaX: w.deltaX, deltaY: w.deltaY, deltaZ: w.deltaZ, deltaMode: w.deltaMode,
        clientX: w.clientX, clientY: w.clientY, ctrlKey: w.ctrlKey, metaKey: w.metaKey, shiftKey: w.shiftKey,
        bubbles: true, cancelable: true,
      }));
    }, { passive: false });
  }
  // Scrolling past the zoom limit moves on to the next scale of the cosmos.
  canvas.addEventListener('wheel', (e) => cosmos.onWheel(e), { passive: true });
  // Pinch on a touchpad arrives as ctrl+wheel: never let the browser zoom the whole page.
  // (Over the canvas the controls turn it into a camera zoom.)
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });
  // Safari's own pinch gesture events.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(type, (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => (downAt = { x: e.clientX, y: e.clientY }));
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || director.flying || !solar()) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 5) return;
    ui.setNavOpen(false);
    const focused = nav.focused;
    const hit = picker.surface(e.clientX, e.clientY, focused);
    if (hit && focused) {
      // Clicking inside an outlined region opens that region; elsewhere scans the point.
      const site = picker.siteAt(focused, hit.point);
      if (site && site !== nav.focusedSite) nav.focusSite(focused, site);
      else if (!site) nav.scanPoint(focused, hit.point);
      return;
    }
    const b = picker.body(e.clientX, e.clientY, focused);
    if (b) nav.focusBody(b);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons) return;
    if (!solar()) {
      canvas.style.cursor = 'grab';
      return;
    }
    const focused = nav.focused;
    const surf = picker.surface(e.clientX, e.clientY, focused);
    markers.hover.map = surf && focused ? picker.siteAt(focused, surf.point)?.id ?? null : null;
    const b = surf ? focused : picker.body(e.clientX, e.clientY, focused);
    if (b !== hovered) {
      hovered?.label.element.classList.remove('hover');
      hovered = b;
      hovered?.label.element.classList.add('hover');
    }
    canvas.style.cursor = b ? 'pointer' : 'grab';
  });

  const credits = document.querySelector<HTMLDialogElement>('#credits')!;
  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    // Browser shortcuts (Ctrl+L, Ctrl+S…) are not ours.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // Esc belongs to the credits dialog while it is open.
    if (credits.open) return;
    const key = keyOf(e);
    if (key === 'Escape' && ui.navOpen) ui.setNavOpen(false);
    else if (key === 'Escape' || key === 'Backspace') cosmos.back();
    else if (key === 'KeyL') display.toggleLight();
    else if (key === 'KeyM') display.toggleScale();
    else if (key === 'KeyO') display.toggleOrbits();
    else if (key === 'KeyS') ui.toggleSound();
    else if (key === 'KeyI') ui.toggleCollapsed();
    else if (key === 'Comma') ui.stepSpeed(-1);
    else if (key === 'Period') ui.stepSpeed(1);
    else if (key === 'Space') {
      document.querySelector<HTMLButtonElement>('#btn-play')!.click();
      e.preventDefault();
    }
  });

  return { hovered: () => hovered };
}
