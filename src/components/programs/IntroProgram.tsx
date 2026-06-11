import { FIRST_PROJECT_CHANNEL, PROJECTS } from '../../data/projects';
import './IntroProgram.scss';

interface IntroProgramProps {
  tuneTo: (channel: number) => void;
}

/** Channel 1 — the station ident: who is broadcasting, and how to watch. */
export function IntroProgram({ tuneTo }: IntroProgramProps) {
  return (
    <div className="intro">
      <p className="intro__pretitle">*** NOW BROADCASTING ***</p>
      <h1 className="intro__title">
        Hey, it&apos;s <span className="intro__name">Aaron</span>
      </h1>
      <p className="intro__subtitle">
        Welcome to my portfolio. Every channel on this set is one of my projects.
      </p>

      <p className="intro__hint">
        Use the <strong>CH ▲ / CH ▼</strong> buttons on the TV (or the{' '}
        <strong>← →</strong> arrow keys) to flip through the channels.
      </p>

      <div className="intro__guide">
        <p className="intro__guide-title">— TV GUIDE —</p>
        <ul className="intro__guide-list">
          {PROJECTS.map((project, index) => {
            const channel = index + FIRST_PROJECT_CHANNEL;
            return (
              <li key={project.id}>
                <button className="intro__guide-entry" onClick={() => tuneTo(channel)}>
                  <span className="intro__guide-channel">
                    CH {String(channel).padStart(2, '0')}
                  </span>{' '}
                  {project.title}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="intro__contact">
        <a href="https://github.com/AarKro" target="_blank" rel="noreferrer">
          github.com/AarKro
        </a>
        <span aria-hidden="true"> · </span>
        <a href="mailto:kromer.aaron@gmail.com">kromer.aaron@gmail.com</a>
      </p>
    </div>
  );
}
