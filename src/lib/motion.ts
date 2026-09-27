import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/**
 * Smooth scrolling that keeps native scroll semantics (keyboard, scrollbar,
 * find-in-page all keep working). Drives GSAP ScrollTrigger from the same ticker.
 * Skipped entirely when the user prefers reduced motion.
 */
export function startSmoothScroll(reducedMotion: boolean): () => void {
  if (reducedMotion) return () => {};
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

interface ScrollOptions {
  /** jump without animating */
  immediate?: boolean;
  /** seconds */
  duration?: number;
  /** ignore user scroll input until it's done (wheel, touch, keys) */
  lock?: boolean;
  onComplete?: () => void;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Scroll to an element or position, smoothly if Lenis is running (or instantly with `immediate`). */
export function scrollToTarget(target: HTMLElement | number, { immediate = false, duration = 2.4, lock = false, onComplete }: ScrollOptions = {}) {
  if (lenis) {
    lenis.scrollTo(
      target,
      immediate ? { immediate: true, force: true, onComplete } : { duration, lock, force: true, easing: easeInOutCubic, onComplete },
    );
    return;
  }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: 'instant' });
  onComplete?.();
}

export { gsap, ScrollTrigger };
