import { useEffect, useRef, useState } from 'react';
import type { Project } from '../../data/projects';
import { StaticNoise } from '../StaticNoise';
import './ProjectProgram.scss';

/** Safety net: never show loading noise forever if the iframe never fires `load` */
const FEED_LOAD_TIMEOUT = 6000;

interface ProjectProgramProps {
  project: Project;
  channel: number;
  /** Fires the TV's static burst, so tuning in/out feels like a channel change */
  onStatic: () => void;
}

/** A project channel: program info card, or the live demo when tuned in. */
export function ProjectProgram({ project, channel, onStatic }: ProjectProgramProps) {
  const [watching, setWatching] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const loadTimeout = useRef<number | undefined>(undefined);

  // Leaving the channel always stops the live feed
  useEffect(() => {
    setWatching(false);
    setFeedLoading(false);
  }, [project.id]);

  useEffect(() => () => window.clearTimeout(loadTimeout.current), []);

  const tuneIn = () => {
    setWatching(true);
    setFeedLoading(true);
    onStatic();
    window.clearTimeout(loadTimeout.current);
    loadTimeout.current = window.setTimeout(() => setFeedLoading(false), FEED_LOAD_TIMEOUT);
  };

  const tuneOut = () => {
    setWatching(false);
    setFeedLoading(false);
    onStatic();
  };

  if (watching && project.embedUrl) {
    return (
      <div className="program program--live">
        <iframe
          className="program__feed"
          src={project.embedUrl}
          title={`Live demo of ${project.title}`}
          allow="camera; microphone; fullscreen; xr-spatial-tracking"
          onLoad={() => setFeedLoading(false)}
        />
        {/* the demo stays "static" until its feed has actually loaded */}
        <StaticNoise active={feedLoading} />
        <button className="program__stop" onClick={tuneOut}>
          ◼ BACK TO INFO
        </button>
      </div>
    );
  }

  return (
    <div className="program">
      {!project.embedUrl && (
        <div className="program__testcard" aria-hidden="true">
          <div className="program__testcard-bars" />
          <p className="program__testcard-caption">NO LIVE FEED ON THIS CHANNEL</p>
        </div>
      )}

      <p className="program__pretitle">
        CH {String(channel).padStart(2, '0')} · NOW SHOWING
      </p>
      <h2 className="program__title">{project.title}</h2>
      <p className="program__description">{project.description}</p>

      {project.behindTheScenes && (
        <p className="program__behind">
          <span className="program__behind-label">BEHIND THE SCENES:</span>{' '}
          {project.behindTheScenes}
        </p>
      )}

      <ul className="program__tech">
        {project.tech.map((tag) => (
          <li key={tag} className="program__tag">
            {tag}
          </li>
        ))}
      </ul>

      <div className="program__actions">
        {project.embedUrl && (
          <button className="program__action program__action--primary" onClick={tuneIn}>
            ▶ TUNE IN LIVE
          </button>
        )}
        <a className="program__action" href={project.githubUrl} target="_blank" rel="noreferrer">
          VIEW CODE ↗
        </a>
        {project.demoUrl && (
          <a className="program__action" href={project.demoUrl} target="_blank" rel="noreferrer">
            OPEN DEMO ↗
          </a>
        )}
      </div>
    </div>
  );
}
