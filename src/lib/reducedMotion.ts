import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(query).matches;
}

/** Live value of prefers-reduced-motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
