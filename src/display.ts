import { scale } from './scene/scale';
import type { UI } from './ui/UI';

/** Display switches shared by the settings menu, the keyboard and the navigation. */
export class Display {
  lightBoost = false;
  /** The fill light was switched on by a night-side site, not by the viewer. */
  private lightAuto = false;
  showOrbits = true;

  constructor(private readonly ui: UI) {
    ui.setToggle('orbits', this.showOrbits);
    ui.setToggle('light', this.lightBoost);
    ui.setToggle('scale', scale.target === 1);
  }

  get autoLit() {
    return this.lightAuto;
  }

  private setLight(on: boolean, auto: boolean) {
    this.lightBoost = on;
    this.lightAuto = on && auto;
    this.ui.setToggle('light', on);
  }

  toggleLight() {
    this.setLight(!this.lightBoost, false);
  }

  toggleOrbits() {
    this.showOrbits = !this.showOrbits;
    this.ui.setToggle('orbits', this.showOrbits);
  }

  setScale(real: boolean) {
    scale.target = real ? 1 : 0;
    this.ui.setToggle('scale', real);
  }

  toggleScale() {
    this.setScale(scale.target === 0);
  }

  /**
   * Night-side sites would be black: switch the fill light on, and off again when leaving
   * (clearAutoLight). Returns true when it was switched on now.
   */
  autoLight(night: boolean) {
    if (night && !this.lightBoost) {
      this.setLight(true, true);
      return true;
    }
    if (!night) this.clearAutoLight();
    return false;
  }

  clearAutoLight() {
    if (this.lightAuto) this.setLight(false, false);
  }
}
