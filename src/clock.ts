import { dateFromDays, daysFromDate } from './astro';
import { TIME_PRESETS } from './ui/UI';

/**
 * Rotation is exact (IAU) up to 1 hour/s. Faster time warps would strobe the surfaces,
 * so rotation then advances at 1 hour/s and snaps back to the exact value afterwards.
 */
export const SPIN_EXACT_MAX = 1 / 24;

/** Simulation time (days from J2000, UTC) and the time-warp preset. */
export class SimClock {
  days = daysFromDate(Date.now());
  /** Clock that drives body rotation: equals `days` except under fast time warps. */
  spinDays = this.days;
  speedIndex = 1;
  /** Time warp to restore after surface inspection, which runs in real time. */
  private speedBeforeSite: number | null = null;

  /** `onSpeed` mirrors every speed change in the interface. */
  constructor(private readonly onSpeed: (index: number) => void) {}

  get date() {
    return dateFromDays(this.days);
  }

  /** Running in real time at the present moment. */
  get live() {
    return this.speedIndex === 1 && Math.abs(this.days - daysFromDate(Date.now())) < 2 / 1440;
  }

  setSpeed(i: number) {
    this.speedIndex = i;
    this.speedBeforeSite = null;
    this.onSpeed(i);
  }

  setDate(ms: number) {
    this.days = daysFromDate(ms);
    this.spinDays = this.days;
  }

  resetNow() {
    this.setDate(Date.now());
    this.setSpeed(1);
  }

  /** Surface inspection runs in real time: fast warps would strobe day and night. */
  holdRealtime() {
    if (TIME_PRESETS[this.speedIndex].days > SPIN_EXACT_MAX && this.speedBeforeSite === null) {
      this.speedBeforeSite = this.speedIndex;
      this.speedIndex = 1;
      this.onSpeed(1);
    }
  }

  /** Restore the time warp that was active before inspecting a site. */
  releaseRealtime() {
    if (this.speedBeforeSite === null) return;
    this.speedIndex = this.speedBeforeSite;
    this.speedBeforeSite = null;
    this.onSpeed(this.speedIndex);
  }

  step(dt: number) {
    const speed = TIME_PRESETS[this.speedIndex].days;
    this.days += speed * dt;
    if (speed <= SPIN_EXACT_MAX) this.spinDays = this.days;
    else this.spinDays += SPIN_EXACT_MAX * dt;
  }
}
