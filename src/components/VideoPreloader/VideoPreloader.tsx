import './VideoPreloader.scss';

interface VideoPreloaderProps {
  /** Video URLs to warm in the background (typically the prev/next channels). */
  urls: string[];
}

/**
 * Renders off-screen `<video preload="auto">` elements so the given clips are
 * fetched ahead of time — used to warm the channels on either side of the
 * current one. Kept out of `display:none` (some browsers skip loading hidden
 * media) and zero-sized so it never affects layout or paint.
 */
export function VideoPreloader({ urls }: VideoPreloaderProps) {
  return (
    <div className="video-preloader" aria-hidden="true">
      {urls.map((url) => (
        <video key={url} src={url} preload="auto" muted playsInline tabIndex={-1} />
      ))}
    </div>
  );
}
