import type { VideoSources } from '../../data/projects';

/**
 * AV1 Main profile. The level digits are advisory — browsers gate on whether
 * they can decode `av01` at all, then fall through to the H.264 `<source>`.
 */
const AV1_TYPE = 'video/mp4; codecs="av01.0.05M.08"';

interface ClipSourcesProps {
  sources: VideoSources;
}

/**
 * `<source>` children for a `<video>`: AV1 first (when the clip has been
 * re-encoded), H.264 always as the fallback. The browser plays the first it can
 * decode — modern engines take AV1, everything else uses H.264. No JS, no
 * bandwidth detection. Render as a child of `<video>`:
 *
 *   <video …><ClipSources sources={project.videoUrl} /></video>
 */
export function ClipSources({ sources }: ClipSourcesProps) {
  return (
    <>
      {sources.av1 && <source src={sources.av1} type={AV1_TYPE} />}
      <source src={sources.h264} type="video/mp4" />
    </>
  );
}
