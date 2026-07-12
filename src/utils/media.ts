/** One-shot media query check; false when matchMedia is unavailable (SSR). */
export function matchesMedia(query: string): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;
}
