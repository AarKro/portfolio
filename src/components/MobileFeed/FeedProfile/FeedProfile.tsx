import { FIRST_PROJECT_CHANNEL, PROJECTS } from '../../../data/projects';
import GithubIcon from '../../../assets/icons/github.svg?react';
import LinkedinIcon from '../../../assets/icons/linkedin.svg?react';
import './FeedProfile.scss';

interface FeedProfileProps {
  open: boolean;
  /** Channel whose tile shows the "just viewed" badge (or null). */
  justViewedChannel: number | null;
  /** Open a project from its tile. */
  onOpenProject: (channel: number) => void;
}

/**
 * The profile page: a fixed, tap-only overlay (NOT a swipe card). A dark,
 * immersive hero — drifting aurora backdrop, a glowing chromatic "AK" monogram
 * (echoes the mobile favicon), name → tagline → social links — over the
 * unchanged thumbnail grid of every project. Tapping a tile opens that project.
 * Reached only via the rail profile icon. Content mirrors the SEO block.
 */
export function FeedProfile({ open, justViewedChannel, onOpenProject }: FeedProfileProps) {
  return (
    <section className={`feed__profile ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      {/* drifting aurora backdrop — purely decorative */}
      <div className="feed__aurora" aria-hidden="true">
        <span className="feed__aurora-blob feed__aurora-blob--cyan" />
        <span className="feed__aurora-blob feed__aurora-blob--pink" />
        <span className="feed__aurora-blob feed__aurora-blob--violet" />
        <span className="feed__aurora-grain" />
      </div>

      <header className="feed__profile-head">
        <div className="feed__profile-id">
          {/* name over a large, faint chromatic "AK" watermark (mobile favicon) */}
          <div className="feed__nameplate">
            <span className="feed__monogram" aria-hidden="true">
              AK
            </span>
            <h1 className="feed__intro-title">Aaron Kromer</h1>
          </div>
          <p className="feed__intro-kicker">Frontend Developer &amp; Interaction Designer</p>
          <p className="feed__intro-contact">
            <a href="https://github.com/AarKro" target="_blank" rel="noreferrer">
              <GithubIcon />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/aaron-kromer-a3026b193/"
              target="_blank"
              rel="noreferrer"
            >
              <LinkedinIcon />
              LinkedIn
            </a>
          </p>
        </div>
        <p className="feed__intro-sub">Tap a project and swipe away!</p>
      </header>

      <div className="feed__grid">
        {PROJECTS.map((project, index) => {
          const channel = index + FIRST_PROJECT_CHANNEL;
          return (
            <button
              key={project.id}
              className={`feed__tile ${justViewedChannel === channel ? 'is-just-viewed' : ''}`}
              onClick={() => onOpenProject(channel)}
              aria-label={`Open ${project.title}`}
            >
              {project.posterUrl ? (
                <img className="feed__tile-media" src={project.posterUrl} alt="" loading="lazy" />
              ) : (
                <span className="feed__tile-testcard" aria-hidden="true" />
              )}
              <span className="feed__tile-title">{project.title}</span>
              {justViewedChannel === channel && <span className="feed__tile-badge">Just viewed</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
