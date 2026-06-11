import { FIRST_PROJECT_CHANNEL, PROJECTS } from '../../../data/projects';
import './IntroProgram.scss';

interface IntroProgramProps {
  tuneTo: (channel: number) => void;
}

/** News-anchor greeting matching the viewer's clock. */
function broadcastSlot(): { greeting: string; program: string } {
  const hour = new Date().getHours();
  if (hour < 5) return { greeting: 'Up late?', program: 'Tonight’s program' };
  if (hour < 12) return { greeting: 'Good morning.', program: 'This morning’s program' };
  if (hour < 18) return { greeting: 'Good afternoon.', program: 'This afternoon’s program' };
  return { greeting: 'Good evening.', program: 'Tonight’s program' };
}

/** Channel 1 — the station ident: who is broadcasting, and how to watch. */
export function IntroProgram({ tuneTo }: IntroProgramProps) {
  const { greeting, program } = broadcastSlot();

  return (
    <div className="intro">
      <p className="intro__pretitle">*** LIVE ***</p>
      <p className="intro__greeting">{greeting} You’re tuned in to</p>
      <h1 className="intro__title">Aaron Kromer</h1>
      <p className="intro__subtitle">
        Frontend Developer &amp; Interaction Designer.
        <br />
        {program}: my projects, on every channel.
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
          GitHub
        </a>
        <span aria-hidden="true"> · </span>
        <a
          href="https://www.linkedin.com/in/aaron-kromer-a3026b193/"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
        <span aria-hidden="true"> · </span>
        <a href="mailto:kromer.aaron@gmail.com">kromer.aaron@gmail.com</a>
      </p>
    </div>
  );
}
