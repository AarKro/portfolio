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
 * Off-screen `<video preload="auto">` elements that warm the given clips ahead
 * of time. Mounted one at a time (staggered) so earlier entries in `sources`
 * get bandwidth priority. Zero-sized but NOT display:none — some browsers skip
 * loading hidden media.
 */
export function VideoPreloader({ sources }: VideoPreloaderProps) {
  // restart the stagger whenever the neighbour set changes (channel switch)
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
