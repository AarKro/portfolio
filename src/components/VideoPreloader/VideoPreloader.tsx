import { useEffect, useState } from 'react';
import type { VideoSources } from '../../data/projects';
import { ClipSources } from '../ClipSources/ClipSources';
import './VideoPreloader.scss';

/** Gap between successive clips starting to fetch, so earlier ones get priority. */
const STAGGER_MS = 350;

interface VideoPreloaderProps {
  /** Clips to warm, already ordered by loading priority (highest first). */
  sources: VideoSources[];
}

/**
 * Renders off-screen `<video preload="auto">` elements so the given clips are
 * fetched ahead of time — used to warm the channels around the current one.
 * Each lists both codec `<source>`s, so the browser warms only the one it will
 * actually play. Kept out of `display:none` (some browsers skip loading hidden
 * media) and zero-sized so it never affects layout or paint.
 *
 * The clips mount one at a time (staggered), so the first in `sources` starts
 * fetching first and gets bandwidth priority over the later ones — that's how
 * the caller expresses ordering (nearest/forward channels ahead of the rest).
 */
export function VideoPreloader({ sources }: VideoPreloaderProps) {
  // Restart the stagger whenever the neighbour set changes (channel switch).
  const signature = sources.map((s) => s.h264).join('|');
  const [mounted, setMounted] = useState(1);

  useEffect(() => {
    setMounted(1);
  }, [signature]);

  useEffect(() => {
    if (mounted >= sources.length) return;
    const timer = window.setTimeout(() => setMounted((n) => n + 1), STAGGER_MS);
    return () => window.clearTimeout(timer);
  }, [mounted, sources.length]);

  return (
    <div className="video-preloader" aria-hidden="true">
      {sources.slice(0, mounted).map((s) => (
        <video key={s.h264} preload="auto" muted playsInline tabIndex={-1}>
          <ClipSources sources={s} />
        </video>
      ))}
    </div>
  );
}
