import { useEffect, useState } from 'react';
import type { Project } from '../../data/projects';
import './ProjectProgram.scss';

interface ProjectProgramProps {
  project: Project;
  channel: number;
}

/** A project channel: program info card, or the live demo when tuned in. */
export function ProjectProgram({ project, channel }: ProjectProgramProps) {
  const [watching, setWatching] = useState(false);

  // Leaving the channel always stops the live feed
  useEffect(() => setWatching(false), [project.id]);

  if (watching && project.embedUrl) {
    return (
      <div className="program program--live">
        <iframe
          className="program__feed"
          src={project.embedUrl}
          title={`Live demo of ${project.title}`}
        />
        <button className="program__stop" onClick={() => setWatching(false)}>
          ◼ BACK TO INFO
        </button>
      </div>
    );
  }

  return (
    <div className="program">
      <p className="program__pretitle">
        CH {String(channel).padStart(2, '0')} · NOW SHOWING
      </p>
      <h2 className="program__title">{project.title}</h2>
      <p className="program__description">{project.description}</p>

      <ul className="program__tech">
        {project.tech.map((tag) => (
          <li key={tag} className="program__tag">
            {tag}
          </li>
        ))}
      </ul>

      <div className="program__actions">
        {project.embedUrl && (
          <button className="program__action program__action--primary" onClick={() => setWatching(true)}>
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
