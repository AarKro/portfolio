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

/** Scroll to an element or position, smoothly if Lenis is running (or instantly with `immediate`). */
export function scrollToTarget(target: HTMLElement | number, { immediate = false } = {}) {
  if (lenis) {
    lenis.scrollTo(target, immediate ? { immediate: true, force: true } : { duration: 2.4 });
    return;
  }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: 'instant' });
}

export { gsap, ScrollTrigger };
