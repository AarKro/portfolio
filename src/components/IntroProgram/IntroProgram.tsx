import { channelOf, PROJECTS } from '../../data/projects';
import { GITHUB_URL, LINKEDIN_URL, NAME, TAGLINE } from '../../data/profile';
import { formatChannel } from '../../utils/broadcast';
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
      <h1 className="intro__title">{NAME}</h1>
      <p className="intro__subtitle">
        {TAGLINE}.
        <br />
        {program}: my pet projects, on every channel.
      </p>

      <p className="intro__hint">
        Use the <strong>CH ▲ / CH ▼</strong> buttons on the TV to flip through the channels.
      </p>

      <div className="intro__guide">
        <p className="intro__guide-title">— TV GUIDE —</p>
        <ul className="intro__guide-list">
          {PROJECTS.map((project, index) => {
            const channel = channelOf(index);
            return (
              <li key={project.id}>
                <button className="intro__guide-entry" onClick={() => tuneTo(channel)}>
                  <span className="intro__guide-channel">
                    CH {formatChannel(channel)}
                  </span>{' '}
                  {project.title}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="intro__contact">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <span aria-hidden="true"> · </span>
        <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
      </p>
    </div>
  );
}
