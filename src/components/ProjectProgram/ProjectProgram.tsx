import { useEffect, useRef, useState } from 'react';
import type { Project } from '../../data/projects';
import { StaticNoise } from '../StaticNoise/StaticNoise';
import { ClipSources } from '../ClipSources/ClipSources';
import { Teletext } from '../Teletext/Teletext';
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
 * A project channel: a full-bleed backdrop (teaser clip or SMPTE test card)
 * with a lower-third "bug" over it. TELETEXT swaps the picture for the Mode 7
 * page; the broadcast keeps playing behind it.
 */
export function ProjectProgram({ project, channel }: ProjectProgramProps) {
  // cover the teaser with static until the clip actually plays
  const [videoLoading, setVideoLoading] = useState(true);
  const [teletextOpen, setTeletextOpen] = useState(false);

  // leaving the channel closes teletext
  useEffect(() => {
    setTeletextOpen(false);
  }, [project.id]);

  // Closing the page unmounts it with focus inside (dropping focus to <body>);
  // hand it back to the TELETEXT toggle. Skipped when focus survived the close
  // (e.g. the user clicked a control-panel button instead).
  const teletextButtonRef = useRef<HTMLButtonElement>(null);
  const wasTeletextOpen = useRef(false);
  useEffect(() => {
    const was = wasTeletextOpen.current;
    wasTeletextOpen.current = teletextOpen;
    if (was && !teletextOpen && document.activeElement === document.body) {
      teletextButtonRef.current?.focus();
    }
  }, [teletextOpen]);

  // show static until the clip plays, with a safety timeout so a clip that
  // never fires `playing` doesn't stay covered
  useEffect(() => {
    if (!project.videoUrl) return;
    setVideoLoading(true);
    const timer = window.setTimeout(() => setVideoLoading(false), VIDEO_LOAD_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [project.id, project.videoUrl]);

  // a single VIEW CODE button, or one pill with a link per repo for bundles
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

  return (
    <div className={`program program--broadcast ${teletextOpen ? 'is-teletext' : ''}`}>
      {project.videoUrl ? (
        <>
          {/* Key by project so the element remounts on channel change —
              swapping <source> children alone won't reselect the source
              without a manual video.load(). */}
          <video
            key={project.id}
            className="program__video"
            aria-label={`Silent preview clip of ${project.title}`}
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
            ref={teletextButtonRef}
            className="program__action program__action--teletext"
            onClick={() => setTeletextOpen(true)}
            aria-expanded={teletextOpen}
            aria-controls={teletextOpen ? 'teletext-page' : undefined}
          >
            TELETEXT
            <ActionIcon glyph="▤" />
          </button>
          {sourceControl}
          {project.demoUrl && (
            <a className="program__action" href={project.demoUrl} target="_blank" rel="noreferrer">
              OPEN DEMO
              <ActionIcon glyph="↗" />
            </a>
          )}
        </div>
      </div>

      {teletextOpen && (
        <Teletext project={project} channel={channel} onClose={() => setTeletextOpen(false)} />
      )}
    </div>
  );
}
