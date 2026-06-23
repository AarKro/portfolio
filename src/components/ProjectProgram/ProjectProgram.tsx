import { useEffect, useState } from 'react';
import type { Project } from '../../data/projects';
import { formatChannel } from '../../utils/broadcast';
import { renderInlineLinks } from '../InlineLink/InlineLink';
import { StaticNoise } from '../StaticNoise/StaticNoise';
import { ClipSources } from '../ClipSources/ClipSources';
import './ProjectProgram.scss';

/** Safety net: never show loading noise forever if the teaser never starts */
const VIDEO_LOAD_TIMEOUT = 6000;

interface ProjectProgramProps {
  project: Project;
  channel: number;
}

/** Trailing glyph on an action label: external ↗, teletext ▤, close ▾. */
function ActionIcon({ glyph }: { glyph: string }) {
  return (
    <span className="program__action-icon" aria-hidden="true">
      {glyph}
    </span>
  );
}

/**
 * A project channel. Every channel shares one "broadcast" layout: a full-bleed
 * backdrop (autoplay teaser if the project has a `videoUrl`, else an SMPTE test
 * card) with a lower-third "bug" over it (title, tech, links, teletext toggle).
 * Pressing TELETEXT slides the bug up and a teletext page of detailed project
 * info — description, behind-the-scenes, and the same action links — into view.
 */
export function ProjectProgram({ project, channel }: ProjectProgramProps) {
  // Cover the teaser with static until the clip actually plays
  const [videoLoading, setVideoLoading] = useState(true);
  // Teletext page revealed over the broadcast
  const [teletextOpen, setTeletextOpen] = useState(false);

  // Leaving the channel closes teletext
  useEffect(() => {
    setTeletextOpen(false);
  }, [project.id]);

  // Each time we land on a video channel, show static until it plays (with a
  // safety timeout so a clip that never fires `playing` doesn't stay covered).
  useEffect(() => {
    if (!project.videoUrl) return;
    setVideoLoading(true);
    const timer = window.setTimeout(() => setVideoLoading(false), VIDEO_LOAD_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [project.id, project.videoUrl]);

  const channelLabel = formatChannel(channel);

  // Source code: a single VIEW CODE button, or — for a bundled channel — one
  // pill matching the other buttons, sectioned into a link per repo.
  const sourceControl = project.repos ? (
    <div className="program__source-group">
      {project.repos.map((repo) => (
        <a
          key={repo.url}
          className="program__source"
          href={repo.url}
          target="_blank"
          rel="noreferrer"
        >
          {repo.name}
          <ActionIcon glyph="↗" />
        </a>
      ))}
    </div>
  ) : project.githubUrl ? (
    <a className="program__action" href={project.githubUrl} target="_blank" rel="noreferrer">
      VIEW CODE
      <ActionIcon glyph="↗" />
    </a>
  ) : null;

  // The same source/demo links live on the bug and on the teletext page, so
  // they're reachable whether or not the teletext page is open.
  const actionLinks = (
    <>
      {sourceControl}
      {project.demoUrl && (
        <a className="program__action" href={project.demoUrl} target="_blank" rel="noreferrer">
          OPEN DEMO
          <ActionIcon glyph="↗" />
        </a>
      )}
    </>
  );

  return (
    <div className={`program program--broadcast ${teletextOpen ? 'is-teletext' : ''}`}>
      {/* Backdrop: the teaser clip, or a full-bleed test card when there's none */}
      {project.videoUrl ? (
        <>
          {/* Key by project so the element remounts on channel change —
              swapping <source> children alone won't reselect the source
              without a manual video.load(), so navigation would otherwise
              keep showing the previous (or no) clip until the load timeout. */}
          <video
            key={project.id}
            className="program__video"
            poster={project.posterUrl}
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            onPlaying={() => setVideoLoading(false)}
          >
            <ClipSources sources={project.videoUrl} />
          </video>
          <StaticNoise active={videoLoading} />
        </>
      ) : (
        <div className="program__testcard" aria-hidden="true">
          <div className="program__testcard-bars" />
          <p className="program__testcard-caption">NO LIVE FEED ON THIS CHANNEL</p>
        </div>
      )}

      {/* Sliding deck: the bug page, with the teletext page stacked below it */}
      <div className="program__deck">
        <div className="program__deck-track">
          <div className="program__page program__page--bug">
            <div className="program__bug">
              <h2 className="program__title">{project.title}</h2>
              <ul className="program__tech">
                {project.tech.map((tag) => (
                  <li key={tag} className="program__tag">
                    {tag}
                  </li>
                ))}
              </ul>
              <div className="program__actions">
                <button
                  className="program__action program__action--teletext"
                  onClick={() => setTeletextOpen(true)}
                  aria-expanded={teletextOpen}
                >
                  TELETEXT
                  <ActionIcon glyph="▤" />
                </button>
                {actionLinks}
              </div>
            </div>
          </div>

          <div
            className="program__page program__page--teletext"
            aria-hidden={!teletextOpen}
          >
            <article className="program__teletext">
              <header className="program__teletext-head">
                <span>P1{channelLabel}</span>
                <span className="program__teletext-brand">AARKRO TV</span>
                <span>CH {channelLabel}</span>
              </header>
              <h3 className="program__teletext-title">{project.title}</h3>
              <p className="program__teletext-body">{renderInlineLinks(project.description)}</p>
              {project.behindTheScenes && (
                <p className="program__teletext-behind">
                  <span className="program__behind-label">BEHIND THE SCENES</span>
                  {renderInlineLinks(project.behindTheScenes)}
                </p>
              )}
              {/* same row, same screen position as the bug's actions — the
                  links don't move, the toggle just morphs TELETEXT → CLOSE */}
              <div className="program__actions program__teletext-actions">
                <button
                  className="program__action program__action--teletext"
                  onClick={() => setTeletextOpen(false)}
                >
                  CLOSE TELETEXT
                  <ActionIcon glyph="▾" />
                </button>
                {actionLinks}
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
