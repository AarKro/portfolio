import { type VideoSources } from '../data/projects';

// Clip-preloading policy shared by the desktop TV and the mobile feed, so the
// two experiences load videos identically.

/** How far ahead/behind the active channel we warm clips (in channels). */
export const PRELOAD_RADIUS = 2;

/**
 * Loading priority for a clip `delta` channels from the active one — nearest
 * first, forward before backward (0 → +1 → −1 → +2 → −2). Lower = sooner.
 */
export function preloadRank(delta: number): number {
  if (delta === 0) return 0;
  return (Math.abs(delta) - 1) * 2 + (delta < 0 ? 1 : 0) + 1;
}

/**
 * The clips within ±PRELOAD_RADIUS of `activeChannel` that have a video,
 * sorted by loading priority. The active channel itself is excluded: its own
 * <video> element loads it directly when it plays.
 */
export function orderedNeighborClips(
  activeChannel: number,
  sourceAt: (channel: number) => VideoSources | undefined,
): VideoSources[] {
  const deltas: number[] = [];
  for (let d = -PRELOAD_RADIUS; d <= PRELOAD_RADIUS; d++) {
    if (d !== 0) deltas.push(d);
  }
  return deltas
    .sort((a, b) => preloadRank(a) - preloadRank(b))
    .map((d) => sourceAt(activeChannel + d))
    .filter((s): s is VideoSources => Boolean(s));
}
