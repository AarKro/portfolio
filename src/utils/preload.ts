import { type VideoSources } from '../data/projects';

// Shared clip-preloading policy for BOTH views (the desktop TV and the mobile
// feed). Both warm the teaser clips around the current channel ahead of time
// and hand the ordered list to <VideoPreloader>, which staggers the fetches so
// higher-priority clips grab bandwidth first. Keeping the policy here means the
// two experiences load videos identically.

/** How far ahead/behind the active channel we warm clips (in channels). */
export const PRELOAD_RADIUS = 2;

/**
 * Loading priority for a clip `delta` channels from the active one: the active
 * clip first, then the forward channel ahead of the equidistant one behind
 * (0 → +1 → −1 → +2 → −2 ⇒ ranks 0,1,2,3,4). Lower rank = fetched sooner.
 */
export function preloadRank(delta: number): number {
  if (delta === 0) return 0;
  return (Math.abs(delta) - 1) * 2 + (delta < 0 ? 1 : 0) + 1;
}

/**
 * The clips within ±PRELOAD_RADIUS of `activeChannel` that actually have a
 * video, sorted by loading priority (forward-first). `sourceAt` maps a channel
 * to its clip (or undefined for the intro / sourceless / out-of-range channels)
 * — desktop passes the landscape `videoUrl`, the feed its portrait
 * `mobileVideoUrl`. The active channel itself is excluded: its own <video>
 * element loads it directly when it plays.
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
