import type { VideoSources } from '../../data/projects';
import { ClipSources } from '../ClipSources/ClipSources';
import './VideoPreloader.scss';

interface VideoPreloaderProps {
  /** Clips to warm in the background (typically the prev/next channels). */
  sources: VideoSources[];
}

/**
 * Renders off-screen `<video preload="auto">` elements so the given clips are
 * fetched ahead of time — used to warm the channels on either side of the
 * current one. Each lists both codec `<source>`s, so the browser warms only the
 * one it will actually play. Kept out of `display:none` (some browsers skip
 * loading hidden media) and zero-sized so it never affects layout or paint.
 */
export function VideoPreloader({ sources }: VideoPreloaderProps) {
  return (
    <div className="video-preloader" aria-hidden="true">
      {sources.map((s) => (
        <video key={s.h264} preload="auto" muted playsInline tabIndex={-1}>
          <ClipSources sources={s} />
        </video>
      ))}
    </div>
  );
}
